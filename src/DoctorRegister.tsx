import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  Facebook,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { supabase } from "./supabase";

// ============================================================
// NOTE ON DATABASE COLUMNS
// This file collects a few fields that were not part of the
// original schema you showed me. Make sure these columns exist:
//   profiles.phone        text
//   profiles.specialty    text
//   clinics.working_hours jsonb
// Everything else (phone, facebook, address, latitude, longitude,
// logo_url, subscription_plan, subscription_status,
// subscription_started_at) already exists on `clinics`
// per ClinicProfile.tsx / Subscription.tsx.
// ============================================================

const SPECIALTIES = [
  { value: "orthodontics", ar: "تقويم أسنان", en: "Orthodontics" },
  { value: "oral_surgery", ar: "جراحة فم وأسنان", en: "Oral & Maxillofacial Surgery" },
  { value: "general", ar: "طب أسنان عام", en: "General Dentistry" },
  { value: "prosthodontics", ar: "تركيبات أسنان", en: "Prosthodontics" },
  { value: "endodontics", ar: "علاج جذور", en: "Endodontics" },
];

const DAYS = [
  { key: "sat", ar: "السبت", en: "Saturday" },
  { key: "sun", ar: "الأحد", en: "Sunday" },
  { key: "mon", ar: "الاثنين", en: "Monday" },
  { key: "tue", ar: "الثلاثاء", en: "Tuesday" },
  { key: "wed", ar: "الأربعاء", en: "Wednesday" },
  { key: "thu", ar: "الخميس", en: "Thursday" },
  { key: "fri", ar: "الجمعة", en: "Friday" },
] as const;

type DayHours = { closed: boolean; open: string; close: string };
type WorkingHours = Record<(typeof DAYS)[number]["key"], DayHours>;

const defaultWorkingHours = (): WorkingHours =>
  DAYS.reduce((acc, d) => {
    acc[d.key] = { closed: d.key === "fri", open: "10:00", close: "22:00" };
    return acc;
  }, {} as WorkingHours);

type Plan = {
  name: "Free" | "Professional" | "Premium";
  price: number;
  ar: { label: string; desc: string; features: string[] };
  en: { label: string; desc: string; features: string[] };
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: 0,
    ar: { label: "مجاني", desc: "للعيادات الصغيرة التي تبدأ استخدام النظام", features: ["حتى 50 مريضًا", "إدارة المواعيد", "ملف أساسي للعيادة"] },
    en: { label: "Free", desc: "For small clinics getting started", features: ["Up to 50 patients", "Appointment management", "Basic clinic profile"] },
  },
  {
    name: "Professional",
    price: 499,
    ar: { label: "احترافي", desc: "للعيادات المتنامية", features: ["عدد غير محدود من المرضى", "السجلات الطبية", "متابعة المدفوعات", "إدارة التقييمات"] },
    en: { label: "Professional", desc: "For growing dental clinics", features: ["Unlimited patients", "Medical records", "Payments tracking", "Reviews management"] },
  },
  {
    name: "Premium",
    price: 999,
    ar: { label: "مميز", desc: "للعيادات التي تحتاج مزايا أكثر", features: ["كل مزايا الاحترافي", "تقارير متقدمة", "دعم ذو أولوية"] },
    en: { label: "Premium", desc: "For clinics that need more features", features: ["Everything in Professional", "Advanced reports", "Priority support"] },
  },
];

// Accepts a full Google Maps link (or plain "lat, lng") and pulls out coordinates.
// Handles the common link shapes; shortened goo.gl links can't be read this way
// because they only redirect in the browser, so we ask the user for the full link.
const parseMapsLink = (input: string): { lat: number; lng: number } | null => {
  const text = input.trim();
  if (!text) return null;

  const plain = text.match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (plain) return { lat: parseFloat(plain[1]), lng: parseFloat(plain[2]) };

  const at = text.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };

  const q = text.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };

  const place = text.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (place) return { lat: parseFloat(place[1]), lng: parseFloat(place[2]) };

  return null;
};

const DoctorRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 — doctor info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0].value);

  // Step 2 — clinic info
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [facebook, setFacebook] = useState("");
  const [address, setAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapsLinkTouched, setMapsLinkTouched] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours());
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3 — subscription
  // ============================================================
  // FIX: "selectedPlan" is now ONLY used to highlight the chosen
  // card. Clicking a plan card no longer creates the account by
  // itself — it just marks that plan as selected, so the user can
  // freely click between Free / Professional / Premium and change
  // their mind. The account is only created once, when the user
  // presses the separate "Confirm and create account" button.
  // (Previously every card click called supabase.auth.signUp
  // directly, so a first failed attempt — e.g. from a missing DB
  // column — left the email half-registered in Supabase Auth, and
  // every subsequent click on ANY plan failed with "already
  // registered", which looked like "the plan won't change".)
  // ============================================================
  const [selectedPlan, setSelectedPlan] = useState<Plan["name"] | null>(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [language, isArabic]);

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

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // =========================
  // Step 1 -> Step 2
  // =========================

  const handleDoctorInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      setError(isArabic ? "برجاء إكمال كل الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }

    setStep(2);
  };

  // =========================
  // Logo upload (same pattern
  // as ClinicProfile.tsx)
  // =========================

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(isArabic ? "يرجى اختيار ملف صورة." : "Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(isArabic ? "يجب أن يكون حجم الصورة أقل من 5 ميجابايت." : "Image size must be less than 5 MB.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleMapsLinkChange = (value: string) => {
    setMapsLink(value);
    setMapsLinkTouched(true);
    setMapCoords(parseMapsLink(value));
  };

  const toggleDayClosed = (key: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [key]: { ...prev[key as keyof WorkingHours], closed: !prev[key as keyof WorkingHours].closed },
    }));
  };

  const updateDayTime = (key: string, field: "open" | "close", value: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [key]: { ...prev[key as keyof WorkingHours], [field]: value },
    }));
  };

  // =========================
  // Step 2 -> Step 3
  // =========================

  const handleClinicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!clinicName.trim()) {
      setError(isArabic ? "اسم العيادة مطلوب." : "Clinic name is required.");
      return;
    }

    setStep(3);
  };

  // =========================
  // Step 3 — just picking a card
  // (no network call here at all)
  // =========================

  const handlePickPlan = (planName: Plan["name"]) => {
    setError("");
    setSelectedPlan(planName);
  };

  // =========================
  // Step 3 -> creates everything
  // then shows Step 4.
  // Only runs ONCE, when the user
  // presses the confirm button.
  // =========================

  const handleConfirmAndCreateAccount = async () => {
    if (!selectedPlan) {
      setError(isArabic ? "من فضلك اختر باقة أولاً." : "Please choose a plan first.");
      return;
    }

    setError("");
    setSubmitting(true);

    // Create doctor account
    let userId: string | null = null;

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      const alreadyRegistered = signUpError.message.toLowerCase().includes("already registered");

      if (!alreadyRegistered) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      // ============================================================
      // RECOVERY PATH: the email is already registered in Supabase
      // Auth. This almost always means a PREVIOUS attempt got as far
      // as creating the auth user, then failed a step later (e.g. the
      // clinic/profile insert, often because of a missing DB column),
      // leaving a "ghost" account with no profile/clinic attached.
      //
      // Instead of dead-ending the user here, we try signing in with
      // the email + password they just typed. If that works AND there
      // is no profile for this user yet, we treat it as "resuming" an
      // incomplete registration and continue creating the clinic and
      // profile below, using this existing user's id.
      // ============================================================
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.user) {
        setError(
          isArabic
            ? "هذا البريد الإلكتروني مسجل بالفعل بكلمة مرور مختلفة. جرّب تسجيل الدخول، أو استخدم بريدًا إلكترونيًا آخر."
            : "This email is already registered with a different password. Try logging in, or use a different email."
        );
        setSubmitting(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, clinic_id")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (existingProfile?.clinic_id) {
        // This account is already fully set up — nothing to resume.
        setError(
          isArabic
            ? "يوجد حساب وعيادة مسجلين بالفعل بهذا البريد. جرّب تسجيل الدخول من صفحة الدخول."
            : "An account and clinic already exist for this email. Try logging in from the login page."
        );
        setSubmitting(false);
        return;
      }

      // No profile / no clinic yet: safe to resume registration.
      userId = signInData.user.id;
    } else if (data.user) {
      userId = data.user.id;
    }

    if (!userId) {
      setError(isArabic ? "تعذر إنشاء الحساب." : "Could not create user.");
      setSubmitting(false);
      return;
    }

    // Upload logo, if provided
    let logoUrl: string | null = null;
    if (logoFile) {
      const safeFileName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
      const filePath = `${userId}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("clinic-logos")
        .upload(filePath, logoFile, { upsert: false, contentType: logoFile.type });

      if (uploadError) {
        setError(isArabic ? `فشل رفع اللوجو: ${uploadError.message}` : `Logo upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("clinic-logos").getPublicUrl(filePath);
      logoUrl = publicUrlData.publicUrl;
    }

    // Create clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({
        name: clinicName.trim(),
        phone: clinicPhone.trim() || null,
        facebook: facebook.trim() || null,
        address: address.trim() || null,
        latitude: mapCoords?.lat ?? null,
        longitude: mapCoords?.lng ?? null,
        working_hours: workingHours,
        logo_url: logoUrl,
        subscription_plan: selectedPlan,
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (clinicError) {
      setError(clinicError.message);
      setSubmitting(false);
      return;
    }

    // Create doctor profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      name,
      email,
      phone: phone.trim(),
      specialty,
      clinic_id: clinic.id,
    });

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setStep(4);

    setTimeout(() => {
      navigate("/doctor/login");
    }, 1800);
  };

  // =========================
  // سهم "رجوع" ثابت فوق الصفحة:
  // - في الخطوة الأولى: يرجع للصفحة الرئيسية
  // - في أي خطوة بعد كده: يرجع خطوة واحدة لورا في نفس الفورم
  // (بيتجاهل الضغط وهو submitting عشان منقطعش عملية الإنشاء)
  // =========================
  const handleTopBack = () => {
    if (submitting) return;
    if (step === 1) {
      navigate("/");
    } else {
      setStep(((step - 1) as 1 | 2 | 3 | 4));
    }
  };

  const iconStart = isArabic ? "right-4" : "left-4";
  const iconEnd = isArabic ? "left-4" : "right-4";
  const inputPad = isArabic ? "pr-11 pl-4" : "pl-11 pr-4";
  const inputPadWithToggle = isArabic ? "pr-11 pl-11" : "pl-11 pr-11";

  const inputClass = `w-full rounded-xl border py-3 outline-none transition-all duration-300 ${
    isDark
      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
  }`;

  const labelClass = `mb-2 block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

  const stepLabels = [
    { n: 1, label: isArabic ? "بيانات الطبيب" : "Doctor info" },
    { n: 2, label: isArabic ? "بيانات العيادة" : "Clinic info" },
    { n: 3, label: isArabic ? "الاشتراك" : "Subscription" },
    { n: 4, label: isArabic ? "تأكيد" : "Confirm" },
  ];

  return (
    // pt-28 keeps this clear of the site's fixed top navbar — without it the
    // stepper row below renders underneath the nav and gets clipped.
    // (Navbar.tsx now hides itself entirely on this route anyway, but the
    // padding is harmless to keep in case that changes later.)
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen px-4 pb-16 pt-28 transition-colors duration-300 md:pt-32 ${
        isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        {/* سهم الرجوع الثابت فوق الصفحة */}
        <div className="mb-4 flex w-full items-center">
          <button
            type="button"
            onClick={handleTopBack}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              submitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${
              isDark
                ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {isArabic ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            {step === 1
              ? (isArabic ? "الصفحة الرئيسية" : "Home")
              : (isArabic ? "رجوع" : "Back")}
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {stepLabels.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 text-sm font-semibold ${
                  step >= (s.n as 1 | 2 | 3 | 4) ? "text-teal-600" : isDark ? "text-slate-600" : "text-slate-400"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs ${
                    step > (s.n as 1 | 2 | 3 | 4)
                      ? "border-teal-600 bg-teal-600 text-white"
                      : step === s.n
                      ? "border-teal-600 text-teal-600"
                      : isDark
                      ? "border-slate-700"
                      : "border-slate-300"
                  }`}
                >
                  {step > s.n ? "✓" : s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={`h-0.5 w-8 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <div
          className={`w-full overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
            isDark ? "border-slate-800 bg-slate-900 shadow-black/40" : "border-slate-200 bg-white shadow-slate-200/70"
          } ${step === 1 ? "grid md:grid-cols-2" : ""}`}
        >
          {/* ===================== STEP 1 — Doctor info ===================== */}
          {step === 1 && (
            <>
              <div
                className={`relative hidden flex-col justify-between overflow-hidden p-10 md:flex ${
                  isDark
                    ? "bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950"
                    : "bg-gradient-to-br from-teal-600 to-teal-800"
                }`}
              >
                <div className="pointer-events-none absolute -bottom-10 -end-10 h-56 w-56 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-white">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                    <span className="text-xl font-bold">DentalCare</span>
                  </div>
                  <h1 className="mt-10 text-3xl font-bold leading-relaxed text-white">
                    {isArabic ? "انضم إلى منصة DentalCare" : "Join the DentalCare platform"}
                  </h1>
                  <p className="mt-4 leading-loose text-teal-100">
                    {isArabic
                      ? "أدر عيادتك وتواصل مع مرضاك بسهولة، كل ذلك من حساب واحد."
                      : "Manage your clinic and reach your patients easily, all from one account."}
                  </p>
                </div>
              </div>

              <div className="p-8 md:p-10">
                <h1 className={`mb-2 text-2xl font-bold md:text-3xl ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                  {isArabic ? "بيانات الطبيب" : "Doctor Information"}
                </h1>
                <p className={`mb-7 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {isArabic ? "الخطوة ١ من ٤" : "Step 1 of 4"}
                </p>

                <form onSubmit={handleDoctorInfoSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>{isArabic ? "اسم الطبيب" : "Doctor Name"}</label>
                    <div className="relative">
                      <User className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={`${inputClass} ${inputPad}`} placeholder={isArabic ? "اسم الطبيب" : "Doctor Name"} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>{isArabic ? "البريد الإلكتروني" : "Email"}</label>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required className={`${inputClass} ${inputPad} text-left`} placeholder="doctor@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{isArabic ? "رقم الهاتف" : "Phone Number"}</label>
                      <div className="relative">
                        <Phone className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required className={`${inputClass} ${inputPad} text-left`} placeholder="01012345678" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{isArabic ? "التخصص" : "Specialty"}</label>
                    <div className="relative">
                      <Stethoscope className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={`${inputClass} ${inputPad} appearance-none`}>
                        {SPECIALTIES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {isArabic ? s.ar : s.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{isArabic ? "كلمة المرور" : "Password"}</label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input type={showPassword ? "text" : "password"} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClass} ${inputPadWithToggle} text-left`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword((p) => !p)} className={`absolute top-1/2 -translate-y-1/2 transition-colors ${iconEnd} ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${isDark ? "border-red-900 bg-red-950/40 text-red-400" : "border-red-200 bg-red-50 text-red-600"}`}>
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" className="w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/20 transition-all duration-300 hover:bg-teal-700 active:scale-[0.99]">
                    {isArabic ? "التالي" : "Continue"}
                  </button>
                </form>

                <div className={`mt-6 border-t pt-5 text-center ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <p className={isDark ? "text-slate-400" : "text-slate-500"}>{isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}</p>
                  <Link to="/doctor/login" className="font-semibold text-teal-600 hover:text-teal-700">
                    {isArabic ? "تسجيل الدخول" : "Login"}
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* ===================== STEP 2 — Clinic info ===================== */}
          {step === 2 && (
            <div className="p-8 md:p-10">
              <h1 className={`mb-2 text-2xl font-bold md:text-3xl ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                {isArabic ? "بيانات العيادة" : "Clinic Information"}
              </h1>
              <p className={`mb-7 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {isArabic ? "الخطوة ٢ من ٤ — يساعد هذا مرضاك في إيجاد عيادتك" : "Step 2 of 4 — helps patients find your clinic"}
              </p>

              <form onSubmit={handleClinicInfoSubmit} className="space-y-6">
                {/* Logo */}
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className={`flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className={`h-7 w-7 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                    )}
                  </div>
                  <div>
                    <label htmlFor="logo-upload" className="inline-block cursor-pointer rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700">
                      {isArabic ? "رفع لوجو العيادة" : "Upload Clinic Logo"}
                    </label>
                    <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    <p className={`mt-2 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isArabic ? "اختياري — PNG أو JPG حتى 5 ميجابايت" : "Optional — PNG or JPG up to 5MB"}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{isArabic ? "اسم العيادة" : "Clinic Name"}</label>
                    <div className="relative">
                      <Building2 className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required className={`${inputClass} ${inputPad}`} placeholder={isArabic ? "عيادة ابتسامة الحياة" : "Life Smile Clinic"} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{isArabic ? "رقم هاتف العيادة" : "Clinic Phone"}</label>
                    <div className="relative">
                      <Phone className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input type="tel" dir="ltr" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className={`${inputClass} ${inputPad} text-left`} placeholder="01012345678" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{isArabic ? "العنوان" : "Address"}</label>
                  <div className="relative">
                    <MapPin className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} ${inputPad}`} placeholder={isArabic ? "الجيزة، شارع الهرم، أمام مول العرب" : "Giza, Haram Street, in front of Mall of Arabia"} />
                  </div>
                </div>

                {/* Google Maps link instead of manual lat/lng */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className={`${labelClass} mb-0`}>{isArabic ? "موقع العيادة على الخريطة" : "Clinic location"}</label>
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      {isArabic ? "افتح Google Maps" : "Open Google Maps"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <MapPin className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="text"
                      dir="ltr"
                      value={mapsLink}
                      onChange={(e) => handleMapsLinkChange(e.target.value)}
                      className={`${inputClass} ${inputPad} text-left`}
                      placeholder={isArabic ? "الصق رابط موقع عيادتك من Google Maps هنا" : "Paste your clinic's Google Maps link here"}
                    />
                  </div>
                  <p className={`mt-2 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {isArabic
                      ? "افتح موقع عيادتك على خرائط جوجل، اضغط مشاركة وانسخ الرابط، والصقه هنا."
                      : "Open your clinic on Google Maps, tap Share, copy the link, and paste it here."}
                  </p>
                  {mapsLinkTouched && (
                    mapCoords ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isArabic ? "تم تحديد الموقع" : "Location detected"} ({mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)})
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600">
                        {isArabic
                          ? "لم نتعرف على هذا الرابط — جرب رابط \"مشاركة\" الكامل بدل الرابط المختصر."
                          : "We couldn't read this link — try the full \"Share\" link instead of a shortened one."}
                      </p>
                    )
                  )}
                </div>

                <div>
                  <label className={labelClass}>{isArabic ? "صفحة العيادة على فيسبوك" : "Clinic Facebook Page"}</label>
                  <div className="relative">
                    <Facebook className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 ${iconStart} ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input type="url" dir="ltr" value={facebook} onChange={(e) => setFacebook(e.target.value)} className={`${inputClass} ${inputPad} text-left`} placeholder="https://www.facebook.com/YourClinic" />
                  </div>
                </div>

                {/* Working hours */}
                <div>
                  <label className={`${labelClass} flex items-center gap-2`}>
                    <Clock className="h-4 w-4" />
                    {isArabic ? "مواعيد العيادة" : "Clinic Working Hours"}
                  </label>
                  <div className={`space-y-2 rounded-xl border p-3 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                    {DAYS.map((d) => {
                      const dayState = workingHours[d.key];
                      return (
                        <div key={d.key} className="flex flex-wrap items-center gap-3 text-sm">
                          <span className={`w-20 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            {isArabic ? d.ar : d.en}
                          </span>
                          <label className="flex items-center gap-1.5">
                            <input type="checkbox" checked={!dayState.closed} onChange={() => toggleDayClosed(d.key)} className="h-4 w-4 accent-teal-600" />
                            <span className={isDark ? "text-slate-400" : "text-slate-500"}>{isArabic ? "مفتوح" : "Open"}</span>
                          </label>
                          {!dayState.closed && (
                            <>
                              <input type="time" dir="ltr" value={dayState.open} onChange={(e) => updateDayTime(d.key, "open", e.target.value)} className={`rounded-lg border px-2 py-1 text-sm ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white"}`} />
                              <span className={isDark ? "text-slate-500" : "text-slate-400"}>{isArabic ? "إلى" : "to"}</span>
                              <input type="time" dir="ltr" value={dayState.close} onChange={(e) => updateDayTime(d.key, "close", e.target.value)} className={`rounded-lg border px-2 py-1 text-sm ${isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white"}`} />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${isDark ? "border-red-900 bg-red-950/40 text-red-400" : "border-red-200 bg-red-50 text-red-600"}`}>
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className={`rounded-xl px-6 py-3 font-semibold transition ${isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                    {isArabic ? "رجوع" : "Back"}
                  </button>
                  <button type="submit" className="flex-1 rounded-xl bg-teal-600 py-3 font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700">
                    {isArabic ? "التالي" : "Continue"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================== STEP 3 — Subscription ===================== */}
          {step === 3 && (
            <div className="p-8 md:p-10">
              <h1 className={`mb-2 text-2xl font-bold md:text-3xl ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                {isArabic ? "اختر باقة الاشتراك المناسبة لك" : "Choose the plan that fits you"}
              </h1>
              <p className={`mb-7 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {isArabic ? "الخطوة ٣ من ٤ — اختر باقة، ثم اضغط تأكيد بالأسفل" : "Step 3 of 4 — pick a plan, then confirm below"}
              </p>

              <div className="grid gap-5 md:grid-cols-3">
                {PLANS.map((plan) => {
                  const t = isArabic ? plan.ar : plan.en;
                  const isThisSelected = selectedPlan === plan.name;
                  return (
                    <button
                      type="button"
                      key={plan.name}
                      disabled={submitting}
                      onClick={() => handlePickPlan(plan.name)}
                      className={`rounded-2xl border-2 p-6 text-left transition ${submitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
                        isThisSelected
                          ? "border-teal-600 shadow-lg shadow-teal-600/10 ring-2 ring-teal-600/20"
                          : isDark
                          ? "border-slate-800 hover:border-slate-700"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {plan.name === "Professional" && (
                          <div className="mb-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                            {isArabic ? "الأكثر طلبًا" : "Most popular"}
                          </div>
                        )}
                        {isThisSelected && (
                          <CheckCircle2 className="mb-3 h-5 w-5 text-teal-600" />
                        )}
                      </div>
                      <h2 className="text-xl font-bold">{t.label}</h2>
                      <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.desc}</p>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className={`${isArabic ? "mr-1" : "ml-1"} text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {isArabic ? "ج.م / شهريًا" : "EGP / month"}
                        </span>
                      </div>
                      <ul className="mt-5 space-y-2 text-sm">
                        {t.features.map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <span className="font-bold text-teal-600">✓</span>
                            <span className={isDark ? "text-slate-300" : "text-slate-600"}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div
                        className={`mt-6 w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                          isThisSelected
                            ? "bg-teal-600 text-white"
                            : isDark
                            ? "bg-slate-800 text-slate-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isThisSelected
                          ? isArabic ? "الباقة المختارة" : "Selected"
                          : isArabic ? "اختر الباقة" : "Choose Plan"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className={`mt-6 flex items-center gap-2 rounded-xl border p-3 text-sm ${isDark ? "border-red-900 bg-red-950/40 text-red-400" : "border-red-200 bg-red-50 text-red-600"}`}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button type="button" disabled={submitting} onClick={() => setStep(2)} className={`rounded-xl px-6 py-3 font-semibold transition ${isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {isArabic ? "رجوع" : "Back"}
                </button>
                <button
                  type="button"
                  disabled={submitting || !selectedPlan}
                  onClick={handleConfirmAndCreateAccount}
                  className={`flex-1 rounded-xl py-3 font-semibold text-white shadow-lg shadow-teal-600/20 transition ${
                    submitting || !selectedPlan ? "cursor-not-allowed bg-teal-600/50" : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  {submitting
                    ? isArabic ? "جاري الإنشاء..." : "Creating..."
                    : isArabic ? "تأكيد وإنشاء الحساب" : "Confirm and create account"}
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 4 — Confirmation ===================== */}
          {step === 4 && (
            <div className="p-10 text-center md:p-16">
              <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${isDark ? "bg-green-950/40 text-green-400" : "bg-green-50 text-green-600"}`}>
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">{isArabic ? "تم إنشاء حسابك بنجاح!" : "Your account is ready!"}</h1>
              <p className={`mx-auto mb-6 max-w-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {isArabic ? "جاري تحويلك إلى صفحة تسجيل الدخول..." : "Redirecting you to the login page..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;