import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { translations, type Language } from "../i18n";

type SearchBarProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

const SearchBar = ({
  searchQuery,
  setSearchQuery,
}: SearchBarProps) => {
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

  useEffect(() => {
    const updateSettings = () => {
      const savedLanguage = localStorage.getItem(
        "dentalcare-language"
      );

      setLanguage(savedLanguage === "en" ? "en" : "ar");

      setIsDark(
        document.documentElement.classList.contains("dark")
      );
    };

    window.addEventListener(
      "dentalcare-language-change",
      updateSettings
    );

    window.addEventListener("storage", updateSettings);

    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.classList.contains("dark")
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

  const placeholder = isArabic
    ? "ابحث عن عيادة، طبيب، مدينة، أو خدمة..."
    : "Search for a clinic, doctor, city, or service...";

  const searchText = isArabic ? "ابحث" : "Search";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-xl transition-colors duration-300 ${
          isDark
            ? "border-slate-700 bg-slate-900 shadow-slate-950/40"
            : "border-slate-100 bg-white shadow-slate-200/60"
        }`}
      >
        <div className="flex items-center gap-1 p-2">
          <div
            className={`flex flex-1 items-center gap-3 rounded-xl px-4 py-3 ${
              isDark
                ? "bg-slate-800"
                : "bg-slate-50"
            }`}
          >
            <Search
              className={`h-5 w-5 flex-shrink-0 ${
                isDark
                  ? "text-teal-400"
                  : "text-teal-500"
              }`}
            />

            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              dir={isArabic ? "rtl" : "ltr"}
              className={`flex-1 bg-transparent text-sm outline-none ${
                isDark
                  ? "text-white placeholder:text-slate-500"
                  : "text-slate-700 placeholder:text-slate-400"
              }`}
            />
          </div>

          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98]"
          >
            {searchText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;