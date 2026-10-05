import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Users,
  Shield,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

type SubmitStatus = "success" | "error" | null;

type SiteSettings = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address_ar: string | null;
  address_en: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
};

const Contact = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "phone, whatsapp, email, address_ar, address_en, facebook, instagram, linkedin"
        )
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Site settings error:", error);
        return;
      }

      setSettings(data);
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const updateLanguage = () => {
      const saved = localStorage.getItem("dentalcare-language");
      setLanguage(saved === "en" ? "en" : "ar");
    };

    window.addEventListener("dentalcare-language-change", updateLanguage);
    window.addEventListener("storage", updateLanguage);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        updateLanguage
      );
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  const isArabic = language === "ar";
  const t = translations[language];

  const info = {
    phone: settings?.phone?.trim() || "",
    whatsapp: settings?.whatsapp?.trim() || "",
    email: settings?.email?.trim() || "",
    facebook: settings?.facebook?.trim() || "",
    instagram: settings?.instagram?.trim() || "",
    linkedin: settings?.linkedin?.trim() || "",
  };

  const address =
    (isArabic ? settings?.address_ar : settings?.address_en)?.trim() || "";

  const phoneHref = info.phone
    ? `tel:${info.phone.replace(/[^\d+]/g, "")}`
    : "";

  const whatsappHref = info.whatsapp
    ? `https://wa.me/${info.whatsapp.replace(/\D/g, "")}`
    : "";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    setTimeout(() => {
      if (formData.name && formData.email && formData.message) {
        setSubmitStatus("success");

        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
        });
      } else {
        setSubmitStatus("error");
      }

      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background pt-16 text-foreground transition-colors"
    >
      {/* Header */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
              {isArabic ? "اتصل بنا" : "Contact Us"}
            </h1>

            <p className="mx-auto max-w-2xl text-muted-foreground">
              {isArabic
                ? "نحن هنا لمساعدتك في أي استفسار أو طلب"
                : "We are here to help you with any question or request"}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <h2 className="mb-6 text-xl font-bold text-foreground md:text-2xl">
                {isArabic ? "أرسل لنا رسالة" : "Send Us a Message"}
              </h2>

              {/* Success */}
              {submitStatus === "success" && (
                <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />

                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {isArabic
                        ? "تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريبًا."
                        : "Your message was sent successfully! We will get back to you soon."}
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {submitStatus === "error" && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-red-500" />

                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {isArabic
                        ? "يرجى ملء جميع الحقول المطلوبة والمحاولة مرة أخرى."
                        : "Please fill in all required fields and try again."}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name + Email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      {isArabic ? "الاسم الكامل" : "Full Name"}
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder={
                        isArabic
                          ? "أدخل اسمك الكامل"
                          : "Enter your full name"
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      {t.auth.email}
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder={
                        isArabic
                          ? "أدخل بريدك الإلكتروني"
                          : "Enter your email"
                      }
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {isArabic
                      ? "رقم الهاتف (اختياري)"
                      : "Phone Number (Optional)"}
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={
                      isArabic
                        ? "أدخل رقم هاتفك"
                        : "Enter your phone number"
                    }
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {isArabic ? "الرسالة" : "Message"}
                  </label>

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    rows={5}
                    placeholder={
                      isArabic
                        ? "اكتب رسالتك هنا..."
                        : "Write your message here..."
                    }
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/30 active:scale-[0.98] ${
                    isSubmitting ? "cursor-not-allowed opacity-80" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />

                      <span>
                        {isArabic ? "جاري الإرسال..." : "Sending..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />

                      <span>
                        {isArabic ? "إرسال الرسالة" : "Send Message"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Platform Contact */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
                <h2 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
                  {isArabic ? "تواصل مع المنصة" : "Contact the Platform"}
                </h2>

                <div className="space-y-5">
                  {/* Address */}
                  {address && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                        <MapPin className="h-5 w-5 text-teal-500" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isArabic ? "المقر الرئيسي" : "Head Office"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {info.phone && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                        <Phone className="h-5 w-5 text-teal-500" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t.common.phone}
                        </p>

                        <a
                          href={phoneHref}
                          dir="ltr"
                          className="text-sm text-muted-foreground transition-colors hover:text-teal-500"
                        >
                          {info.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {info.whatsapp && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                        <MessageCircle className="h-5 w-5 text-teal-500" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t.common.whatsapp}
                        </p>

                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="text-sm text-muted-foreground transition-colors hover:text-teal-500"
                        >
                          {info.whatsapp}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {info.email && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                        <Mail className="h-5 w-5 text-teal-500" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t.auth.email}
                        </p>

                        <a
                          href={`mailto:${info.email}`}
                          dir="ltr"
                          className="text-sm text-muted-foreground transition-colors hover:text-teal-500"
                        >
                          {info.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  {(info.facebook || info.instagram || info.linkedin) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                        <Users className="h-5 w-5 text-teal-500" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isArabic
                            ? "وسائل التواصل الاجتماعي"
                            : "Social Media"}
                        </p>

                        <div className="mt-1 flex gap-3">
                          {info.facebook && (
                            <a
                              href={info.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Facebook"
                              className="text-muted-foreground transition-colors hover:text-teal-500"
                            >
                              <Facebook className="h-5 w-5" />
                            </a>
                          )}

                          {info.instagram && (
                            <a
                              href={info.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                              className="text-muted-foreground transition-colors hover:text-teal-500"
                            >
                              <Instagram className="h-5 w-5" />
                            </a>
                          )}

                          {info.linkedin && (
                            <a
                              href={info.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="LinkedIn"
                              className="text-muted-foreground transition-colors hover:text-teal-500"
                            >
                              <Linkedin className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Why Contact Us */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
                <h2 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
                  {isArabic ? "لماذا تتواصل معنا؟" : "Why Contact Us?"}
                </h2>

                <div className="space-y-4">
                  {/* Support */}
                  <div className="flex items-start gap-3">
                    <Shield className="mt-1 h-4 w-4 flex-shrink-0 text-teal-500" />

                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {isArabic ? "الدعم والمساعدة" : "Support & Help"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {isArabic
                          ? "فريق الدعم متاح للإجابة على جميع استفساراتك حول المنصة والعيادات"
                          : "Our support team is available to answer your questions about the platform and clinics."}
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-teal-500" />

                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {isArabic
                          ? "اقتراحات وتحسينات"
                          : "Suggestions & Improvements"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {isArabic
                          ? "نسعى دائمًا لتحسين خدماتنا بناءً على ملاحظاتكم واقتراحاتكم"
                          : "We always aim to improve our services based on your feedback and suggestions."}
                      </p>
                    </div>
                  </div>

                  {/* Partnerships */}
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-teal-500" />

                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {isArabic
                          ? "شراكات وتعاونات"
                          : "Partnerships & Collaboration"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {isArabic
                          ? "نحن مفتوحون للتعاون مع العيادات والمتخصصين في مجال طب الأسنان"
                          : "We are open to partnerships with dental clinics and professionals."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;