import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
};

export default function ClinicProfile() {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");
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
    };

    return messages[messageKey as keyof typeof messages]?.[language] || messageKey;
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
      setAddress(clinicData.address || "");
      setDescription(clinicData.description || "");

      if (clinicData.logo_url) {
        setLogoPreview(clinicData.logo_url);
      }
    } catch (error) {
      console.error(error);
      setMessage(getMessageText("somethingWrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage(getMessageText("imageOnly"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(getMessageText("imageSize"));
      return;
    }

    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    setMessage("");
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !clinicId) {
      return clinic?.logo_url || null;
    }

    const safeFileName = logoFile.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const filePath = `${clinicId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("clinic-logos")
      .upload(filePath, logoFile, {
        upsert: false,
        contentType: logoFile.type,
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

    try {
      setSaving(true);
      setMessage("");

      let logoUrl = clinic?.logo_url || null;

      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const { error } = await supabase
        .from("clinics")
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          address: address.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
        })
        .eq("id", clinicId);

      if (error) {
        console.error(error);
        setMessage(error.message);
        return;
      }

      setClinic((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              phone: phone.trim() || null,
              whatsapp: whatsapp.trim() || null,
              address: address.trim() || null,
              description: description.trim() || null,
              logo_url: logoUrl,
            }
          : prev
      );

      setLogoFile(null);

      setMessage(getMessageText("saved"));
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setMessage(
          isArabic
            ? `فشل رفع اللوجو: ${error.message}`
            : `Logo upload failed: ${error.message}`
        );
      } else {
        setMessage(getMessageText("savingError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const isSuccessMessage =
    message === getMessageText("saved");

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen pt-32 flex items-center justify-center bg-gray-50 dark:bg-slate-950"
      >
        <p className="text-gray-600 dark:text-gray-300">
          {isArabic
            ? "جاري تحميل ملف العيادة..."
            : "Loading clinic profile..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-32 px-4 pb-12"
    >
      <div className="max-w-4xl mx-auto">
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
              {/* Logo Preview */}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isArabic ? "اسم العيادة *" : "Clinic Name *"}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isArabic
                    ? "أدخل اسم العيادة"
                    : "Enter clinic name"
                }
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isArabic ? "رقم الهاتف" : "Phone"}
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={
                  isArabic
                    ? "أدخل رقم الهاتف"
                    : "Enter phone number"
                }
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp
              </label>

              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={
                  isArabic
                    ? "أدخل رقم واتساب"
                    : "Enter WhatsApp number"
                }
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isArabic ? "العنوان" : "Address"}
              </label>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  isArabic
                    ? "أدخل عنوان العيادة"
                    : "Enter clinic address"
                }
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
        </div>
      </div>
    </div>
  );
}