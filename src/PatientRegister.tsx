
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

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const digitsOnlyPhone = phone.replace(/\D/g, "");

    // =========================
    // Name validation
    // =========================

    if (!trimmedName) {
      setError(
        isArabic
          ? "من فضلك أدخل اسمك بالكامل."
          : "Please enter your full name."
      );
      return;
    }

    // =========================
    // Phone validation
    // =========================

    if (!phone.trim()) {
      setError(
        isArabic
          ? "من فضلك أدخل رقم هاتفك."
          : "Please enter your phone number."
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

    const normalizedPhone =
      normalizeEgyptianPhone(digitsOnlyPhone);

    setLoading(true);

    try {
      // =========================
      // Check duplicate name
      // =========================

      const {
        data: existingName,
        error: nameCheckError,
      } = await supabase
        .from("patients")
        .select("id")
        .eq("name", trimmedName)
        .maybeSingle();

      if (nameCheckError) {
        console.error(
          "Name check error:",
          nameCheckError
        );

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

      const {
        data: existingPhone,
        error: phoneCheckError,
      } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (phoneCheckError) {
        console.error(
          "Phone check error:",
          phoneCheckError
        );

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
      // =========================

      const internalEmail =
        `patient_${generateInternalId()}@dentalcare.local`;

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: internalEmail,
        password,
      });

      if (signUpError) {
        console.error(
          "Patient signup error:",
          signUpError
        );

        setError(
          isArabic
            ? `خطأ أثناء إنشاء الحساب: ${signUpError.message}`
            : `Registration error: ${signUpError.message}`
        );

        return;
      }

      if (!data.user) {
        setError(
          isArabic
            ? "تعذر إنشاء حسابك."
            : "Could not create your account."
        );

        return;
      }

      // =========================
      // Create patient profile
      // =========================

      const {
        error: patientError,
      } = await supabase
        .from("patients")
        .insert({
          user_id: data.user.id,
          name: trimmedName,
          phone: normalizedPhone,
          email: null,
          login_email: internalEmail,
          medical_notes: null,
        });

      if (patientError) {
        console.error(
          "Patient profile error:",
          patientError
        );

        if (patientError.code === "23505") {
          if (
            patientError.message.includes(
              "patients_name_unique"
            )
          ) {
            setError(
              isArabic
                ? "هذا الاسم مسجل بالفعل."
                : "This name is already registered."
            );
          } else if (
            patientError.message.includes(
              "patients_phone_unique"
            )
          ) {
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
      console.error(
        "Patient registration error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      setError(
        isArabic
          ? `خطأ أثناء إنشاء الحساب: ${errorMessage}`
          : `Registration error: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
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
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
            >
              {success}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="patient-name"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {isArabic
                  ? "الاسم بالكامل"
                  : "Full Name"}
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
                  isArabic
                    ? "أدخل اسمك بالكامل"
                    : "Enter your full name"
                }
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

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

              <input
                id="patient-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const digitsOnly =
                    e.target.value.replace(/\D/g, "");

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

              <input
                id="patient-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={
                  isArabic
                    ? "6 أحرف على الأقل"
                    : "At least 6 characters"
                }
                required
                minLength={6}
                autoComplete="new-password"
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
 


