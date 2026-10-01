import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Languages,
  Moon,
  Sun,
  Activity,
  Trash2,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  facebook: string | null;
  doctor_phone: string | null;
  working_days: number[] | null;
  open_time: string | null;
  close_time: string | null;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ClinicCase = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  before_url: string | null;
  after_url: string | null;
};

const DAY_OPTIONS = [
  { value: 6, ar: "السبت", en: "Saturday" },
  { value: 0, ar: "الأحد", en: "Sunday" },
  { value: 1, ar: "الاثنين", en: "Monday" },
  { value: 2, ar: "الثلاثاء", en: "Tuesday" },
  { value: 3, ar: "الأربعاء", en: "Wednesday" },
  { value: 4, ar: "الخميس", en: "Thursday" },
  { value: 5, ar: "الجمعة", en: "Friday" },
];

const CATEGORY_OPTIONS = [
  { value: "filling", ar: "حشو", en: "Filling" },
  { value: "cleaning", ar: "تنظيف", en: "Cleaning" },
  { value: "whitening", ar: "تبييض", en: "Whitening" },
  { value: "orthodontics", ar: "تقويم", en: "Orthodontics" },
  { value: "implant", ar: "زراعة", en: "Implant" },
  { value: "crown", ar: "تركيبات", en: "Crowns" },
  { value: "extraction", ar: "خلع", en: "Extraction" },
  { value: "rootcanal", ar: "علاج عصب", en: "Root canal" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const inputClass =
  "w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500";

const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

export default function ClinicProfile() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const isArabic = language === "ar";
  const t = translations[language];

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [workingDays, setWorkingDays] = useState<number[]>([]);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [cases, setCases] = useState<ClinicCase[]>([]);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseCategory, setCaseCategory] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [addingCase, setAddingCase] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ============================================
  // Language
  // ============================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");
      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener("dentalcare-language-change", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  // ============================================
  // Theme
  // ============================================

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    window.addEventListener("dentalcare-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("dentalcare-theme-change", handleThemeChange);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLanguage: Language = language === "ar" ? "en" : "ar";

    localStorage.setItem("dentalcare-language", nextLanguage);
    setLanguage(nextLanguage);
    window.dispatchEvent(new Event("dentalcare-language-change"));
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDarkMode = !root.classList.contains("dark");

    root.classList.toggle("dark", nextDarkMode);
    localStorage.setItem("dentalcare-theme", nextDarkMode ? "dark" : "light");
    setIsDarkMode(nextDarkMode);
    window.dispatchEvent(new Event("dentalcare-theme-change"));
  };

  // ============================================
  // Load Clinic
  // ============================================

  useEffect(() => {
    loadClinic();
  }, []);

  const getMessageText = (messageKey: string) => {
    const messages = {
      notLoggedIn: {
        ar: "أنت غير مسجل الدخول.",
        en: "You are not logged in.",
      },
      profileError: {
        ar: "تعذر تحميل بيانات حسابك.",
        en: "Could not load your profile.",
      },
      noClinic: {
        ar: "لا توجد عيادة مرتبطة بهذا الحساب.",
        en: "No clinic is connected to this account.",
      },
      clinicError: {
        ar: "تعذر تحميل بيانات العيادة.",
        en: "Could not load clinic information.",
      },
      somethingWrong: {
        ar: "حدث خطأ ما.",
        en: "Something went wrong.",
      },
      imageOnly: {
        ar: "يرجى اختيار ملف صورة.",
        en: "Please select an image file.",
      },
      imageSize: {
        ar: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت.",
        en: "Image size must be less than 5 MB.",
      },
      nameRequired: {
        ar: "اسم العيادة مطلوب.",
        en: "Clinic name is required.",
      },
      saved: {
        ar: "تم حفظ ملف العيادة بنجاح.",
        en: "Clinic profile saved successfully.",
      },
      savingError: {
        ar: "حدث خطأ أثناء الحفظ.",
        en: "Something went wrong while saving.",
      },
      invalidCoordinates: {
        ar: "خط العرض وخط الطول يجب أن يكونا أرقاماً صحيحة.",
        en: "Latitude and longitude must be valid numbers.",
      },
      caseRequired: {
        ar: "اختر نوع العلاج وارفع صورة قبل وصورة بعد.",
        en: "Choose a treatment type and add a before photo and an after photo.",
      },
      caseNameRequired: {
        ar: "اكتب اسم الحالة.",
        en: "Write the case name.",
      },
      caseAdded: {
        ar: "تمت إضافة الحالة بنجاح.",
        en: "Case added successfully.",
      },
      caseError: {
        ar: "تعذر إضافة الحالة.",
        en: "Could not add the case.",
      },
    };

    return (
      messages[messageKey as keyof typeof messages]?.[language] || messageKey
    );
  };

  const loadCases = async (id: string) => {
    const { data, error } = await supabase
      .from("clinic_cases")
      .select("id, title, category, description, before_url, after_url")
      .eq("clinic_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setCases(data ?? []);
  };

  const loadClinic = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(getMessageText("notLoggedIn"));
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(profileError);
        setMessage(getMessageText("profileError"));
        return;
      }

      if (!profile?.clinic_id) {
        setMessage(getMessageText("noClinic"));
        return;
      }

      setClinicId(profile.clinic_id);

      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", profile.clinic_id)
        .single();

      if (clinicError) {
        console.error(clinicError);
        setMessage(getMessageText("clinicError"));
        return;
      }

      setClinic(clinicData);

      setName(clinicData.name || "");
      setPhone(clinicData.phone || "");
      setWhatsapp(clinicData.whatsapp || "");
      setFacebook(clinicData.facebook || "");
      setDoctorPhone(clinicData.doctor_phone || "");
      setWorkingDays(clinicData.working_days || []);
      setOpenTime((clinicData.open_time || "").slice(0, 5));
      setCloseTime((clinicData.close_time || "").slice(0, 5));
      setAddress(clinicData.address || "");
      setDescription(clinicData.description || "");

      setLatitude(
        clinicData.latitude !== null && clinicData.latitude !== undefined
          ? String(clinicData.latitude)
          : ""
      );

      setLongitude(
        clinicData.longitude !== null && clinicData.longitude !== undefined
          ? String(clinicData.longitude)
          : ""
      );

      if (clinicData.logo_url) {
        setLogoPreview(clinicData.logo_url);
      }

      await loadCases(profile.clinic_id);
    } catch (error) {
      console.error(error);
      setMessage(getMessageText("somethingWrong"));
    } finally {
      setLoading(false);
    }
  };

  // Validates an image file; returns true if OK
  const validateImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage(getMessageText("imageOnly"));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(getMessageText("imageSize"));
      return false;
    }

    setMessage("");
    return true;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !validateImage(file)) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Same bucket and path style as the logo upload
  const uploadImage = async (file: File, prefix: string): Promise<string> => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();

    const filePath = `${clinicId}/${prefix}-${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("clinic-logos")
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("clinic-logos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!clinicId) return;

    if (!name.trim()) {
      setMessage(getMessageText("nameRequired"));
      return;
    }

    const parsedLatitude = latitude.trim() ? Number(latitude.trim()) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude.trim()) : null;

    if (
      (latitude.trim() && !Number.isFinite(parsedLatitude)) ||
      (longitude.trim() && !Number.isFinite(parsedLongitude))
    ) {
      setMessage(getMessageText("invalidCoordinates"));
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      let logoUrl = clinic?.logo_url || null;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, "logo");
      }

      const updates = {
        name: name.trim(),
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        facebook: facebook.trim() || null,
        doctor_phone: doctorPhone.trim() || null,
        working_days: workingDays,
        open_time: openTime || null,
        close_time: closeTime || null,
        address: address.trim() || null,
        description: description.trim() || null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        logo_url: logoUrl,
      };

      const { error } = await supabase
        .from("clinics")
        .update(updates)
        .eq("id", clinicId);

      if (error) {
        console.error(error);
        setMessage(error.message);
        return;
      }

      setClinic((prev) => (prev ? { ...prev, ...updates } : prev));

      setLogoFile(null);

      setMessage(getMessageText("saved"));
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setMessage(
          isArabic
            ? `فشل رفع الصورة: ${error.message}`
            : `Image upload failed: ${error.message}`
        );
      } else {
        setMessage(getMessageText("savingError"));
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Cases (before / after)
  // ============================================

  const handleCaseFile =
    (setter: (file: File | null) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file || !validateImage(file)) return;

      setter(file);
    };

  const handleAddCase = async () => {
    if (!clinicId) return;

    if (!caseCategory || !beforeFile || !afterFile) {
      setMessage(getMessageText("caseRequired"));
      return;
    }

    const isOther = caseCategory === "other";

    if (isOther && !caseTitle.trim()) {
      setMessage(getMessageText("caseNameRequired"));
      return;
    }

    // The case name comes from the treatment type, unless "Other" is chosen
    const finalTitle = isOther
      ? caseTitle.trim()
      : CATEGORY_OPTIONS.find((option) => option.value === caseCategory)?.ar ||
        caseCategory;

    try {
      setAddingCase(true);
      setMessage("");

      const [beforeUrl, afterUrl] = await Promise.all([
        uploadImage(beforeFile, "case-before"),
        uploadImage(afterFile, "case-after"),
      ]);

      const { error } = await supabase.from("clinic_cases").insert({
        clinic_id: clinicId,
        title: finalTitle,
        category: caseCategory,
        description: caseDescription.trim() || null,
        before_url: beforeUrl,
        after_url: afterUrl,
      });

      if (error) {
        console.error(error);
        setMessage(error.message);
        return;
      }

      setCaseTitle("");
      setCaseCategory("");
      setCaseDescription("");
      setBeforeFile(null);
      setAfterFile(null);

      await loadCases(clinicId);
      setMessage(getMessageText("caseAdded"));
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : getMessageText("caseError")
      );
    } finally {
      setAddingCase(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!clinicId) return;

    const confirmed = window.confirm(
      isArabic ? "هل تريد حذف هذه الحالة؟" : "Delete this case?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("clinic_cases")
      .delete()
      .eq("id", caseId);

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

    await loadCases(clinicId);
  };

  const isSuccessMessage =
    message === getMessageText("saved") ||
    message === getMessageText("caseAdded");

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"
      >
        <div className="rounded-2xl bg-white px-10 py-8 shadow-lg dark:bg-slate-900">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {isArabic
              ? "جاري تحميل ملف العيادة..."
              : "Loading clinic profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950"
    >
      {/* ========================================
          Clinic Header
      ======================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Back + Clinic Logo + Clinic Name */}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={isArabic ? "رجوع" : "Go back"}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isArabic ? (
                <ArrowRight className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </button>

            {/* Clinic Logo */}

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-teal-600 text-white shadow-sm">
                {clinic?.logo_url ? (
                  <img
                    src={clinic.logo_url}
                    alt={clinic.name || "Clinic Logo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Activity className="h-5 w-5" />
                )}
              </div>

              {/* Clinic Name */}

              <div className="leading-tight">
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {clinic?.name || (isArabic ? "العيادة" : "Clinic")}
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {isArabic ? "ملف العيادة" : "Clinic Profile"}
                </p>
              </div>
            </div>
          </div>

          {/* Language + Theme */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={isArabic ? "تغيير اللغة" : "Change language"}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Languages className="h-4 w-4" />

              <span className="hidden sm:inline">
                {isArabic ? "English" : "العربية"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDarkMode
                  ? isArabic
                    ? "الوضع الفاتح"
                    : "Light mode"
                  : isArabic
                  ? "الوضع الداكن"
                  : "Dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================
          Page Content
      ======================================== */}

      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isArabic ? "ملف العيادة" : "Clinic Profile"}
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {isArabic
              ? "إدارة معلومات العيادة واللوجو الخاص بها."
              : "Manage your clinic information and logo."}
          </p>

          {/* Logo Section */}

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isArabic ? "لوجو العيادة" : "Clinic Logo"}
            </h2>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={isArabic ? "لوجو العيادة" : "Clinic Logo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-3">
                    {isArabic ? "لا يوجد لوجو" : "No Logo"}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="logo-upload"
                  className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition"
                >
                  {isArabic ? "اختيار صورة" : "Choose Image"}
                </label>

                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  PNG, JPG, JPEG, WEBP
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic
                    ? "الحد الأقصى للحجم: 5 ميجابايت"
                    : "Maximum size: 5 MB"}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isArabic
                    ? "تظهر في أعلى صفحة العيادة بجانب الاسم."
                    : "Shown at the top of your clinic page next to the name."}
                </p>

                {logoFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {isArabic ? "تم اختيار: " : "Selected: "}
                    {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Clinic Information */}

          <div className="space-y-5">
            {/* Clinic Name */}

            <div>
              <label className={labelClass}>
                {isArabic ? "اسم العيادة *" : "Clinic Name *"}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isArabic ? "أدخل اسم العيادة" : "Enter clinic name"}
                className={inputClass}
              />
            </div>

            {/* Phone */}

            <div>
              <label className={labelClass}>
                {isArabic ? "رقم العيادة" : "Clinic Phone"}
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={
                  isArabic ? "أدخل رقم الهاتف" : "Enter phone number"
                }
                className={inputClass}
              />
            </div>

            {/* WhatsApp */}

            <div>
              <label className={labelClass}>WhatsApp</label>

              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={
                  isArabic ? "أدخل رقم واتساب" : "Enter WhatsApp number"
                }
                className={inputClass}
              />
            </div>

            {/* Facebook */}

            <div>
              <label className={labelClass}>Facebook</label>

              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder={
                  isArabic
                    ? "ضع رابط صفحة العيادة على Facebook"
                    : "Enter your clinic Facebook page URL"
                }
                className={inputClass}
              />

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isArabic
                  ? "مثال: https://www.facebook.com/YourClinic"
                  : "Example: https://www.facebook.com/YourClinic"}
              </p>
            </div>

            {/* Doctor Phone */}

            <div>
              <label className={labelClass}>
                {isArabic ? "رقم الدكتور" : "Doctor Phone"}
              </label>

              <input
                type="text"
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                placeholder={
                  isArabic ? "أدخل رقم الدكتور" : "Enter doctor phone number"
                }
                className={inputClass}
              />
            </div>

            {/* Address */}

            <div>
              <label className={labelClass}>
                {isArabic ? "العنوان" : "Address"}
              </label>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  isArabic ? "أدخل عنوان العيادة" : "Enter clinic address"
                }
                className={inputClass}
              />
            </div>

            {/* Location */}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isArabic ? "موقع العيادة على الخريطة" : "Clinic Map Location"}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isArabic
                  ? "أدخل Latitude و Longitude لموقع العيادة الدقيق."
                  : "Enter the exact latitude and longitude of your clinic."}
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Latitude */}

                <div>
                  <label className={labelClass}>Latitude</label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Example: 30.0444"
                    className={inputClass}
                  />
                </div>

                {/* Longitude */}

                <div>
                  <label className={labelClass}>Longitude</label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Example: 31.2357"
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {isArabic
                  ? "يمكنك الحصول على الإحداثيات من Google Maps."
                  : "You can get the coordinates from Google Maps."}
              </p>
            </div>

            {/* Working Hours */}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isArabic ? "مواعيد العمل" : "Working Hours"}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isArabic
                  ? "اختر أيام العمل ووقت الفتح والإغلاق."
                  : "Choose your working days and opening / closing time."}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {DAY_OPTIONS.map((day) => {
                  const active = workingDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setWorkingDays((prev) =>
                          prev.includes(day.value)
                            ? prev.filter((d) => d !== day.value)
                            : [...prev, day.value]
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {isArabic ? day.ar : day.en}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    {isArabic ? "وقت الفتح" : "Opening time"}
                  </label>

                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {isArabic ? "وقت الإغلاق" : "Closing time"}
                  </label>

                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Description */}

            <div>
              <label className={labelClass}>
                {isArabic ? "وصف العيادة" : "Clinic Description"}
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isArabic
                    ? "اكتب وصفاً مختصراً عن عيادتك..."
                    : "Write a short description about your clinic..."
                }
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Message */}

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                isSuccessMessage
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Save Button */}

          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {saving
                ? isArabic
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isArabic
                ? "حفظ التغييرات"
                : "Save Changes"}
            </button>
          </div>

          {/* ========================================
              Cases (before / after)
          ======================================== */}

          <div className="mt-12 border-t border-gray-200 dark:border-slate-800 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isArabic ? "صور الحالات (قبل وبعد)" : "Case Photos (Before / After)"}
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {isArabic
                ? "الحالات اللي تضيفها هنا بتظهر للناس في صفحة العيادة. الإضافة والحذف بيتم فوراً من غير زرار الحفظ."
                : "Cases you add here appear on your public clinic page. Adding and deleting happen immediately, without the Save button."}
            </p>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  {isArabic ? "نوع العلاج" : "Treatment Type"}
                </label>

                <select
                  value={caseCategory}
                  onChange={(e) => setCaseCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">
                    {isArabic ? "اختر النوع" : "Select type"}
                  </option>

                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {isArabic ? option.ar : option.en}
                    </option>
                  ))}
                </select>
              </div>

              {caseCategory === "other" && (
                <div>
                  <label className={labelClass}>
                    {isArabic ? "اسم الحالة" : "Case Name"}
                  </label>

                  <input
                    type="text"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder={
                      isArabic
                        ? "اكتب اسم الحالة"
                        : "Write the case name"
                    }
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>
                  {isArabic ? "وصف اللي تم عمله" : "What was done"}
                </label>

                <textarea
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    isArabic
                      ? "مثال: حشو تجميلي لسنتين مع تنظيف جير"
                      : "Example: Cosmetic filling for two teeth plus scaling"
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    id: "case-before",
                    text: isArabic ? "صورة قبل" : "Before Photo",
                    file: beforeFile,
                    setter: setBeforeFile,
                  },
                  {
                    id: "case-after",
                    text: isArabic ? "صورة بعد" : "After Photo",
                    file: afterFile,
                    setter: setAfterFile,
                  },
                ].map(({ id, text, file, setter }) => (
                  <div key={id}>
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-4 text-sm text-gray-600 dark:text-gray-300 hover:border-blue-400 transition"
                    >
                      <span className="truncate">{file ? file.name : text}</span>
                    </label>

                    <input
                      id={id}
                      type="file"
                      accept="image/*"
                      onChange={handleCaseFile(setter)}
                      className="hidden"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCase}
                disabled={addingCase}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {addingCase
                  ? isArabic
                    ? "جاري الإضافة..."
                    : "Adding..."
                  : isArabic
                  ? "إضافة الحالة"
                  : "Add Case"}
              </button>
            </div>

            {cases.length > 0 && (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {cases.map((c) => {
                  const categoryLabel = CATEGORY_OPTIONS.find(
                    (option) => option.value === c.category
                  );

                  return (
                    <li
                      key={c.id}
                      className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700"
                    >
                      <div dir="ltr" className="grid grid-cols-2 gap-px">
                        <img
                          src={c.before_url ?? ""}
                          alt={`${c.title} - ${isArabic ? "قبل" : "before"}`}
                          className="aspect-[4/3] w-full object-cover"
                        />
                        <img
                          src={c.after_url ?? ""}
                          alt={`${c.title} - ${isArabic ? "بعد" : "after"}`}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {categoryLabel && c.category !== "other"
                              ? isArabic
                                ? categoryLabel.ar
                                : categoryLabel.en
                              : c.title}
                          </p>

                          {c.description && (
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {c.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCase(c.id)}
                          aria-label={isArabic ? "حذف" : "Delete"}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}