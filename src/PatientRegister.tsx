import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Languages,
  Moon,
  Stethoscope,
  Sun,
  UserPlus,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

const PatientRegister = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // Keep in sync if the language changes elsewhere (e.g. from the Navbar)
  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");
      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener("dentalcare-language-change", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener("dentalcare-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  // Keep in sync if the theme changes elsewhere (e.g. from the Navbar)
  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("dentalcare-theme");
      setTheme(savedTheme === "dark" ? "dark" : "light");
    };

    window.addEventListener("dentalcare-theme-change", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("dentalcare-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLanguage: Language = isArabic ? "en" : "ar";

    localStorage.setItem("dentalcare-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = nextLanguage === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(new Event("dentalcare-language-change"));

    setLanguage(nextLanguage);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    localStorage.setItem("dentalcare-theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window.dispatchEvent(new Event("dentalcare-theme-change"));

    setTheme(nextTheme);
  };

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

  // Generate an ID that works on older mobile/tablet browsers
  const generateInternalId = () => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const digitsOnlyPhone = phone.replace(/\D/g, "");
    const trimmedEmail = email.trim();

    // =========================
    // Name validation
    // =========================

    if (!trimmedName) {
      setError(
        isArabic ? "من فضلك أدخل اسمك بالكامل." : "Please enter your full name."
      );
      return;
    }

    // =========================
    // Phone validation
    // =========================

    if (!phone.trim()) {
      setError(
        isArabic ? "من فضلك أدخل رقم هاتفك." : "Please enter your phone number."
      );
      return;
    }

    if (!/^\d+$/.test(phone)) {
      setError(
        isArabic
          ? "رقم الهاتف يجب أن يحتوي على أرقام فقط."
          : "Phone number must contain digits only."
      );
      return;
    }

    if (!/^01[0125]\d{8}$/.test(digitsOnlyPhone)) {
      setError(
        isArabic
          ? "من فضلك أدخل رقم هاتف مصري صحيح مكون من 11 رقمًا، مثل 01012345678."
          : "Please enter a valid Egyptian mobile number with 11 digits, for example 01012345678."
      );
      return;
    }

    // =========================
    // Email validation (optional field — only checked if filled in)
    // =========================

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(
        isArabic
          ? "من فضلك أدخل بريدًا إلكترونيًا صحيحًا."
          : "Please enter a valid email address."
      );
      return;
    }

    // =========================
    // Password validation
    // =========================

    if (password.length < 6) {
      setError(
        isArabic
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
          : "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isArabic ? "كلمتا المرور غير متطابقتين." : "Passwords do not match."
      );
      return;
    }

    const normalizedPhone = normalizeEgyptianPhone(digitsOnlyPhone);

    setLoading(true);

    try {
      // =========================
      // Check duplicate name
      // =========================

      const { data: existingName, error: nameCheckError } = await supabase
        .from("patients")
        .select("id")
        .eq("name", trimmedName)
        .maybeSingle();

      if (nameCheckError) {
        console.error("Name check error:", nameCheckError);

        setError(
          isArabic
            ? "حدث خطأ أثناء التحقق من الاسم. حاول مرة أخرى."
            : "An error occurred while checking the name. Please try again."
        );

        return;
      }

      if (existingName) {
        setError(
          isArabic
            ? "هذا الاسم مسجل بالفعل. من فضلك استخدم اسمًا آخر."
            : "This name is already registered. Please use another name."
        );

        return;
      }

      // =========================
      // Check duplicate phone
      // =========================

      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (phoneCheckError) {
        console.error("Phone check error:", phoneCheckError);

        setError(
          isArabic
            ? "حدث خطأ أثناء التحقق من رقم الهاتف. حاول مرة أخرى."
            : "An error occurred while checking the phone number. Please try again."
        );

        return;
      }

      if (existingPhone) {
        setError(
          isArabic
            ? "رقم الهاتف هذا مسجل بالفعل. من فضلك استخدم رقمًا آخر."
            : "This phone number is already registered. Please use another number."
        );

        return;
      }

      // =========================
      // Create Supabase Auth user
      //
      // Patients log in with their phone number, not an email, so we
      // still generate an internal email for Supabase Auth. The email
      // the patient optionally typed in is only stored on the patient
      // profile as a contact detail — it is never used for login.
      // =========================

      const internalEmail = `patient_${generateInternalId()}@dentalcare.local`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: internalEmail,
        password,
      });

      if (signUpError) {
        console.error("Patient signup error:", signUpError);

        setError(
          isArabic
            ? `خطأ أثناء إنشاء الحساب: ${signUpError.message}`
            : `Registration error: ${signUpError.message}`
        );

        return;
      }

      if (!data.user) {
        setError(
          isArabic ? "تعذر إنشاء حسابك." : "Could not create your account."
        );

        return;
      }

      // =========================
      // Create patient profile
      // =========================

      const { error: patientError } = await supabase.from("patients").insert({
        user_id: data.user.id,
        name: trimmedName,
        phone: normalizedPhone,
        email: trimmedEmail || null,
        login_email: internalEmail,
        medical_notes: null,
      });

      if (patientError) {
        console.error("Patient profile error:", patientError);

        if (patientError.code === "23505") {
          if (patientError.message.includes("patients_name_unique")) {
            setError(
              isArabic
                ? "هذا الاسم مسجل بالفعل."
                : "This name is already registered."
            );
          } else if (patientError.message.includes("patients_phone_unique")) {
            setError(
              isArabic
                ? "رقم الهاتف هذا مسجل بالفعل."
                : "This phone number is already registered."
            );
          } else {
            setError(
              isArabic
                ? "هذا الحساب مسجل بالفعل."
                : "This account is already registered."
            );
          }
        } else {
          setError(
            isArabic
              ? `حدث خطأ أثناء إنشاء ملف المريض: ${patientError.message}`
              : `Patient profile error: ${patientError.message}`
          );
        }

        return;
      }

      // =========================
      // Success
      // =========================

      setSuccess(
        isArabic
          ? "تم إنشاء حساب المريض بنجاح!"
          : "Patient account created successfully!"
      );

      setTimeout(() => {
        navigate("/patient/login");
      }, 1000);
    } catch (error) {
      console.error("Patient registration error:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      setError(
        isArabic
          ? `خطأ أثناء إنشاء الحساب: ${errorMessage}`
          : `Registration error: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  // In RTL the "previous" direction reads visually to the right
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
    >
      {/* Top bar: back, language, dark mode */}
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={isArabic ? "رجوع" : "Back"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <BackIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700">
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
            title={isArabic ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4" />
            <span>{isArabic ? "العربية" : "English"}</span>
          </button>

          <span className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

          <button
            onClick={toggleTheme}
            type="button"
            dir="ltr"
            aria-label={
              theme === "dark"
                ? isArabic
                  ? "الوضع الفاتح"
                  : "Light mode"
                : isArabic
                  ? "الوضع الداكن"
                  : "Dark mode"
            }
            className="relative flex h-7 w-14 items-center rounded-full bg-teal-600 px-1.5 transition-colors"
          >
            <Sun className="h-3.5 w-3.5 shrink-0 text-white/80" />
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                theme === "dark" ? "translate-x-[26px]" : "translate-x-[2px]"
              }`}
            />
            <Moon className="mr-0 ml-auto h-3.5 w-3.5 shrink-0 text-white/80" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-5xl gap-8 px-6 pb-16 lg:grid-cols-2 lg:items-stretch lg:gap-0">
        {/* Left / brand panel */}
        <div className="order-2 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-10 text-white lg:order-1 lg:rounded-e-none lg:p-14">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Stethoscope className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold leading-tight">
                {isArabic ? "دنتال كير" : "DentalCare"}
              </h2>
              <p className="text-xs font-medium text-teal-100">
                DentalCare Egypt
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {isArabic
              ? "احجز موعدك مع أفضل عيادات الأسنان بكل سهولة"
              : "Book with the best dental clinics, easily"}
          </h1>

          <p className="mt-4 max-w-sm text-teal-50">
            {isArabic
              ? "منصة متكاملة تربطك بأقرب عيادات الأسنان وتوفر لك تجربة حجز مريحة وآمنة."
              : "One platform connecting you to nearby dental clinics with a smooth, secure booking experience."}
          </p>
        </div>

        {/* Right / form panel */}
        <div className="order-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:order-2 lg:rounded-s-none lg:border-s-0">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isArabic ? "إنشاء حساب جديد" : "Create Patient Account"}
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isArabic
                ? "أنشئ حسابك لإدارة مواعيدك."
                : "Create your account to manage your appointments."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="patient-name"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic ? "الاسم بالكامل" : "Full Name"}
              </label>

              <input
                id="patient-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder={
                  isArabic ? "أدخل اسمك بالكامل" : "Enter your full name"
                }
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label
                htmlFor="patient-email"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic ? "البريد الإلكتروني" : "Email"}{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">
                  {isArabic ? "(اختياري)" : "(optional)"}
                </span>
              </label>

              <input
                id="patient-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="example@email.com"
                autoComplete="email"
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="patient-phone"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic ? "رقم الهاتف" : "Phone Number"}
              </label>

              <input
                id="patient-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");

                  setPhone(digitsOnly);
                  setError("");
                }}
                placeholder="01012345678"
                required
                maxLength={11}
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {isArabic
                  ? "أدخل رقم هاتف مصري مكون من 11 رقمًا."
                  : "Enter an Egyptian mobile number with 11 digits."}
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={
                    isArabic ? "6 أحرف على الأقل" : "At least 6 characters"
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  dir={isArabic ? "rtl" : "ltr"}
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="patient-confirm-password"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>

              <div className="relative">
                <input
                  id="patient-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={
                    isArabic ? "أعد إدخال كلمة المرور" : "Re-enter your password"
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  dir={isArabic ? "rtl" : "ltr"}
                  className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                    isArabic ? "pl-12 pr-4" : "pl-4 pr-12"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={
                    showConfirmPassword
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
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-5 w-5" />
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
              {isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}
            </p>

            <Link
              to="/patient/login"
              className="mt-2 inline-block font-semibold text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              {isArabic ? "تسجيل دخول المريض" : "Patient Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
 


