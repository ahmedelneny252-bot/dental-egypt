import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
};

const ClinicDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(
      "dentalcare-language"
    );

    return savedLanguage === "en" ? "en" : "ar";
  });

  const t = translations[language];
  const isArabic = language === "ar";

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      setLanguage(
        savedLanguage === "en" ? "en" : "ar"
      );
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

  useEffect(() => {
    const loadClinic = async () => {
      if (!id) {
        setError(
          isArabic
            ? "رقم العيادة غير موجود."
            : "Clinic ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("Loading clinic with ID:", id);

        const { data, error } = await supabase
          .from("clinics")
          .select(
            "id, name, logo_url, phone, whatsapp, address, description, slug"
          )
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error(
            "Clinic detail error:",
            error
          );

          setClinic(null);
          setError(error.message);
          return;
        }

        console.log("Clinic loaded:", data);

        if (!data) {
          setClinic(null);

          setError(
            isArabic
              ? "لم يتم العثور على هذه العيادة."
              : "This clinic could not be found."
          );

          return;
        }

        setClinic(data);
      } catch (err) {
        console.error(
          "Unexpected clinic detail error:",
          err
        );

        setClinic(null);

        setError(
          isArabic
            ? "حدث خطأ أثناء تحميل بيانات العيادة."
            : "An error occurred while loading the clinic information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClinic();
  }, [id, isArabic]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-500" />

          <p className="text-slate-600 dark:text-slate-300">
            {language === "ar"
              ? "جاري تحميل بيانات العيادة..."
              : "Loading clinic information..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Star className="h-12 w-12 text-slate-400" />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-slate-700 dark:text-white">
            {t.clinic.notFound}
          </h2>

          <p className="mb-4 text-slate-500 dark:text-slate-400">
            {t.clinic.notFoundDescription}
          </p>

          {error && (
            <p className="mb-6 break-words rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
          >
            {isArabic ? (
              <ArrowRight className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}

            {t.common.back} {t.common.clinics}
          </Link>
        </div>
      </div>
    );
  }

  const phoneUrl = clinic.phone
    ? `tel:${clinic.phone}`
    : "";

  const whatsappNumber = clinic.whatsapp
    ? clinic.whatsapp.replace(/\D/g, "")
    : "";

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : "";

  const googleMapsUrl = clinic.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        clinic.address
      )}`
    : "";

  const imageUrl =
    clinic.logo_url ||
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80";

  return (
    <div
      className={`min-h-screen bg-slate-50 pt-24 dark:bg-slate-950 ${
        isArabic ? "text-right" : "text-left"
      }`}
    >
      {/* Back */}
      <div className="mx-auto max-w-7xl px-6 py-5">
        <Link
          to="/clinics"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
        >
          {isArabic ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}

          {t.common.back} {t.common.clinics}
        </Link>
      </div>

      {/* Clinic Header */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            {/* Image */}
            <div className="h-40 w-40 shrink-0 overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
              <img
                src={imageUrl}
                alt={clinic.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Information */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                {clinic.name}
              </h1>

              <p className="mt-2 font-medium text-teal-600 dark:text-teal-400">
                {t.common.dentalClinic}
              </p>

              {clinic.address && (
                <div className="mt-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />

                  <span>{clinic.address}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />

                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {t.common.noReviews}
                </span>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3">
              {clinic.phone && (
                <a
                  href={phoneUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700"
                >
                  <Phone className="h-5 w-5" />
                  {t.common.phone}
                </a>
              )}

              {whatsappNumber && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t.common.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.clinic.aboutClinic}
              </h2>

              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                {clinic.description ||
                  t.clinic.noDescription}
              </p>
            </section>

            {/* Services */}
            <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t.clinic.availableServices}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t.clinic.servicesDescription}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
                <p className="text-slate-500 dark:text-slate-400">
                  {t.clinic.noServices}
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Contact */}
            <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.clinic.contactClinic}
              </h2>

              <div className="mt-5 space-y-3">
                {clinic.phone && (
                  <a
                    href={phoneUrl}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />

                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t.common.phone}
                      </p>

                      <p className="font-medium text-slate-900 dark:text-white">
                        {clinic.phone}
                      </p>
                    </div>
                  </a>
                )}

                {whatsappNumber && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />

                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t.common.whatsapp}
                      </p>

                      <p className="font-medium text-slate-900 dark:text-white">
                        {clinic.whatsapp}
                      </p>
                    </div>
                  </a>
                )}

                {clinic.address && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />

                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t.common.address}
                      </p>

                      <p className="font-medium text-slate-900 dark:text-white">
                        {clinic.address}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </section>

            {/* Booking */}
            <section className="rounded-2xl bg-teal-600 p-6 text-white shadow-sm">
              <h2 className="text-xl font-bold">
                {t.common.bookAppointmentNow}
              </h2>

              <p className="mt-2 text-sm leading-6 text-teal-50">
                {t.clinic.bookingDescription}
              </p>

              <Link
                to={`/clinics/${clinic.id}/book`}
                className="mt-4 block w-full rounded-xl bg-white px-5 py-3 text-center font-semibold text-teal-700 hover:bg-teal-50"
              >
                {t.common.bookAppointment}
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ClinicDetail;