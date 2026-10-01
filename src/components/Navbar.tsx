import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Languages,
  LogOut,
  Stethoscope,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

// نوع الحساب الحالي: زائر لسه مسجلش / مريض / دكتور
type UserRole = "guest" | "patient" | "doctor";

// ============================================================
// مسارات الداشبورد بتاعت الدكتور عندها هيدر وSidebar خاص بيها
// فمش محتاجة الـ Navbar العام يظهر فيها خالص.
// ============================================================
const DOCTOR_STANDALONE_LAYOUT_PATHS = ["/doctor/register", "/doctor/login"];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState<UserRole>("guest");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const location = useLocation();
  const navigate = useNavigate();

  const isArabic = language === "ar";
  const t = translations[language];

  const isLoggedIn = role !== "guest";
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";

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

    window.dispatchEvent(new Event("dentalcare-theme-change"));
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadUnreadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUnreadCount(0);
        setRole("guest");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && profile?.clinic_id) {
        setRole("doctor");

        const { count, error: notificationError } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", profile.clinic_id)
          .eq("is_read", false);

        if (notificationError) {
          console.error("Clinic notification count error:", notificationError);
          setUnreadCount(0);
          return;
        }

        setUnreadCount(count || 0);
        return;
      }

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (patientError || !patient) {
        setRole("guest");
        setUnreadCount(0);
        return;
      }

      setRole("patient");

      const { count, error: notificationError } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patient.id)
        .eq("is_read", false);

      if (notificationError) {
        console.error("Patient notification count error:", notificationError);
        setUnreadCount(0);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Load notifications error:", error);
      setUnreadCount(0);
      setRole("guest");
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

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setUnreadCount(0);
    setRole("guest");
    setIsMobileMenuOpen(false);
    navigate("/");
  };

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
    { to: "/", label: t.common.home },
    { to: "/clinics", label: t.common.clinics },
    { to: "/about", label: t.common.about },
    { to: "/contact", label: t.common.contact },
  ];

  const linkClasses = (path: string) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      location.pathname === path
        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        : "text-slate-600 hover:bg-blue-50/60 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
    }`;

  const isDoctorDashboardArea =
    location.pathname.startsWith("/doctor/") &&
    !DOCTOR_STANDALONE_LAYOUT_PATHS.includes(location.pathname);

  // صفحة تفاصيل العيادة: /clinics/<id> (من غير /book)
  // الصفحة دي بتعرض بانر كامل وسهم رجوع خاص بيها، فمش محتاجة الـ Navbar
  const isClinicDetailPage = /^\/clinics\/[^/]+\/?$/.test(location.pathname);

  if (isDoctorDashboardArea || isClinicDetailPage) {
    return null;
  }

  return (
    <nav
      dir={isArabic ? "rtl" : "ltr"}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        theme === "dark"
          ? isScrolled
            ? "border-b border-slate-800 bg-slate-950/95 shadow-sm backdrop-blur-md"
            : "bg-slate-950/90 backdrop-blur-sm"
          : isScrolled
            ? "border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur-md"
            : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-20">

          {/* ============ روابط التنقل ============ */}

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={linkClasses(link.to)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ============ اللغة + الثيم ============ */}

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700 lg:flex">
            <button
              onClick={toggleLanguage}
              type="button"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-all hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              title={isArabic ? t.common.english : t.common.arabic}
            >
              <Languages className="h-4 w-4" />
              <span>{isArabic ? "العربية" : "English"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <span className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            <button
              onClick={toggleTheme}
              type="button"
              dir="ltr"
              aria-label={
                theme === "dark"
                  ? t.common.lightMode
                  : t.common.darkMode
              }
              className="relative flex h-7 w-14 items-center rounded-full bg-blue-600 px-1.5 transition-colors"
            >
              <Sun className="h-3.5 w-3.5 shrink-0 text-white/80" />

              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  theme === "dark"
                    ? "translate-x-[26px]"
                    : "translate-x-[2px]"
                }`}
              />

              <Moon className="mr-0 ml-auto h-3.5 w-3.5 shrink-0 text-white/80" />
            </button>
          </div>

          {/* ============ اللوجو ============ */}

          <Link to="/" className="group flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <h1
                className={`text-lg font-bold leading-tight ${
                  theme === "dark"
                    ? "text-white"
                    : "text-slate-800"
                }`}
              >
                {isArabic ? "دنتال كير" : "DentalCare"}
              </h1>

              <p className="text-xs font-medium text-blue-500">
                DentalCare Egypt
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:shadow-blue-500/40">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
          </Link>

          {/* ============ Mobile Menu Button ============ */}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            type="button"
            className={`rounded-lg p-2 transition-colors lg:hidden ${
              theme === "dark"
                ? "text-slate-200 hover:bg-slate-800"
                : "text-slate-600 hover:bg-blue-50"
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

        {/* ============ Mobile Menu ============ */}

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen
              ? "max-h-[800px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div
            className={`rounded-b-2xl border-t py-4 ${
              theme === "dark"
                ? "border-slate-800 bg-slate-950/95"
                : "border-blue-100 bg-white/95"
            }`}
          >
            <div className="flex flex-col gap-1">

              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-slate-600 hover:bg-blue-50/60 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isDoctor && (
                <Link
                  to="/doctor/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium text-slate-600 hover:bg-blue-50/60 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    {isArabic ? "لوحة التحكم" : "Dashboard"}
                  </span>
                </Link>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 px-4">
                <button
                  onClick={toggleLanguage}
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all ${
                    theme === "dark"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
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
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
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

              {isPatient && (
                <Link
                  to="/patient/payments"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <CreditCard className="h-5 w-5" />
                  {isArabic ? "المدفوعات" : "Payments"}
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to={notificationPath}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Bell className="h-5 w-5" />

                  {t.common.notifications}

                  {unreadCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  type="button"
                  className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-5 w-5" />
                  {isArabic ? "تسجيل الخروج" : "Logout"}
                </button>
              )}

              <div className="px-4 pt-2">
                <Link
                  to="/clinics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25"
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

