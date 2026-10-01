
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
  LogIn,
  User,
} from "lucide-react";
import { supabase } from "./supabase";
import {
  translations,
  type Language,
} from "./i18n";

const PatientLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // URL Parameters
  // ============================================================

  const searchParams = new URLSearchParams(
    location.search
  );

  const redirectParam =
    searchParams.get("redirect");

  const reasonParam =
    searchParams.get("reason");

  const clinicIdParam =
    searchParams.get("clinic_id");

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

  // ============================================================
  // State
  // ============================================================

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // Language
  // ============================================================

  const [language, setLanguage] =
    useState<Language>(() => {
      const savedLanguage =
        localStorage.getItem(
          "dentalcare-language"
        );

      return savedLanguage === "en"
        ? "en"
        : "ar";
    });

  const isArabic = language === "ar";
  const t = translations[language];

  // ============================================================
  // Language Change
  // ============================================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem(
          "dentalcare-language"
        );

      setLanguage(
        savedLanguage === "en"
          ? "en"
          : "ar"
      );
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );
    };
  }, []);

  // ============================================================
  // Normalize Egyptian Phone
  // ============================================================

  const normalizeEgyptianPhone = (
    value: string
  ) => {
    const cleaned =
      value.replace(/\s+/g, "");

    if (cleaned.startsWith("+20")) {
      return cleaned;
    }

    if (cleaned.startsWith("20")) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith("0")) {
      return `+20${cleaned.substring(1)}`;
    }

    return cleaned;
  };

  // ============================================================
  // Login
  // ============================================================

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    const trimmedIdentifier =
      identifier.trim();

    if (
      !trimmedIdentifier ||
      !password
    ) {
      setError(
        isArabic
          ? "من فضلك أدخل رقم الهاتف أو البريد الإلكتروني وكلمة المرور."
          : "Please enter your phone number or email, and your password."
      );

      return;
    }

    // ==========================================================
    // Clinic ID is required
    // ==========================================================

    if (!clinicIdParam) {
      setError(
        isArabic
          ? "لم يتم تحديد العيادة. من فضلك افتح صفحة تسجيل الدخول من صفحة العيادة."
          : "No clinic was selected. Please open the patient login from the clinic page."
      );

      return;
    }

    const isEmailInput =
      trimmedIdentifier.includes("@");

    setLoading(true);

    try {
      let loginEmail: string | null =
        null;

      let lookupError: {
        message: string;
      } | null = null;

      // ========================================================
      // Find Internal Login Email
      // ========================================================

      if (isEmailInput) {
        const result =
          await supabase.rpc(
            "get_patient_login_email_by_email",
            {
              patient_email:
                trimmedIdentifier.toLowerCase(),
            }
          );

        loginEmail = result.data;
        lookupError = result.error;
      } else {
        const normalizedPhone =
          normalizeEgyptianPhone(
            trimmedIdentifier
          );

        const result =
          await supabase.rpc(
            "get_patient_login_email",
            {
              patient_phone:
                normalizedPhone,
            }
          );

        loginEmail = result.data;
        lookupError = result.error;
      }

      // ========================================================
      // Lookup Error
      // ========================================================

      if (lookupError) {
        console.error(
          "Patient lookup error:",
          lookupError
        );

        setError(
          isArabic
            ? "تعذر العثور على حساب المريض الخاص بك."
            : "Could not find your patient account."
        );

        return;
      }

      // ========================================================
      // Patient Not Found
      // ========================================================

      if (!loginEmail) {
        setError(
          isEmailInput
            ? isArabic
              ? "لم يتم العثور على حساب مريض مرتبط بهذا البريد الإلكتروني."
              : "No patient account was found with this email."
            : isArabic
              ? "لم يتم العثور على حساب مريض مرتبط برقم الهاتف هذا."
              : "No patient account was found with this phone number."
        );

        return;
      }

      // ========================================================
      // Supabase Auth Login
      // ========================================================

      const {
        data: authData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: loginEmail,
            password,
          }
        );

      if (loginError) {
        console.error(
          "Login error:",
          loginError
        );

        setError(
          isArabic
            ? `خطأ تسجيل الدخول: ${loginError.message}`
            : `Login error: ${loginError.message}`
        );

        return;
      }

      // ========================================================
      // Get Authenticated User
      // ========================================================

      const user =
        authData.user;

      if (!user) {
        await supabase.auth.signOut();

        setError(
          isArabic
            ? "تعذر الحصول على بيانات حساب المريض."
            : "Could not retrieve your patient account information."
        );

        return;
      }

      // ========================================================
      // Verify Patient Record + Clinic
      // ========================================================
      //
      // لازم الحساب يكون:
      // 1. مرتبط بسجل Patient
      // 2. والسجل تابع لنفس العيادة الموجودة في الرابط
      //
      // مثال:
      // /patient/login?clinic_id=ABC
      //
      // المريض لازم يكون موجود في:
      // patients.user_id = user.id
      // AND
      // patients.clinic_id = ABC
      //

      const {
        data: patientRecord,
        error: patientRecordError,
      } = await supabase
        .from("patients")
        .select("id, clinic_id")
        .eq("user_id", user.id)
        .eq("clinic_id", clinicIdParam)
        .limit(1)
        .maybeSingle();

      if (
        patientRecordError ||
        !patientRecord
      ) {
        console.error(
          "Patient record verification error:",
          patientRecordError
        );

        await supabase.auth.signOut();

        setError(
          isArabic
            ? "هذا الحساب غير مرتبط بهذه العيادة. من فضلك تأكد أنك تستخدم تسجيل الدخول الخاص بالعيادة الصحيحة."
            : "This patient account is not linked to this clinic. Please make sure you are using the login page for the correct clinic."
        );

        return;
      }

      // ========================================================
      // Redirect
      // ========================================================

      navigate(getSafeRedirect(), {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Patient login error:",
        error
      );

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

        {/* Header */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/50">
            <LogIn className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.auth.login}
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {isArabic
              ? "سجل الدخول إلى حساب المريض باستخدام رقم هاتفك أو بريدك الإلكتروني."
              : "Log in to your patient account using your phone number or email."}
          </p>

        </div>

        {/* Login Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">

          {/* Redirect Message */}

          {reasonParam ===
            "patient_account_required" && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              {isArabic
                ? "يجب تسجيل الدخول بحساب مريض مرتبط بالمنصة حتى تتمكن من حجز موعد."
                : "You must sign in with a patient account linked to the platform to book an appointment."}
            </div>
          )}

          {/* Error */}

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Phone or Email */}

            <div>

              <label
                htmlFor="patient-identifier"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic
                  ? "رقم الهاتف أو البريد الإلكتروني"
                  : "Phone Number or Email"}
              </label>

              <div className="relative">

                <User
                  className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500 ${
                    isArabic
                      ? "right-4"
                      : "left-4"
                  }`}
                />

                <input
                  id="patient-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder={
                    isArabic
                      ? "01012345678 أو example@email.com"
                      : "01012345678 or example@email.com"
                  }
                  required
                  autoComplete="username"
                  dir="ltr"
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic
                      ? "pl-4 pr-12"
                      : "pl-12 pr-4"
                  }`}
                />

              </div>

              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                {isArabic
                  ? "استخدم رقم الهاتف أو البريد الإلكتروني الذي أعطاك إياه الدكتور عند إنشاء حسابك."
                  : "Use the phone number or email provided by your doctor when your account was created."}
              </p>

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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  placeholder={
                    isArabic
                      ? "أدخل كلمة المرور"
                      : "Enter your password"
                  }
                  required
                  autoComplete="current-password"
                  dir={
                    isArabic
                      ? "rtl"
                      : "ltr"
                  }
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic
                      ? "pl-12 pr-4"
                      : "pl-4 pr-12"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
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
                    isArabic
                      ? "left-4"
                      : "right-4"
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

            {/* Login Button */}

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











