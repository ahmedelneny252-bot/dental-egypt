import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Heart,
  Phone,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { translations, type Language } from "../i18n";

const Footer = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

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
              <li className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-teal-500 dark:text-teal-400 shrink-0" />

                <a
                  href="tel:08001234567"
                  dir="ltr"
                  className="text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  0800 123 4567
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-teal-500 dark:text-teal-400 shrink-0" />

                <a
                  href="mailto:info@dentalcare-eg.com"
                  dir="ltr"
                  className="text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  info@dentalcare-eg.com
                </a>
              </li>

              <li className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                  <Instagram className="w-2 h-2 text-white" />
                </div>

                <span
                  dir="ltr"
                  className="text-slate-500 dark:text-slate-400"
                >
                  @dentalcare_eg
                </span>
              </li>
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
          <div className="flex gap-2.5">
            <a
              href="#"
              aria-label="Facebook"
              className="text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>

            <a
              href="#"
              aria-label="Instagram"
              className="text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>

            <a
              href="#"
              aria-label="Twitter"
              className="text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>

            <a
              href="#"
              aria-label="LinkedIn"
              className="text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


