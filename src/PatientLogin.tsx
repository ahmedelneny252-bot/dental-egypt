import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

const PatientLogin = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(
      "dentalcare-language"
    );

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem(
        "dentalcare-language"
      );

      setLanguage(savedLanguage === "en" ? "en" : "ar");
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

    const normalizedPhone =
      normalizeEgyptianPhone(phone);

    /*
     * Find the patient using their phone number.
     */
    const {
      data: patient,
      error: patientError,
    } = await supabase
      .from("patients")
      .select("id, login_email")
      .eq("phone", normalizedPhone)
      .maybeSingle();

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

      setLoading(false);
      return;
    }

    if (!patient) {
      setError(
        isArabic
          ? "لم يتم العثور على حساب مريض مرتبط برقم الهاتف هذا."
          : "No patient account was found with this phone number."
      );

      setLoading(false);
      return;
    }

    if (!patient.login_email) {
      setError(
        isArabic
          ? "حساب المريض الخاص بك يفتقد معلومات تسجيل الدخول. يرجى التواصل مع الدعم."
          : "Your patient account is missing login information. Please contact support."
      );

      setLoading(false);
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
      email: patient.login_email,
      password,
    });

    if (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      setError(
        isArabic
          ? "رقم الهاتف أو كلمة المرور غير صحيحة."
          : "Invalid phone number or password."
      );

      setLoading(false);
      return;
    }

    navigate("/patient/appointments");
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-6 pb-12 pt-28 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.auth.login}
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isArabic
              ? "سجل الدخول باستخدام رقم هاتفك وكلمة المرور."
              : "Login using your phone number and password."}
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* Phone */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isArabic
                  ? "رقم الهاتف"
                  : "Phone Number"}
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="01012345678"
                required
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

            </div>

            {/* Password */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t.auth.password}
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder={
                  isArabic
                    ? "أدخل كلمة المرور"
                    : "Enter your password"
                }
                required
                dir={isArabic ? "rtl" : "ltr"}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isArabic
                  ? "جاري تسجيل الدخول..."
                  : "Logging in..."
                : t.auth.login}
            </button>

          </form>

          {/* Register */}
          <div className="mt-6 text-center">

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





