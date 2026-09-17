import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import ClinicCard from "../components/ClinicCard";
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

const Clinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(
      "dentalcare-language"
    );

    return savedLanguage === "en" ? "en" : "ar";
  });

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const isArabic = language === "ar";
  const t = translations[language];

  // Language + Theme listener
  useEffect(() => {
    const updateSettings = () => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      setLanguage(
        savedLanguage === "en" ? "en" : "ar"
      );

      setIsDark(
        document.documentElement.classList.contains(
          "dark"
        )
      );
    };

    window.addEventListener(
      "dentalcare-language-change",
      updateSettings
    );

    window.addEventListener(
      "storage",
      updateSettings
    );

    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.classList.contains(
          "dark"
        )
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        updateSettings
      );

      window.removeEventListener(
        "storage",
        updateSettings
      );

      observer.disconnect();
    };
  }, []);

  // Load clinics
  useEffect(() => {
    const loadClinics = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("clinics")
          .select(
            "id, name, logo_url, phone, whatsapp, address, description, slug"
          )
          .order("name", { ascending: true });

        if (error) {
          console.error("Clinics error:", error);

          setError(error.message);
          setClinics([]);

          return;
        }

        console.log(
          "Clinics loaded from Supabase:",
          data
        );

        setClinics(data || []);
      } catch (err) {
        console.error(
          "Unexpected clinics error:",
          err
        );

        setError(
          isArabic
            ? "حدث خطأ أثناء تحميل العيادات."
            : "An error occurred while loading clinics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClinics();
  }, [isArabic]);

  // Search
  const filteredClinics = clinics.filter(
    (clinic) => {
      const search = searchQuery
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      return (
        clinic.name
          ?.toLowerCase()
          .includes(search) ||
        clinic.address
          ?.toLowerCase()
          .includes(search) ||
        clinic.phone
          ?.toLowerCase()
          .includes(search) ||
        clinic.description
          ?.toLowerCase()
          .includes(search)
      );
    }
  );

  // Loading
  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`min-h-screen px-6 py-10 pt-32 transition-colors duration-300 ${
          isDark
            ? "bg-slate-950"
            : "bg-slate-50"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div
                className={`mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 ${
                  isDark
                    ? "border-slate-700 border-t-teal-500"
                    : "border-slate-200 border-t-teal-600"
                }`}
              />

              <p
                className={
                  isDark
                    ? "text-slate-300"
                    : "text-slate-600"
                }
              >
                {isArabic
                  ? "جاري تحميل العيادات..."
                  : "Loading clinics..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`min-h-screen px-6 py-10 pt-32 transition-colors duration-300 ${
          isDark
            ? "bg-slate-950"
            : "bg-slate-50"
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={`rounded-2xl p-16 text-center shadow-sm ${
              isDark
                ? "bg-slate-900"
                : "bg-white"
            }`}
          >
            <h2 className="text-2xl font-bold text-red-500">
              {isArabic
                ? "حدث خطأ أثناء تحميل العيادات"
                : "Error Loading Clinics"}
            </h2>

            <p
              className={`mt-3 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
            >
              {t.common.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen px-6 py-10 pt-32 transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className={`text-4xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {t.clinic.searchTitle}
          </h1>

          <p
            className={`mt-3 ${
              isDark
                ? "text-slate-400"
                : "text-slate-600"
            }`}
          >
            {t.clinic.searchDescription}
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mb-8 max-w-2xl">
          <div className="relative">
            <Search
              className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 ${
                isArabic
                  ? "right-4"
                  : "left-4"
              } ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              placeholder={
                t.clinic.searchPlaceholder
              }
              dir={isArabic ? "rtl" : "ltr"}
              className={`w-full rounded-2xl border py-4 outline-none shadow-sm transition ${
                isArabic
                  ? "pl-5 pr-12"
                  : "pl-12 pr-5"
              } ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-900"
                  : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              }`}
            />
          </div>
        </div>

        {/* All Clinics */}
        <div
          className={`mb-6 flex items-center justify-between rounded-2xl border px-5 py-4 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div>
            <h2
              className={`text-xl font-bold ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {isArabic
                ? "عرض جميع العيادات"
                : "All Clinics"}
            </h2>

            <p
              className={`mt-1 text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {t.clinic.showing}{" "}
              {filteredClinics.length}{" "}
              {t.clinic.of}{" "}
              {clinics.length}{" "}
              {t.clinic.clinic}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10">
            <Search className="h-5 w-5 text-teal-500" />
          </div>
        </div>

        {/* No Clinics */}
        {clinics.length === 0 && (
          <div
            className={`rounded-2xl p-16 text-center shadow-sm ${
              isDark
                ? "bg-slate-900"
                : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-semibold ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {t.clinic.noClinics}
            </h2>

            <p
              className={`mt-2 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {t.clinic.noClinicsDescription}
            </p>
          </div>
        )}

        {/* No Search Results */}
        {clinics.length > 0 &&
          filteredClinics.length === 0 && (
            <div
              className={`rounded-2xl p-16 text-center shadow-sm ${
                isDark
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {t.clinic.noMatchingClinics}
              </h2>

              <p
                className={`mt-2 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {
                  t.clinic
                    .noMatchingClinicsDescription
                }
              </p>

              <button
                onClick={() =>
                  setSearchQuery("")
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-100 px-4 py-2 font-medium text-teal-700 transition hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:hover:bg-teal-900"
              >
                {isArabic ? (
                  <ArrowRight className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}

                {t.clinic.resetSearch}
              </button>
            </div>
          )}

        {/* Clinics */}
        {filteredClinics.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClinics.map(
              (clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clinics;