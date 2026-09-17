import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabase";

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // =========================
  // Same Language System
  // used by the whole app
  // =========================

  const [language, setLanguage] = useState<"en" | "ar">(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  // =========================
  // Same Theme System
  // used by the whole app
  // =========================

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");

    return savedTheme === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";
  const isDark = theme === "dark";

  // =========================
  // Listen for Language Changes
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

      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  // =========================
  // Keep HTML Language / Direction
  // Same as Navbar
  // =========================

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [language, isArabic]);

  // =========================
  // Listen for Theme Changes
  // Same Theme System
  // =========================

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("dentalcare-theme");

      setTheme(savedTheme === "dark" ? "dark" : "light");
    };

    window.addEventListener(
      "dentalcare-theme-change",
      handleThemeChange
    );

    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener(
        "dentalcare-theme-change",
        handleThemeChange
      );

      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  // =========================
  // Make sure the same
  // Tailwind dark class is applied
  // =========================

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // =========================
  // Toggle Language
  // =========================

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";

    setLanguage(newLanguage);

    localStorage.setItem(
      "dentalcare-language",
      newLanguage
    );

    window.dispatchEvent(
      new Event("dentalcare-language-change")
    );
  };

  // =========================
  // Login
  // =========================

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError(
        isArabic
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : "Invalid email or password."
      );

      return;
    }

    window.location.href = "/doctor/dashboard";
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen flex items-center justify-center px-4 py-10 transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =========================
          Top Controls
      ========================= */}

      <div
        className={`absolute top-5 ${
          isArabic ? "left-5" : "right-5"
        } flex items-center gap-2`}
      >
        {/* Language */}

        <button
          type="button"
          onClick={toggleLanguage}
          className={`rounded-xl border px-4 py-2 font-medium transition-all duration-300 ${
            isDark
              ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {isArabic ? "English" : "العربية"}
        </button>
      </div>

      {/* =========================
          Login Card
      ========================= */}

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
            isDark ? "text-teal-400" : "text-teal-600"
          }`}
        >
          {isArabic
            ? "تسجيل دخول الطبيب"
            : "Doctor Login"}
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
            ? "سجل الدخول إلى حسابك في DentalCare"
            : "Login to your DentalCare account"}
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* =========================
              Email
          ========================= */}

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

          {/* =========================
              Password
          ========================= */}

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
                dir="ltr"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition-all duration-300 ${
                  isArabic
                    ? "pl-12"
                    : "pr-12"
                } ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                }`}
              />

              {/* Eye Button */}

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isArabic
                    ? "left-3"
                    : "right-3"
                } transition-colors ${
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

          {/* =========================
              Login Button
          ========================= */}

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/20 transition-all duration-300 hover:bg-teal-700 hover:shadow-teal-600/30 active:scale-[0.99]"
          >
            {isArabic
              ? "تسجيل الدخول"
              : "Login"}
          </button>
        </form>

        {/* =========================
            Error
        ========================= */}

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
      </div>
    </div>
  );
};

export default DoctorLogin;
