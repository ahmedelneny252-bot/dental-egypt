import {
  Facebook,
  Instagram,
  Linkedin,
  Heart,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

// ============================================================
// بيانات أصحاب المنصة بتتقرأ من جدول site_settings في Supabase
// لتغيير أي بيان: Supabase > Table Editor > site_settings > عدّل الخانة.
// أي خانة فاضية مش بتظهر في الفوتر.
// ============================================================
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

// يطلع اسم الحساب من رابط انستجرام: https://instagram.com/name -> @name
const getInstagramHandle = (url: string) => {
  try {
    const name = new URL(url).pathname.split("/").filter(Boolean)[0];
    return name ? `@${name}` : url;
  } catch {
    return url;
  }
};

const Footer = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const isArabic = language === "ar";
  const t = translations[language];

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
    const handleLanguageChange = () => {
      const saved = localStorage.getItem("dentalcare-language");
      setLanguage(saved === "en" ? "en" : "ar");
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );
    };
  }, []);

  const services = isArabic
    ? [
        "طب الأسنان العام",
        "تقويم الأسنان",
        "تبييض الأسنان",
        "زراعة الأسنان",
        "طب أسنان الأطفال",
      ]
    : [
        "General Dentistry",
        "Orthodontics",
        "Teeth Whitening",
        "Dental Implants",
        "Pediatric Dentistry",
      ];

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

  const socials = [
    { key: "facebook", label: "Facebook", url: info.facebook, icon: Facebook },
    { key: "instagram", label: "Instagram", url: info.instagram, icon: Instagram },
    { key: "linkedin", label: "LinkedIn", url: info.linkedin, icon: Linkedin },
  ].filter((item) => item.url);

  const contactLinkClass =
    "text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors";

  const contactIconClass = "w-3 h-3 text-teal-500 dark:text-teal-400 shrink-0";

  return (
    <footer
      dir={isArabic ? "rtl" : "ltr"}
      className="
        bg-white text-slate-600
        dark:bg-slate-950 dark:text-slate-400
        py-5
        border-t border-slate-200 dark:border-slate-800
      "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 mb-5">

          {/* Platform Info */}
          <div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-2 shadow-sm">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              DentalCare
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              {isArabic
                ? "نربطك بأفضل عيادات الأسنان في مصر. اكتشف، قارن، واحجز موعدك بسهولة."
                : "We connect you with dental clinics across Egypt. Discover, compare, and book your appointment with ease."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
              {isArabic ? "روابط سريعة" : "Quick Links"}
            </h4>

            <ul className="space-y-1 text-[11px]">
              <li>
                <Link
                  to="/"
                  className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  {t.common.home}
                </Link>
              </li>

              <li>
                <Link
                  to="/clinics"
                  className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  {t.common.clinics}
                </Link>
              </li>

              <li>
                <Link
                  to="/services"
                  className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  {t.common.services}
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  {t.common.about}
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  {t.common.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
              {isArabic ? "خدماتنا" : "Our Services"}
            </h4>

            <ul className="space-y-1 text-[11px]">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
              {isArabic ? "تواصل معنا" : "Contact Us"}
            </h4>

            <ul className="space-y-1.5 text-[11px]">
              {info.phone && (
                <li className="flex items-center gap-2">
                  <Phone className={contactIconClass} />

                  <a href={phoneHref} dir="ltr" className={contactLinkClass}>
                    {info.phone}
                  </a>
                </li>
              )}

              {info.whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageCircle className={contactIconClass} />

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={contactLinkClass}
                  >
                    {isArabic ? "واتساب" : "WhatsApp"}
                  </a>
                </li>
              )}

              {info.email && (
                <li className="flex items-center gap-2">
                  <Mail className={contactIconClass} />

                  <a
                    href={`mailto:${info.email}`}
                    dir="ltr"
                    className={contactLinkClass}
                  >
                    {info.email}
                  </a>
                </li>
              )}

              {info.instagram && (
                <li className="flex items-center gap-2">
                  <Instagram className={contactIconClass} />

                  <a
                    href={info.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className={contactLinkClass}
                  >
                    {getInstagramHandle(info.instagram)}
                  </a>
                </li>
              )}

              {address && (
                <li className="flex items-center gap-2">
                  <MapPin className={contactIconClass} />

                  <span className="text-slate-500 dark:text-slate-400">
                    {address}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            © {new Date().getFullYear()}{" "}
            {isArabic
              ? "دنتال كير. جميع الحقوق محفوظة."
              : "DentalCare. All rights reserved."}
          </p>

          {/* Social Media */}
          {socials.length > 0 && (
            <div className="flex gap-2.5">
              {socials.map(({ key, label, url, icon: Icon }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;


