import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Tag } from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Offer = {
  id: string;
  title: string | null;
  description: string | null;
  discount_percentage: number | null;
  image_url: string | null;
  clinic_id: string | null;
  valid_until: string | null;
  created_at: string | null;
};

type ClinicLookup = Record<string, string>;

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [clinicNames, setClinicNames] = useState<ClinicLookup>({});
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

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
  // Load offers
  //
  // NOTE: this expects a Supabase table called
  // "offers" with (at least) the columns below.
  // If the table doesn't exist yet, or is empty,
  // we simply show a friendly "no offers" message
  // instead of an error.
  // ============================================

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, title, description, discount_percentage, image_url, clinic_id, valid_until, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet, or some other
        // issue — treat it the same as "no offers"
        // rather than showing a raw error to patients.
        console.error("Offers error:", error);
        setOffers([]);
        setLoading(false);
        return;
      }

      const offersList = data || [];
      setOffers(offersList);

      // Look up clinic names for any offers that reference one.
      const clinicIds = Array.from(
        new Set(
          offersList
            .map((offer) => offer.clinic_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (clinicIds.length > 0) {
        const { data: clinicsData, error: clinicsError } = await supabase
          .from("clinics")
          .select("id, name")
          .in("id", clinicIds);

        if (!clinicsError && clinicsData) {
          const lookup: ClinicLookup = {};
          clinicsData.forEach((clinic) => {
            lookup[clinic.id] = clinic.name;
          });
          setClinicNames(lookup);
        }
      }

      setLoading(false);
    };

    loadOffers();
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(date));
    } catch {
      return date;
    }
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 dark:bg-slate-950 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          to="/patient/appointments"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
        >
          {isArabic ? (
            <>
              {t.common.back}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              Back
            </>
          )}
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
            <Sparkles className="h-6 w-6" />
          </span>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic ? "عروض خاصة" : "Special Offers"}
            </h1>

            <p className="mt-1 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "أحدث العروض والخصومات من العيادات على المنصة."
                : "The latest offers and discounts from clinics on the platform."}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl bg-white p-16 text-center shadow-sm dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-300">
              {isArabic ? "جاري تحميل العروض..." : "Loading offers..."}
            </p>
          </div>
        ) : offers.length === 0 ? (
          // No offers
          <div className="rounded-2xl bg-white p-16 text-center shadow-sm dark:bg-slate-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Tag className="h-8 w-8 text-slate-400" />
            </div>

            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              {isArabic ? "لا توجد عروض حاليًا" : "No offers right now"}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "تابعنا، وهنعرض هنا أي عروض أو خصومات جديدة من العيادات فور توفرها."
                : "Check back soon — any new offers or discounts from clinics will show up here."}
            </p>

            <Link
              to="/clinics"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700"
            >
              {isArabic ? "تصفح العيادات" : "Browse Clinics"}
            </Link>
          </div>
        ) : (
          // Offers grid
          <div className="grid gap-5 sm:grid-cols-2">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900"
              >
                {offer.image_url && (
                  <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={offer.image_url}
                      alt={offer.title || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {offer.title ||
                        (isArabic ? "عرض خاص" : "Special Offer")}
                    </h3>

                    {typeof offer.discount_percentage === "number" && (
                      <span className="shrink-0 rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                        {isArabic
                          ? `خصم ${offer.discount_percentage}%`
                          : `${offer.discount_percentage}% off`}
                      </span>
                    )}
                  </div>

                  {offer.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {offer.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {offer.clinic_id && clinicNames[offer.clinic_id] && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                        {clinicNames[offer.clinic_id]}
                      </span>
                    )}

                    {offer.valid_until && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                        {isArabic ? "ساري حتى " : "Valid until "}
                        {formatDate(offer.valid_until)}
                      </span>
                    )}
                  </div>

                  {offer.clinic_id && (
                    <Link
                      to={`/clinics/${offer.clinic_id}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      {isArabic ? "عرض العيادة" : "View Clinic"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;