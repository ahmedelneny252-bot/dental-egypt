import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabase";

const DoctorRegister = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // Same Language System
  // =========================

  const [language, setLanguage] = useState<"en" | "ar">(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  // =========================
  // Same Theme System
  // =========================

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");

    return savedTheme === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";
  const isDark = theme === "dark";

  // =========================
  // Language Change
  // =========================

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

    window.addEventListener("storage", handleLanguageChange);

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

  // =========================
  // Language / Direction
  // =========================

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [language, isArabic]);

  // =========================
  // Theme Change
  // =========================

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem(
        "dentalcare-theme"
      );

      setTheme(savedTheme === "dark" ? "dark" : "light");
    };

    window.addEventListener(
      "dentalcare-theme-change",
      handleThemeChange
    );

    window.addEventListener(
      "storage",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "dentalcare-theme-change",
        handleThemeChange
      );

      window.removeEventListener(
        "storage",
        handleThemeChange
      );
    };
  }, []);

  // =========================
  // Keep Tailwind Dark Class
  // =========================

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // =========================
  // Register
  // =========================

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Create doctor account
    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setError(
        isArabic
          ? "تعذر إنشاء الحساب."
          : "Could not create user."
      );

      return;
    }

    // Create clinic
    const { data: clinic, error: clinicError } =
      await supabase
        .from("clinics")
        .insert({
          name: clinicName,
        })
        .select()
        .single();

    if (clinicError) {
      setError(clinicError.message);
      return;
    }

    // Create doctor profile
    const { error: profileError } =
      await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          name,
          email,
          clinic_id: clinic.id,
        });

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setSuccess(
      isArabic
        ? "تم إنشاء الحساب بنجاح!"
        : "Account created successfully!"
    );

    setTimeout(() => {
      navigate("/doctor/login");
    }, 1500);
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen flex items-start justify-center px-4 pt-24 pb-10 transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl transition-colors duration-300 ${
          isDark
            ? "border-slate-800 bg-slate-900 text-white shadow-black/40"
            : "border-slate-200 bg-white text-slate-900 shadow-slate-200/70"
        }`}
      >
        {/* Title */}

        <h1
          className={`mb-2 text-center text-3xl font-bold ${
            isDark
              ? "text-teal-400"
              : "text-teal-600"
          }`}
        >
          {isArabic
            ? "تسجيل حساب طبيب"
            : "Doctor Registration"}
        </h1>

        {/* Subtitle */}

        <p
          className={`mb-7 text-center ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          {isArabic
            ? "أنشئ حسابك في DentalCare"
            : "Create your DentalCare account"}
        </p>

        <form
          onSubmit={handleRegister}
          className="space-y-4"
        >
          {/* Doctor Name */}

          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              {isArabic
                ? "اسم الطبيب"
                : "Doctor Name"}
            </label>

            <input
              type="text"
              placeholder={
                isArabic
                  ? "اسم الطبيب"
                  : "Doctor Name"
              }
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              className={`w-full rounded-xl border px-4 py-3 outline-none transition-all duration-300 ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              }`}
            />
          </div>

          {/* Email */}

          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              {isArabic
                ? "البريد الإلكتروني"
                : "Email"}
            </label>

            <input
              type="email"
              placeholder={
                isArabic
                  ? "البريد الإلكتروني"
                  : "Email"
              }
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              dir="ltr"
              className={`w-full rounded-xl border px-4 py-3 outline-none transition-all duration-300 ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              }`}
            />
          </div>

          {/* Password */}

          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              {isArabic
                ? "كلمة المرور"
                : "Password"}
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder={
                  isArabic
                    ? "كلمة المرور"
                    : "Password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                minLength={6}
                dir="ltr"
                className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none transition-all duration-300 ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                  isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                aria-label={
                  showPassword
                    ? isArabic
                      ? "إخفاء كلمة المرور"
                      : "Hide password"
                    : isArabic
                      ? "إظهار كلمة المرور"
                      : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Clinic Name */}

          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              {isArabic
                ? "اسم العيادة"
                : "Clinic Name"}
            </label>

            <input
              type="text"
              placeholder={
                isArabic
                  ? "اسم العيادة"
                  : "Clinic Name"
              }
              value={clinicName}
              onChange={(e) =>
                setClinicName(e.target.value)
              }
              required
              className={`w-full rounded-xl border px-4 py-3 outline-none transition-all duration-300 ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              }`}
            />
          </div>

          {/* Register */}

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/20 transition-all duration-300 hover:bg-teal-700 hover:shadow-teal-600/30 active:scale-[0.99]"
          >
            {isArabic
              ? "إنشاء الحساب"
              : "Create Account"}
          </button>
        </form>

        {/* Error */}

        {error && (
          <div
            className={`mt-5 rounded-xl border p-3 text-center text-sm ${
              isDark
                ? "border-red-900 bg-red-950/40 text-red-400"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        {/* Success */}

        {success && (
          <div
            className={`mt-5 rounded-xl border p-3 text-center text-sm ${
              isDark
                ? "border-green-900 bg-green-950/40 text-green-400"
                : "border-green-200 bg-green-50 text-green-600"
            }`}
          >
            {success}
          </div>
        )}

        {/* Login */}

        <div
          className={`mt-6 border-t pt-5 text-center ${
            isDark
              ? "border-slate-800"
              : "border-slate-200"
          }`}
        >
          <p
            className={
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }
          >
            {isArabic
              ? "لديك حساب بالفعل؟"
              : "Already have an account?"}
          </p>

          <Link
            to="/doctor/login"
            className="font-semibold text-teal-600 hover:text-teal-700"
          >
            {isArabic
              ? "تسجيل الدخول"
              : "Login"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;