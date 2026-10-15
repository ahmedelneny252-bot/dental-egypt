import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

// الباقات بتتحمل من جدول plans في Supabase
type Plan = {
  name: string; // المفتاح المخزن في clinics.subscription_plan
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  features_ar: string[];
  features_en: string[];
};

const SAVED_PLAN_KEY = "dentalcare-selected-doctor-plan";

const Subscription = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [clinicId, setClinicId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // helpers لعرض بيانات الباقة حسب اللغة
  const planName = (plan: Plan) =>
    (isArabic ? plan.name_ar : plan.name_en) || plan.name;

  const planDescription = (plan: Plan) =>
    isArabic ? plan.description_ar : plan.description_en;

  const planFeatures = (plan: Plan) => {
    const list = isArabic ? plan.features_ar : plan.features_en;
    return list && list.length > 0
      ? list
      : plan.features_en || plan.features_ar || [];
  };

  const planNameByKey = (key: string) => {
    const found = plans.find((p) => p.name === key);
    return found ? planName(found) : key;
  };

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");
      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    const loadSubscription = async () => {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      // 1) تحميل الباقات من Supabase
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(
          "name, name_ar, name_en, description_ar, description_en, price, features_ar, features_en"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (plansError) {
        console.error("Plans loading error:", plansError);
      }

      const loadedPlans: Plan[] = (plansData as Plan[] | null) || [];
      setPlans(loadedPlans);

      // لو مفيش clinic: نستخدم الباقة المحفوظة محلياً (قبل التسجيل)
      const useSavedPlan = () => {
        const savedPlan = localStorage.getItem(SAVED_PLAN_KEY);

        if (
          savedPlan &&
          loadedPlans.some((plan) => plan.name === savedPlan)
        ) {
          setSelectedPlan(savedPlan);
        } else {
          setSelectedPlan(null);
        }

        setClinicId(null);
        setLoading(false);
      };

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        useSavedPlan();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || !profile.clinic_id) {
        useSavedPlan();
        return;
      }

      setClinicId(profile.clinic_id);

      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("subscription_plan, subscription_status")
        .eq("id", profile.clinic_id)
        .single();

      if (clinicError) {
        console.error("Clinic subscription error:", clinicError);

        setErrorMessage(
          language === "ar"
            ? "تعذر تحميل اشتراكك."
            : "Unable to load your subscription."
        );

        setLoading(false);
        return;
      }

      // نحتفظ بالباقة الحالية حتى لو اتقفلت من الأدمن (is_active = false)
      setSelectedPlan(clinic?.subscription_plan || null);

      setLoading(false);
    };

    loadSubscription();
  }, []);

  const handleSelectPlan = async (selectedName: string) => {
    setMessage("");
    setErrorMessage("");

    const chosen = plans.find((plan) => plan.name === selectedName);

    if (!chosen) {
      setErrorMessage(
        language === "ar"
          ? "الخطة المحددة غير متاحة."
          : "The selected plan is not available."
      );
      return;
    }

    const translatedPlanName = planName(chosen);

    if (!clinicId) {
      setSelectedPlan(selectedName);

      localStorage.setItem(SAVED_PLAN_KEY, selectedName);

      setMessage(
        language === "ar"
          ? `تم اختيار خطة ${translatedPlanName}. سيتم نقلك لإنشاء حساب الدكتور.`
          : `${translatedPlanName} plan selected. You will be redirected to create your doctor account.`
      );

      setTimeout(() => {
        navigate("/doctor/register");
      }, 700);

      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("clinics")
      .update({
        subscription_plan: selectedName,
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
      })
      .eq("id", clinicId);

    if (error) {
      console.error("Subscription update error:", error);

      setErrorMessage(
        language === "ar"
          ? "تعذر تحديث اشتراكك."
          : "Unable to update your subscription."
      );

      setSaving(false);
      return;
    }

    setSelectedPlan(selectedName);

    localStorage.removeItem(SAVED_PLAN_KEY);

    setMessage(
      language === "ar"
        ? `تم تغيير خطتك إلى ${translatedPlanName}.`
        : `Your plan has been changed to ${translatedPlanName}.`
    );

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <p className="text-slate-600 dark:text-slate-300">
            {t.common.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t.dashboard.subscription}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "اختر الخطة التي تناسب عيادتك."
                : "Choose the plan that works best for your clinic."}
            </p>
          </div>

          <Link
            to="/doctor/dashboard"
            className="w-fit rounded-xl bg-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isArabic ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
          </Link>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {plans.length === 0 && !errorMessage && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {isArabic
              ? "لا توجد باقات متاحة حالياً."
              : "No plans are available right now."}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name;

            return (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 bg-white p-6 shadow-sm transition dark:bg-slate-900 ${
                  isSelected
                    ? "border-teal-600 shadow-lg shadow-teal-600/10"
                    : "border-transparent dark:border-slate-800"
                }`}
              >
                {isSelected && (
                  <div className="mb-4 inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    <span>✓</span>

                    <span className={isArabic ? "mr-1" : "ml-1"}>
                      {isArabic ? "الخطة المختارة" : "Selected Plan"}
                    </span>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {planName(plan)}
                </h2>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {planDescription(plan)}
                </p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>

                  <span
                    className={`${
                      isArabic ? "mr-2" : "ml-2"
                    } text-slate-500 dark:text-slate-400`}
                  >
                    {isArabic ? "جنيه / شهر" : "EGP / month"}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {planFeatures(plan).map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                    >
                      <span className="font-bold text-teal-600">✓</span>

                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`mt-8 w-full rounded-xl px-4 py-3 font-semibold transition ${
                    isSelected
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  } ${
                    saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
                >
                  {saving
                    ? isArabic
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isSelected && clinicId
                    ? isArabic
                      ? "الخطة الحالية"
                      : "Current Plan"
                    : isSelected && !clinicId
                    ? isArabic
                      ? "متابعة التسجيل"
                      : "Continue Registration"
                    : isArabic
                    ? "اختيار الخطة"
                    : "Choose Plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          {clinicId && selectedPlan ? (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isArabic ? "الخطة الحالية" : "Current Plan"}
              </h2>

              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {isArabic ? "خطتك الحالية هي " : "Your current plan is "}

                <span className="font-semibold text-teal-600">
                  {planNameByKey(selectedPlan)}
                </span>
                .
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isArabic ? "ابدأ كدكتور" : "Get Started as a Doctor"}
              </h2>

              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {isArabic
                  ? "اختر الخطة المناسبة لك، ثم أنشئ حساب الدكتور وبيانات العيادة."
                  : "Choose the plan that works for you, then create your doctor account and clinic."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
