import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Mail,
  CreditCard,
  LockKeyhole,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

const ToothIcon = ({
  className = "h-6 w-6",
}: {
  className?: string;
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2c-2.2 0-3.3 1.1-4.5 1.1S5 2 3.6 2C2 2 1 3.6 1 5.8c0 2.7.9 5 1.6 7.2.6 2 1.1 4.2 2 5.7.6 1 1.3 1.3 1.9 1.3.9 0 1.2-1 1.5-2.3.3-1.2.6-2.7 1.6-2.7s1.3 1.5 1.6 2.7c.3 1.3.6 2.3 1.5 2.3.6 0 1.3-.3 1.9-1.3.9-1.5 1.4-3.7 2-5.7C17.1 10.8 18 8.5 18 5.8 18 3.6 17 2 15.4 2c-1.4 0-2.3 1.1-3.4 1.1S12.9 2 12 2Z"
      fill="currentColor"
    />
  </svg>
);

type DoctorProfile = {
  name: string;
  email: string;
  avatar_url: string | null;
};

type Subscription = {
  plan: string | null;
  endDate: string | null;
  clinicName: string | null;
};

// الباقات بتتحمل من جدول plans في Supabase
type PlanInfo = {
  name: string;
  name_ar: string;
  name_en: string;
  price: number;
};

// يحوّل رقم الواتساب لصيغة دولية صحيحة لـ wa.me
// مثال: 01012345678 -> 201012345678  |  0020101... -> 20101...
const normalizeWhatsAppNumber = (raw: string) => {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = "20" + digits.slice(1);
  }

  return digits;
};

