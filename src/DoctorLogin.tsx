
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<"en" | "ar">(() => {
    return (localStorage.getItem("language") as "en" | "ar") || "en";
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const isArabic = language === "ar";

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isArabic]);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        isArabic
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : error.message
      );
      return;
    }

    window.location.href = "/doctor/dashboard";
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        darkMode ? "bg-gray-950" : "bg-gray-50"
      }`}
    >
      <div className="absolute top-5 right-5 flex items-center gap-2">
        {/* Language Button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className={`px-4 py-2 rounded-lg border font-medium transition ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          {isArabic ? "English" : "العربية"}
        </button>

        {/* Dark Mode Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className={`w-10 h-10 rounded-lg border flex items-center justify-center transition ${
            darkMode
              ? "bg-gray-900 border-gray-700 text-yellow-400 hover:bg-gray-800"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
          aria-label={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      <div
        className={`w-full max-w-md rounded-2xl shadow-lg p-8 transition-colors duration-300 ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <h1 className="text-3xl font-bold text-center text-teal-600 mb-2">
          {isArabic ? "تسجيل دخول الطبيب" : "Doctor Login"}
        </h1>

        <p
          className={`text-center mb-6 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {isArabic
            ? "سجل الدخول إلى حسابك في DentalCare"
            : "Login to your DentalCare account"}
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
            className={`w-full border rounded-lg px-4 py-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-teal-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
            }`}
          />

          <input
            type="password"
            placeholder={isArabic ? "كلمة المرور" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
            className={`w-full border rounded-lg px-4 py-3 outline-none transition ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-teal-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500"
            }`}
          />

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
          >
            {isArabic ? "تسجيل الدخول" : "Login"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default DoctorLogin;

