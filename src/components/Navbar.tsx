import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Heart,
  Bell,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isDoctor, setIsDoctor] = useState(false);

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const location = useLocation();

  const isArabic = language === "ar";
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem("dentalcare-language", language);

    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";

    window.dispatchEvent(new Event("dentalcare-language-change"));
  }, [language, isArabic]);

  useEffect(() => {
    localStorage.setItem("dentalcare-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const loadUnreadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUnreadCount(0);
        setIsDoctor(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && profile?.clinic_id) {
        setIsDoctor(true);

        const {
          count,
          error: notificationError,
        } = await supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("clinic_id", profile.clinic_id)
          .eq("is_read", false);

        if (notificationError) {
          console.error(
            "Clinic notification count error:",
            notificationError
          );

          setUnreadCount(0);
          return;
        }

        setUnreadCount(count || 0);
        return;
      }

      setIsDoctor(false);

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (patientError || !patient) {
        setUnreadCount(0);
        return;
      }

      const {
        count,
        error: notificationError,
      } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("patient_id", patient.id)
        .eq("is_read", false);

      if (notificationError) {
        console.error(
          "Patient notification count error:",
          notificationError
        );

        setUnreadCount(0);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Load notifications error:", error);

      setUnreadCount(0);
      setIsDoctor(false);
    }
  };

  useEffect(() => {
    loadUnreadNotifications();
  }, [location.pathname]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUnreadNotifications();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleLanguage = () => {
    setLanguage((currentLanguage) =>
      currentLanguage === "ar" ? "en" : "ar"
    );
  };

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  };

  const notificationPath = isDoctor
    ? "/doctor/notifications"
    : "/patient/notifications";

  const navLinks = [
    {
      to: "/",
      label: t.common.home,
    },
    {
      to: "/clinics",
      label: t.common.clinics,
    },
    {
      to: "/services",
      label: t.common.services,
    },
    {
      to: "/about",
      label: t.common.about,
    },
    {
      to: "/contact",
      label: t.common.contact,
    },
  ];

  return (
    <nav
      dir={isArabic ? "rtl" : "ltr"}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        theme === "dark"
          ? isScrolled
            ? "border-b border-slate-800 bg-slate-950/95 shadow-sm backdrop-blur-md"
            : "bg-slate-950/90 backdrop-blur-sm"
          : isScrolled
            ? "border-b border-teal-100 bg-white/95 shadow-sm backdrop-blur-md"
            : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25 transition-all duration-300 group-hover:shadow-teal-500/40">
              <Heart className="h-6 w-6 fill-white text-white" />
            </div>

            <div className="hidden sm:block">
              <h1
                className={`text-lg font-bold leading-tight ${
                  theme === "dark"
                    ? "text-white"
                    : "text-slate-800"
                }`}
              >
                {isArabic ? "دنتال كير" : "DentalCare"}
              </h1>

              <p className="text-xs font-medium text-teal-500">
                DentalCare Egypt
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? theme === "dark"
                      ? "bg-teal-950 text-teal-400"
                      : "bg-teal-50 text-teal-600"
                    : theme === "dark"
                      ? "text-slate-300 hover:bg-slate-800 hover:text-teal-400"
                      : "text-slate-600 hover:bg-teal-50/50 hover:text-teal-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              type="button"
              className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all ${
                theme === "dark"
                  ? "text-slate-200 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
              }`}
              title={
                isArabic ? t.common.english : t.common.arabic
              }
            >
              <Languages className="h-5 w-5" />

              <span>
                {isArabic ? "EN" : "عربي"}
              </span>
            </button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              type="button"
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                theme === "dark"
                  ? "text-yellow-400 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
              }`}
              title={
                theme === "dark"
                  ? t.common.lightMode
                  : t.common.darkMode
              }
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <Link
              to={notificationPath}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                theme === "dark"
                  ? "text-slate-300 hover:bg-slate-800 hover:text-teal-400"
                  : "text-slate-600 hover:bg-teal-50 hover:text-teal-600"
              }`}
              aria-label={t.common.notifications}
            >
              <Bell className="h-5 w-5" />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-xs font-bold text-white dark:border-slate-950">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Find Clinic */}
            <Link
              to="/clinics"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-teal-500/40"
            >
              <Phone className="h-4 w-4" />
              {t.common.findClinic}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() =>
              setIsMobileMenuOpen(!isMobileMenuOpen)
            }
            type="button"
            className={`rounded-lg p-2 transition-colors lg:hidden ${
              theme === "dark"
                ? "text-slate-200 hover:bg-slate-800"
                : "text-slate-600 hover:bg-teal-50"
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen
              ? "max-h-[700px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div
            className={`rounded-b-2xl border-t py-4 ${
              theme === "dark"
                ? "border-slate-800 bg-slate-950/95"
                : "border-teal-100 bg-white/95"
            }`}
          >
            <div className="flex flex-col gap-1">
              {/* Mobile Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={`rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? theme === "dark"
                        ? "bg-teal-950 text-teal-400"
                        : "bg-teal-50 text-teal-600"
                      : theme === "dark"
                        ? "text-slate-200 hover:bg-slate-800 hover:text-teal-400"
                        : "text-slate-600 hover:bg-teal-50/50 hover:text-teal-600"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Language + Theme */}
              <div className="mt-3 grid grid-cols-2 gap-2 px-4">
                <button
                  onClick={toggleLanguage}
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                    theme === "dark"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  <Languages className="h-5 w-5" />

                  {isArabic ? "English" : "العربية"}
                </button>

                <button
                  onClick={toggleTheme}
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                    theme === "dark"
                      ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}

                  {theme === "dark"
                    ? t.common.lightMode
                    : t.common.darkMode}
                </button>
              </div>

              {/* Notifications */}
              <Link
                to={notificationPath}
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                className={`relative mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all ${
                  location.pathname === notificationPath
                    ? theme === "dark"
                      ? "bg-teal-950 text-teal-400"
                      : "bg-teal-100 text-teal-700"
                    : theme === "dark"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                <Bell className="h-5 w-5" />

                <span>{t.common.notifications}</span>

                {unreadCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Find Clinic */}
              <div className="px-4 pt-2">
                <Link
                  to="/clinics"
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-teal-500/25"
                >
                  <Phone className="h-4 w-4" />
                  {t.common.findClinic}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;