const DoctorSettings = () => {
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [platformWhatsapp, setPlatformWhatsapp] =
    useState("");
  const [platformEmail, setPlatformEmail] =
    useState("");

  // رابط جروب الواتساب (بيتحمل من site_settings.whatsapp_group_url)
  const [whatsappGroupUrl, setWhatsappGroupUrl] =
    useState("");

  const [plans, setPlans] = useState<PlanInfo[]>([]);

  const [loading, setLoading] = useState(true);

  const getPlanLabel = (plan: string | null, isArabic: boolean) => {
    if (!plan) return "-";
    const found = plans.find(
      (p) => p.name.toLowerCase() === plan.toLowerCase()
    );
    if (!found) return plan;
    return (isArabic ? found.name_ar : found.name_en) || found.name;
  };

  // تغيير كلمة المرور
  const [showPasswordSection, setShowPasswordSection] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("name, email, avatar_url, clinic_id")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error("Error loading profile:", profileError);
      }

      setDoctor({
        name: profile?.name || "",
        email: profile?.email || user.email || "",
        avatar_url: (profile as any)?.avatar_url || null,
      });

      let clinicData: any = null;

      if ((profile as any)?.clinic_id) {
        const { data: clinic, error: clinicError } =
          await supabase
            .from("clinics")
            .select(
              "name, subscription_plan, subscription_end_date"
            )
            .eq("id", (profile as any).clinic_id)
            .maybeSingle();

        if (clinicError) {
          console.error(
            "Error loading clinic subscription:",
            clinicError
          );
        }

        clinicData = clinic;
      } else {
        console.error("This profile has no clinic_id.");
      }

      setSubscription({
        plan: clinicData?.subscription_plan || null,
        endDate: clinicData?.subscription_end_date || null,
        clinicName: clinicData?.name || null,
      });

      // قراءة بيانات التواصل مع المنصة من Supabase
      const {
        data: siteSettings,
        error: siteSettingsError,
      } = await supabase
        .from("site_settings")
        .select("whatsapp, email")
        .limit(1)
        .maybeSingle();

      if (siteSettingsError) {
        console.error(
          "Error loading platform contact information:",
          siteSettingsError
        );
      } else {
        setPlatformWhatsapp(siteSettings?.whatsapp || "");
        setPlatformEmail(siteSettings?.email || "");
      }

      // رابط جروب الواتساب (استعلام منفصل علشان لو العمود مش موجود
      // ماتتعطلش باقي بيانات التواصل)
      const {
        data: groupSettings,
        error: groupSettingsError,
      } = await supabase
        .from("site_settings")
        .select("whatsapp_group_url")
        .limit(1)
        .maybeSingle();

      if (groupSettingsError) {
        console.error(
          "Error loading WhatsApp group link:",
          groupSettingsError
        );
      } else {
        setWhatsappGroupUrl(
          (groupSettings as any)?.whatsapp_group_url || ""
        );
      }

      // قراءة أسماء الباقات من Supabase
      const { data: plansData, error: plansError } =
        await supabase
          .from("plans")
          .select("name, name_ar, name_en, price");

      if (plansError) {
        console.error("Error loading plans:", plansError);
      } else {
        setPlans((plansData as PlanInfo[]) || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/doctor/login";
  };

  const handleChangePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setPasswordMessage(null);

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: isArabic
          ? "من فضلك املأ جميع الحقول."
          : "Please fill in all fields.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: isArabic
          ? "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."
          : "The new password must be at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: isArabic
          ? "كلمة المرور الجديدة وتأكيدها غير متطابقين."
          : "The new passwords do not match.",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setPasswordMessage({
          type: "error",
          text: isArabic
            ? "لم يتم العثور على بيانات حسابك."
            : "Your account information could not be found.",
        });
        setChangingPassword(false);
        return;
      }

      // التأكد من كلمة المرور الحالية
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (signInError) {
        setPasswordMessage({
          type: "error",
          text: isArabic
            ? "كلمة المرور الحالية غير صحيحة."
            : "The current password is incorrect.",
        });
        setChangingPassword(false);
        return;
      }

      // تغيير كلمة المرور في Supabase Auth
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        console.error(
          "Error changing password:",
          updateError
        );

        setPasswordMessage({
          type: "error",
          text: isArabic
            ? "حدث خطأ أثناء تغيير كلمة المرور."
            : "Something went wrong while changing the password.",
        });

        setChangingPassword(false);
        return;
      }

      // تسجيل الخروج بعد تغيير كلمة المرور
      await supabase.auth.signOut();

      // تحويل الدكتور إلى صفحة تسجيل الدخول
      window.location.href = "/doctor/login";
    } catch (error) {
      console.error(
        "Unexpected password change error:",
        error
      );

      setPasswordMessage({
        type: "error",
        text: isArabic
          ? "حدث خطأ غير متوقع."
          : "An unexpected error occurred.",
      });

      setChangingPassword(false);
    }
  };

  const daysLeft = (() => {
    if (!subscription?.endDate) return null;

    const end = new Date(subscription.endDate);
    end.setHours(23, 59, 59, 999);

    return Math.ceil(
      (end.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
  })();

  const isExpired =
    daysLeft !== null && daysLeft < 0;

  const isEndingSoon =
    daysLeft !== null &&
    daysLeft >= 0 &&
    daysLeft <= 7;

  const BackChevron = isArabic
    ? ChevronLeft
    : ChevronRight;

  const openWhatsApp = (message: string) => {
    if (!platformWhatsapp) {
      console.error("Platform WhatsApp number is empty.");
      return;
    }

    const number = normalizeWhatsAppNumber(platformWhatsapp);

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleWhatsApp = () =>
    openWhatsApp(
      isArabic
        ? "مرحباً، أحتاج مساعدة بخصوص حسابي على DentalCare"
        : "Hello, I need help with my DentalCare account"
    );

  const handleRenew = () => {
    const planName = getPlanLabel(
      subscription?.plan ?? null,
      isArabic
    );
    const clinic =
      subscription?.clinicName || doctor?.name || "";

    openWhatsApp(
      isArabic
        ? `مرحباً، أرغب في تجديد اشتراكي على DentalCare.\nالعيادة: ${clinic}\nالباقة الحالية: ${planName}\nالبريد: ${doctor?.email}`
        : `Hello, I'd like to renew my DentalCare subscription.\nClinic: ${clinic}\nCurrent plan: ${planName}\nEmail: ${doctor?.email}`
    );
  };

  const emailHref = platformEmail
    ? `mailto:${platformEmail}?subject=${encodeURIComponent(
        isArabic
          ? "استفسار بخصوص DentalCare"
          : "DentalCare inquiry"
      )}`
    : undefined;

  // رابط الجروب: بنقبل بس الروابط اللي بتبدأ بـ https://
  const groupHref = /^https:\/\//i.test(
    whatsappGroupUrl.trim()
  )
    ? whatsappGroupUrl.trim()
    : undefined;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      {/* ==================== Main column ==================== */}
      <div className="w-full">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <Link
            to="/doctor/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <BackChevron className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {isArabic ? "الإعدادات" : "Settings"}
            </h1>

            <p className="text-xs text-slate-400">
              {isArabic
                ? "الاشتراك والدعم وتسجيل الخروج"
                : "Subscription, support and logout"}
            </p>
          </div>

          {!loading && doctor && (
            <div className="ms-auto flex items-center gap-2">
              {doctor.avatar_url ? (
                <img
                  src={doctor.avatar_url}
                  alt={doctor.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  {doctor.name?.charAt(0) || "D"}
                </span>
              )}

              <div className="hidden text-end sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {isArabic
                    ? `د. ${doctor.name}`
                    : `Dr. ${doctor.name}`}
                </p>

                <p className="text-xs text-slate-400">
                  {doctor.email}
                </p>
              </div>
            </div>
          )}
        </header>

        <main className="px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* معلومات الاشتراك */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                  <CreditCard className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "معلومات الاشتراك"
                      : "Subscription"}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {isArabic
                      ? "الباقة الحالية والأيام المتبقية"
                      : "Current plan and remaining days"}
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  {isArabic
                    ? "جاري التحميل..."
                    : "Loading..."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-xs text-slate-400">
                      {isArabic ? "الباقة" : "Plan"}
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {getPlanLabel(
                        subscription?.plan ?? null,
                        isArabic
                      )}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-4 ${
                      isExpired
                        ? "bg-red-50 dark:bg-red-950/30"
                        : isEndingSoon
                        ? "bg-orange-50 dark:bg-orange-950/30"
                        : "bg-green-50 dark:bg-green-950/30"
                    }`}
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isArabic
                        ? "الأيام المتبقية"
                        : "Days left"}
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold ${
                        isExpired
                          ? "text-red-600 dark:text-red-400"
                          : isEndingSoon
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {daysLeft === null
                        ? "-"
                        : isExpired
                        ? isArabic
                          ? "منتهي"
                          : "Expired"
                        : isArabic
                        ? `${daysLeft} يوم`
                        : `${daysLeft} days`}
                    </p>
                  </div>

                  {subscription?.endDate && (
                    <p className="col-span-2 text-xs text-slate-400">
                      {isArabic
                        ? "ينتهي في: "
                        : "Ends on: "}

                      {new Date(
                        subscription.endDate
                      ).toLocaleDateString(
                        isArabic
                          ? "ar-EG"
                          : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  )}

                  {/* زر تجديد الاشتراك */}
                  <button
                    type="button"
                    onClick={handleRenew}
                    disabled={!platformWhatsapp}
                    className={`col-span-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isExpired
                        ? "bg-red-600 hover:bg-red-700"
                        : isEndingSoon
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-teal-600 hover:bg-teal-700"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />

                    {isExpired
                      ? isArabic
                        ? "جدّد اشتراكك الآن"
                        : "Renew now"
                      : isArabic
                      ? "تجديد الاشتراك"
                      : "Renew subscription"}
                  </button>
                </div>
              )}
            </div>

            {/* بانر تغيير كلمة المرور */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(
                    !showPasswordSection
                  );
                  setPasswordMessage(null);
                }}
                className="flex w-full items-center gap-3 p-5 text-start"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <LockKeyhole className="h-5 w-5" />
                </span>

                <div className="flex-1">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "تغيير كلمة المرور"
                      : "Change Password"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {isArabic
                      ? "اضغط هنا لتغيير كلمة المرور"
                      : "Click here to change your password"}
                  </p>
                </div>

                {isArabic ? (
                  showPasswordSection ? (
                    <ChevronLeft className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )
                ) : showPasswordSection ? (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {showPasswordSection && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-5 dark:border-slate-800">
                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-4"
                  >
                    {/* كلمة المرور الحالية */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {isArabic
                          ? "كلمة المرور الحالية"
                          : "Current password"}
                      </label>

                      <div className="relative">
                        <input
                          type={
                            showCurrentPassword
                              ? "text"
                              : "password"
                          }
                          value={currentPassword}
                          onChange={(e) =>
                            setCurrentPassword(
                              e.target.value
                            )
                          }
                          placeholder={
                            isArabic
                              ? "أدخل كلمة المرور الحالية"
                              : "Enter your current password"
                          }
                          className={`w-full rounded-xl border border-slate-200 bg-white py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                            isArabic
                              ? "pl-12 pr-4"
                              : "pl-4 pr-12"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(
                              !showCurrentPassword
                            )
                          }
                          className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${
                            isArabic
                              ? "left-4"
                              : "right-4"
                          }`}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* كلمة المرور الجديدة */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {isArabic
                          ? "كلمة المرور الجديدة"
                          : "New password"}
                      </label>

                      <div className="relative">
                        <input
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          value={newPassword}
                          onChange={(e) =>
                            setNewPassword(
                              e.target.value
                            )
                          }
                          placeholder={
                            isArabic
                              ? "أدخل كلمة المرور الجديدة"
                              : "Enter your new password"
                          }
                          className={`w-full rounded-xl border border-slate-200 bg-white py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                            isArabic
                              ? "pl-12 pr-4"
                              : "pl-4 pr-12"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(
                              !showNewPassword
                            )
                          }
                          className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${
                            isArabic
                              ? "left-4"
                              : "right-4"
                          }`}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* تأكيد كلمة المرور */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {isArabic
                          ? "تأكيد كلمة المرور الجديدة"
                          : "Confirm new password"}
                      </label>

                      <div className="relative">
                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(
                              e.target.value
                            )
                          }
                          placeholder={
                            isArabic
                              ? "أعد كتابة كلمة المرور الجديدة"
                              : "Re-enter your new password"
                          }
                          className={`w-full rounded-xl border border-slate-200 bg-white py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                            isArabic
                              ? "pl-12 pr-4"
                              : "pl-4 pr-12"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${
                            isArabic
                              ? "left-4"
                              : "right-4"
                          }`}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {passwordMessage && (
                      <div
                        className={`rounded-xl px-4 py-3 text-sm ${
                          passwordMessage.type ===
                          "success"
                            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        }`}
                      >
                        {passwordMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LockKeyhole className="h-4 w-4" />

                      {changingPassword
                        ? isArabic
                          ? "جاري تغيير كلمة المرور..."
                          : "Changing password..."
                        : isArabic
                        ? "تغيير كلمة المرور"
                        : "Change password"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* التواصل مع المنصة */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <MessageCircle className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "التواصل مع المنصة"
                      : "Contact the platform"}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {isArabic
                      ? "لأي استفسار أو مشكلة أو تجديد اشتراك"
                      : "For questions, issues or renewals"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  disabled={!platformWhatsapp}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />

                  {isArabic
                    ? "تواصل عبر واتساب"
                    : "Chat on WhatsApp"}
                </button>

                {/* Email */}
                <a
                  href={emailHref}
                  aria-disabled={!emailHref}
                  onClick={(e) => {
                    if (!emailHref) e.preventDefault();
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${
                    !emailHref
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  <Mail className="h-4 w-4 text-teal-600" />

                  {isArabic
                    ? "راسلنا بالإيميل"
                    : "Send an email"}
                </a>

                {platformEmail && (
                  <p
                    className="px-1 text-xs text-slate-400"
                    dir="ltr"
                  >
                    {platformEmail}
                  </p>
                )}

                {/* WhatsApp group (يظهر بس لو الرابط موجود في Supabase) */}
                {groupHref && (
                  <a
                    href={groupHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-950/50"
                  >
                    <Users className="h-4 w-4 shrink-0" />

                    <span className="flex-1">
                      {isArabic
                        ? "انضم إلى جروب الواتساب"
                        : "Join our WhatsApp group"}

                      <span className="mt-0.5 block text-xs font-normal text-green-600/80 dark:text-green-400/80">
                        {isArabic
                          ? "لمعرفة كل جديد على المنصة"
                          : "Stay up to date with everything new"}
                      </span>
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* تسجيل الخروج */}
            <button
              onClick={handleLogout}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />

              {isArabic
                ? "تسجيل الخروج"
                : "Logout"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorSettings;