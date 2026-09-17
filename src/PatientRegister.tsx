import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

const PatientRegister = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        isArabic
          ? "من فضلك أدخل اسمك."
          : "Please enter your name."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        isArabic
          ? "من فضلك أدخل رقم هاتفك."
          : "Please enter your phone number."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        isArabic
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
          : "Password must be at least 6 characters."
      );
      return;
    }

    const normalizedPhone =
      normalizeEgyptianPhone(phone);

    setLoading(true);

    /*
     * Create an internal email for Supabase Auth.
     *
     * The patient never sees or enters this email.
     */
    const internalEmail = `patient_${crypto.randomUUID()}@dentalcare.local`;

    const {
      data,
      error: signUpError,
    } = await supabase.auth.signUp({
      email: internalEmail,
      password,
    });

    if (signUpError) {
      console.error(signUpError);
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(
        isArabic
          ? "تعذر إنشاء حسابك."
          : "Could not create your account."
      );
      setLoading(false);
      return;
    }

    /*
     * Create patient record.
     */
    const { error: patientError } =
      await supabase
        .from("patients")
        .insert({
          user_id: data.user.id,
          name: name.trim(),
          phone: normalizedPhone,
          email: null,
          login_email: internalEmail,
          medical_notes: null,
        });

    if (patientError) {
      console.error(patientError);

      setError(
        isArabic
          ? "تم إنشاء حسابك، ولكن تعذر إنشاء ملف المريض الخاص بك. يرجى التواصل مع الدعم."
          : "Your account was created, but your patient profile could not be created. Please contact support."
      );

      setLoading(false);
      return;
    }

    setSuccess(
      isArabic
        ? "تم إنشاء حساب المريض بنجاح!"
        : "Patient account created successfully!"
    );

    setTimeout(() => {
      navigate("/patient/login");
    }, 1000);
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
            {isArabic
              ? "إنشاء حساب مريض"
              : "Create Patient Account"}
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isArabic
              ? "أنشئ حسابك لإدارة مواعيدك."
              : "Create your account to manage your appointments."}
          </p>

        </div>

        {/* Registration Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
              {success}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >

            {/* Name */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isArabic
                  ? "الاسم بالكامل"
                  : "Full Name"}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder={
                  isArabic
                    ? "أدخل اسمك بالكامل"
                    : "Enter your full name"
                }
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

            </div>

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

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {isArabic
                  ? "يتم دعم أرقام الهواتف المصرية."
                  : "Egyptian phone numbers are supported."}
              </p>

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
                    ? "6 أحرف على الأقل"
                    : "At least 6 characters"
                }
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isArabic
                  ? "جاري إنشاء الحساب..."
                  : "Creating Account..."
                : isArabic
                  ? "إنشاء حساب"
                  : "Create Account"}
            </button>

          </form>

          {/* Login */}
          <div className="mt-6 text-center">

            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isArabic
                ? "لديك حساب بالفعل؟"
                : "Already have an account?"}
            </p>

            <Link
              to="/patient/login"
              className="mt-2 inline-block font-semibold text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              {isArabic
                ? "تسجيل دخول المريض"
                : "Patient Login"}
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PatientRegister;



