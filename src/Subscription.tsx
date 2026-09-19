import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Plan = {
name: string;
price: number;
description: string;
features: string[];
};

const plans: Plan[] = [
{
name: "Free",
price: 0,
description: "For small clinics getting started",
features: [
"Up to 50 patients",
"Appointment management",
"Basic clinic profile",
"Basic services",
],
},
{
name: "Professional",
price: 499,
description: "For growing dental clinics",
features: [
"Unlimited patients",
"Appointment management",
"Patient medical records",
"Payments tracking",
"Reviews management",
"Clinic profile",
],
},
{
name: "Premium",
price: 999,
description: "For clinics that need more features",
features: [
"Everything in Professional",
"Advanced reports",
"Priority support",
"Advanced financial management",
"More clinic features",
],
},
];

const planTranslations = {
ar: {
Free: {
name: "مجاني",
description: "للعيادات الصغيرة التي تبدأ استخدام النظام",
features: [
"حتى 50 مريضًا",
"إدارة المواعيد",
"ملف أساسي للعيادة",
"الخدمات الأساسية",
],
},
Professional: {
name: "احترافي",
description: "للعيادات المتنامية",
features: [
"عدد غير محدود من المرضى",
"إدارة المواعيد",
"السجلات الطبية للمرضى",
"متابعة المدفوعات",
"إدارة التقييمات",
"ملف العيادة",
],
},
Premium: {
name: "مميز",
description: "للعيادات التي تحتاج إلى مزايا أكثر",
features: [
"كل مزايا الخطة الاحترافية",
"تقارير متقدمة",
"دعم ذو أولوية",
"إدارة مالية متقدمة",
"مزايا إضافية للعيادة",
],
},
},
en: {
Free: {
name: "Free",
description: "For small clinics getting started",
features: [
"Up to 50 patients",
"Appointment management",
"Basic clinic profile",
"Basic services",
],
},
Professional: {
name: "Professional",
description: "For growing dental clinics",
features: [
"Unlimited patients",
"Appointment management",
"Patient medical records",
"Payments tracking",
"Reviews management",
"Clinic profile",
],
},
Premium: {
name: "Premium",
description: "For clinics that need more features",
features: [
"Everything in Professional",
"Advanced reports",
"Priority support",
"Advanced financial management",
"More clinic features",
],
},
},
};

const planNameMap: Record<string, string> = {
Free: "Free",
Professional: "Professional",
Premium: "Premium",
};

const Subscription = () => {
const navigate = useNavigate();

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


  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const savedPlan = localStorage.getItem(
      "dentalcare-selected-doctor-plan"
    );

    if (
      savedPlan &&
      plans.some((plan) => plan.name === savedPlan)
    ) {
      setSelectedPlan(savedPlan);
    } else {
      setSelectedPlan(null);
    }

    setClinicId(null);
    setLoading(false);
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    const savedPlan = localStorage.getItem(
      "dentalcare-selected-doctor-plan"
    );

    if (
      savedPlan &&
      plans.some((plan) => plan.name === savedPlan)
    ) {
      setSelectedPlan(savedPlan);
    } else {
      setSelectedPlan(null);
    }

    setClinicId(null);
    setLoading(false);
    return;
  }

  if (!profile.clinic_id) {
    const savedPlan = localStorage.getItem(
      "dentalcare-selected-doctor-plan"
    );

    if (
      savedPlan &&
      plans.some((plan) => plan.name === savedPlan)
    ) {
      setSelectedPlan(savedPlan);
    } else {
      setSelectedPlan(null);
    }

    setClinicId(null);
    setLoading(false);
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

  if (
    clinic?.subscription_plan &&
    plans.some((plan) => plan.name === clinic.subscription_plan)
  ) {
    setSelectedPlan(clinic.subscription_plan);
  } else {
    setSelectedPlan(null);
  }

  setLoading(false);
};

loadSubscription();


}, [language]);

const handleSelectPlan = async (planName: string) => {
setMessage("");
setErrorMessage("");

const planExists = plans.some((plan) => plan.name === planName);

if (!planExists) {
  setErrorMessage(
    language === "ar"
      ? "الخطة المحددة غير متاحة."
      : "The selected plan is not available."
  );
  return;
}

if (!clinicId) {
  setSelectedPlan(planName);

  localStorage.setItem(
    "dentalcare-selected-doctor-plan",
    planName
  );

  const translatedPlanName =
    planTranslations[language][
      planNameMap[planName] as keyof typeof planTranslations[typeof language]
    ]?.name || planName;

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
    subscription_plan: planName,
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

setSelectedPlan(planName);

localStorage.removeItem("dentalcare-selected-doctor-plan");

const translatedPlanName =
  planTranslations[language][
    planNameMap[planName] as keyof typeof planTranslations[typeof language]
  ]?.name || planName;

setMessage(
  language === "ar"
    ? `تم تغيير خطتك إلى ${translatedPlanName}.`
    : `Your plan has been changed to ${translatedPlanName}.`
);

setSaving(false);


};

if (loading) {
return ( <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"> <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 text-center shadow-sm"> <p className="text-slate-600 dark:text-slate-300">
{t.common.loading} </p> </div> </div>
);
}

return (
<div
dir={isArabic ? "rtl" : "ltr"}
className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-32"
> <div className="mx-auto max-w-7xl"> <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> <div> <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
{t.dashboard.subscription} </h1>

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

    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.name;

        const translatedPlan =
          planTranslations[language][
            plan.name as keyof typeof planTranslations[typeof language]
          ];

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

                <span
                  className={isArabic ? "mr-1" : "ml-1"}
                >
                  {isArabic ? "الخطة المختارة" : "Selected Plan"}
                </span>
              </div>
            )}

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {translatedPlan.name}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {translatedPlan.description}
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
              {translatedPlan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span className="font-bold text-teal-600">
                    ✓
                  </span>

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
                saving
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
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
            {isArabic
              ? "خطتك الحالية هي "
              : "Your current plan is "}

            <span className="font-semibold text-teal-600">
              {
                planTranslations[language][
                  selectedPlan as keyof typeof planTranslations[typeof language]
                ]?.name || selectedPlan
              }
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
