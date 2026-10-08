
import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { Eye, EyeOff, LogIn, Phone } from "lucide-react";

import { supabase } from "./supabase";

import { translations, type Language } from "./i18n";

// ============================================================

// أدوات الرقم والإيميل الداخلي

// الإيميل ده بيتولّد تلقائي من (الرقم + العيادة) ومش بيظهر للمريض أبدًا.

// لازم تكون نفس الدالتين الموجودتين في صفحة الدكتور (PatientDetails).

// ============================================================

const normalizeEgyptianPhone = (value: string) => {
  const cleaned = value.replace(/[\s-]/g, "");

  if (cleaned.startsWith("+20")) return cleaned;

  if (cleaned.startsWith("20")) return `+${cleaned}`;

  if (cleaned.startsWith("0")) return `+20${cleaned.substring(1)}`;

  return cleaned;
};

const buildPatientLoginEmail = (normalizedPhone: string, clinicId: string) =>
  `p${normalizedPhone.replace(/\D/g, "")}.${clinicId
    .replace(/-/g, "")
    .toLowerCase()}@dentalcare.local`;

const PatientLogin = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);

  const redirectParam = searchParams.get("redirect");

  const reasonParam = searchParams.get("reason");

  const clinicIdParam = searchParams.get("clinic_id");

  const getSafeRedirect = () => {
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//")
    ) {
      return redirectParam;
    }

    return "/patient/dashboard";
  };

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");

    return saved === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";

  const t = translations[language];

  useEffect(() => {
    const handleLanguageChange = () => {
      const saved = localStorage.getItem("dentalcare-language");

      setLanguage(saved === "en" ? "en" : "ar");
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

  // ============================================================
  // Login
  // ============================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password) {
      setError(
        isArabic
          ? "من فضلك أدخل رقم الهاتف وكلمة المرور."
          : "Please enter your phone number and password."
      );

      return;
    }

    if (!clinicIdParam) {
      setError(
        isArabic
          ? "لم يتم تحديد العيادة. من فضلك افتح صفحة تسجيل الدخول من صفحة العيادة."
          : "No clinic was selected. Please open the patient login from the clinic page."
      );

      return;
    }

    const normalizedPhone = normalizeEgyptianPhone(trimmedPhone);

    if (!/^\+201[0125]\d{8}$/.test(normalizedPhone)) {
      setError(
        isArabic
          ? "رقم الهاتف غير صحيح. مثال: 01012345678"
          : "Invalid phone number. Example: 01012345678"
      );

      return;
    }

    setLoading(true);

    try {
      // نقفل أي جلسة قديمة (مثلًا من عيادة تانية) قبل ما ندخل
      await supabase.auth.signOut();

      // 1) المحاولة الأساسية: إيميل داخلي متولّد من الرقم + العيادة
      //    (لو المريض بيدخل من عيادة غير عيادته، الإيميل مش هيطابق وهيفشل)
      let { data: authData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: buildPatientLoginEmail(normalizedPhone, clinicIdParam),
          password,
        });

      // 2) للحسابات القديمة (اتعملت بإيميل عشوائي): نجرّب الدالة القديمة
      //    ولسه هيتم التأكد من العيادة بعد الدخول
      if (
        loginError &&
        /invalid login credentials/i.test(loginError.message)
      ) {
        const { data: legacyEmail } = await supabase.rpc(
          "get_patient_login_email",
          { patient_phone: normalizedPhone }
        );

        if (legacyEmail) {
          const retry = await supabase.auth.signInWithPassword({
            email: legacyEmail as string,
            password,
          });

          authData = retry.data;

          loginError = retry.error;
        }
      }

      if (loginError || !authData?.user) {
        console.error("Login error:", loginError);

        const msg = loginError?.message || "";

        if (/email not confirmed/i.test(msg)) {
          setError(
            isArabic
              ? "الحساب لم يتم تفعيله. اطلب من العيادة مراجعة الإعدادات."
              : "Account not confirmed. Please ask the clinic to check the settings."
          );
        } else {
          setError(
            isArabic
              ? "رقم الهاتف أو كلمة المرور غير صحيحة، أو لا يوجد حساب لك في هذه العيادة."
              : "Incorrect phone number or password, or you have no account in this clinic."
          );
        }

        return;
      }

      // التأكد إن الحساب تابع للعيادة دي بالذات
      const { data: patientRecord, error: patientRecordError } =
        await supabase
          .from("patients")
          .select("id, clinic_id")
          .eq("user_id", authData.user.id)
          .eq("clinic_id", clinicIdParam)
          .limit(1)
          .maybeSingle();

      if (patientRecordError || !patientRecord) {
        console.error(
          "Patient record verification error:",
          patientRecordError
        );

        await supabase.auth.signOut();

        setError(
          isArabic
            ? "هذا الحساب غير مرتبط بهذه العيادة. سجّل الدخول من صفحة عيادتك."
            : "This account is not linked to this clinic. Please log in from your own clinic's page."
        );

        return;
      }

      // نثبّت العيادة المختارة عشان الداشبورد تفتح على عيادة المريض
      localStorage.setItem("dentalcare-selected-clinic", clinicIdParam);

      navigate(getSafeRedirect(), { replace: true });
    } catch (err) {
      console.error("Patient login error:", err);

      setError(
        isArabic
          ? "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
          : "Something went wrong while logging in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-6 pb-16 pt-28 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/50">
            <LogIn className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.auth.login}
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {isArabic
              ? "سجل الدخول برقم هاتفك وكلمة المرور التي أعطاها لك الدكتور."
              : "Log in with your phone number and the password given by your doctor."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {reasonParam === "patient_account_required" && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              {isArabic
                ? "يجب تسجيل الدخول بحساب مريض مرتبط بالمنصة حتى تتمكن من حجز موعد."
                : "You must sign in with a patient account linked to the platform to book an appointment."}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone */}
            <div>
              <label
                htmlFor="patient-phone"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic ? "رقم الهاتف" : "Phone Number"}
              </label>

              <div className="relative">
                <Phone
                  className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500 ${
                    isArabic ? "right-4" : "left-4"
                  }`}
                />

                <input
                  id="patient-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="01012345678"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic ? "pl-4 pr-12" : "pl-12 pr-4"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="patient-password"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.auth.password}
              </label>

              <div className="relative">
                <input
                  id="patient-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={
                    isArabic ? "أدخل كلمة المرور" : "Enter your password"
                  }
                  required
                  autoComplete="current-password"
                  dir="ltr"
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic ? "pl-12 pr-4" : "pl-4 pr-12"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword
                      ? isArabic
                        ? "إخفاء كلمة المرور"
                        : "Hide password"
                      : isArabic
                      ? "إظهار كلمة المرور"
                      : "Show password"
                  }
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ${
                    isArabic ? "left-4" : "right-4"
                  }`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
            >
              <LogIn className="h-5 w-5" />

              {loading
                ? isArabic
                  ? "جاري تسجيل الدخول..."
                  : "Logging in..."
                : t.auth.login}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;












