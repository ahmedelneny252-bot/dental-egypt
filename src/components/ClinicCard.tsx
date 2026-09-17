import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
  ArrowUpRight,
  Heart,
} from "lucide-react";
import { translations, type Language } from "../i18n";
import type { Clinic as LocalClinic } from "../data/clinics";

type SupabaseClinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
};

type ClinicCardProps = {
  clinic: LocalClinic | SupabaseClinic;
};

const ClinicCard = ({ clinic }: ClinicCardProps) => {
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

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  const isLocalClinic = "image" in clinic;

  const image = isLocalClinic
    ? clinic.image
    : clinic.logo_url;

  const phone = clinic.phone;

  const whatsapp = clinic.whatsapp;

  const address = clinic.address;

  const description = clinic.description;

  const clinicId = clinic.id;

  const rating = isLocalClinic
    ? clinic.rating
    : null;

  const reviewCount = isLocalClinic
    ? clinic.reviewCount
    : null;

  const doctorName = isLocalClinic
    ? clinic.doctorName
    : null;

  const whatsappNumber = whatsapp
    ? whatsapp.replace(/\D/g, "")
    : "";

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : "";

  const phoneUrl = phone
    ? `tel:${phone}`
    : "";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={clinic.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-teal-700">
            <span className="text-5xl font-bold text-white">
              {clinic.name?.charAt(0) || "D"}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/60 via-teal-950/10 to-transparent" />

        {/* Rating */}
        {rating !== null ? (
          <div
            className={`absolute top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-teal-700 shadow-md ${
              isArabic ? "right-4" : "left-4"
            }`}
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

            <span>{rating.toFixed(1)}</span>
          </div>
        ) : null}

        {/* Address */}
        {address && (
          <div
            className={`absolute bottom-4 max-w-[80%] truncate rounded-full bg-teal-500/90 px-3 py-1.5 text-sm font-semibold text-white ${
              isArabic ? "right-4" : "left-4"
            }`}
          >
            {address}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-800 dark:text-white">
              {clinic.name}
            </h3>

            <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
              {t.common.dentalClinic}
            </p>
          </div>

          <Heart className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
        </div>

        {/* Doctor */}
        {doctorName && (
          <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {doctorName}
          </p>
        )}

        {/* Address */}
        {address && (
          <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4 flex-shrink-0 text-teal-500" />

            <span className="truncate">
              {address}
            </span>
          </div>
        )}

        {/* Rating */}
        {rating !== null && reviewCount !== null && (
          <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {rating.toFixed(1)}
            </span>

            <span>
              ({reviewCount}{" "}
              {isArabic ? "تقييم" : "reviews"})
            </span>
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {t.clinic.aboutClinic}
          </p>

          <p className="line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description ||
              (isArabic
                ? "يمكنك معرفة المزيد عن العيادة والتواصل معها من خلال صفحة العيادة."
                : "You can learn more about this clinic and contact it through the clinic page.")}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {/* Phone */}
          {phone ? (
            <a
              href={phoneUrl}
              className="flex items-center justify-center rounded-lg bg-slate-100 py-2.5 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={t.common.phone}
              aria-label={t.common.phone}
            >
              <Phone className="h-4 w-4" />
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-lg bg-slate-100 py-2.5 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
              <Phone className="h-4 w-4" />
            </div>
          )}

          {/* WhatsApp */}
          {whatsappNumber ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg bg-green-500 py-2.5 text-white transition-colors hover:bg-green-600"
              title={t.common.whatsapp}
              aria-label={t.common.whatsapp}
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-lg bg-slate-100 py-2.5 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
              <MessageCircle className="h-4 w-4" />
            </div>
          )}

          {/* Details */}
          <Link
            to={`/clinics/${clinicId}`}
            className="relative z-10 flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            <ArrowUpRight className="h-4 w-4" />

            <span>{t.common.details}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;