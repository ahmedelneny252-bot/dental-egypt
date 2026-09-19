
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Phone } from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

const PatientLogin = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage =
      localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      setLanguage(
        savedLanguage === "en" ? "en" : "ar"
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

  const normalizeEgyptianPhone = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");

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

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!phone.trim() || !password) {
      setError(
        isArabic
          ? "من فضلك أدخل رقم الهاتف وكلمة المرور."
          : "Please enter your phone number and password."
      );
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone =
        normalizeEgyptianPhone(phone.trim());

      /*
       * Get the patient's internal login email
       * using a secure Supabase RPC function.
       *
       * The patient never sees or enters this email.
       */
      const {
        data: loginEmail,
        error: patientError,
      } = await supabase.rpc(
        "get_patient_login_email",
        {
          patient_phone: normalizedPhone,
        }
      );

      if (patientError) {
        console.error(
          "Patient lookup error:",
          patientError
        );

        setError(
          isArabic
            ? "تعذر العثور على حساب المريض الخاص بك."
            : "Could not find your patient account."
        );

        return;
      }

      if (!loginEmail) {
        setError(
          isArabic
            ? "لم يتم العثور على حساب مريض مرتبط برقم الهاتف هذا."
            : "No patient account was found with this phone number."
        );

        return;
      }

      /*
       * Login to Supabase Auth using the internal email.
       *
       * The patient never sees or enters this email.
       */
      const {
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (loginError) {
        console.error(
          "Login error:",
          loginError
        );

        /*
         * TEMPORARY DEBUG MESSAGE
         *
         * Show the actual Supabase error so we can
         * identify the real reason login is failing.
         */
        setError(
          isArabic
            ? `خطأ تسجيل الدخول: ${loginError.message}`
            : `Login error: ${loginError.message}`
        );

        return;
      }

      navigate("/patient/appointments");
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
              ? "سجل الدخول إلى حساب المريض باستخدام رقم هاتفك وكلمة المرور."
              : "Log in to your patient account using your phone number and password."}
          </p>

        </div>

        {/* Login Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">

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

            {/* Phone */}

            <div>

              <label
                htmlFor="patient-phone"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic
                  ? "رقم الهاتف"
                  : "Phone Number"}
              </label>

              <div className="relative">

                <Phone
                  className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500 ${
                    isArabic
                      ? "right-4"
                      : "left-4"
                  }`}
                />

                <input
                  id="patient-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="01012345678"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  dir="ltr"
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic
                      ? "pl-4 pr-12"
                      : "pl-12 pr-4"
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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={
                    isArabic
                      ? "أدخل كلمة المرور"
                      : "Enter your password"
                  }
                  required
                  autoComplete="current-password"
                  dir={isArabic ? "rtl" : "ltr"}
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic
                      ? "pl-12 pr-4"
                      : "pl-4 pr-12"
                  }`}
                />

                {/* Show / Hide Password */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
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

          {/* Register */}

          <div className="mt-7 border-t border-slate-200 pt-6 text-center dark:border-slate-800">

            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isArabic
                ? "ليس لديك حساب؟"
                : "Don't have an account?"}
            </p>

            <Link
              to="/patient/register"
              className="mt-2 inline-block font-semibold text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              {t.auth.register}
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PatientLogin;









