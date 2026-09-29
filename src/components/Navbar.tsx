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
  LogIn,
  UserPlus,
  Stethoscope,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

// نوع الحساب الحالي: زائر لسه مسجلش / مريض / دكتور
type UserRole = "guest" | "patient" | "doctor";

// ============================================================
// الصفحات اللي عايزين نخفي فيها بس أزرار الدخول/التسجيل الخاصة
// بالمريض ("إنشاء حساب"، "تسجيل الدخول"، "للأطباء") لأنها مش
// منطقية هناك (المستخدم أصلًا بيعمل حساب دكتور/مريض في نفس الصفحة).
// باقي الـ Navbar (روابط التنقل، اللغة، الوضع الداكن، اللوجو)
// بيفضل ظاهر عادي.
// ============================================================
const HIDDEN_AUTH_BUTTONS_PATHS = [
  "/doctor/register",
  "/doctor/login",
  "/patient/register",
  "/patient/login",
];

// ============================================================
// مسارات الداشبورد بتاعت الدكتور عندها هيدر وSidebar خاص بيها
// (فيها تسجيل خروج/لغة/وضع داكن جواها دلوقتي في صفحة
// /doctor/settings)، فمش محتاجة الـ Navbar العام يظهر فيها
// خالص. صفحات تسجيل الدخول/إنشاء الحساب لسه بتستخدم الـ
// Navbar العام عشان كده مستثناة من هنا.
// ============================================================
const DOCTOR_STANDALONE_LAYOUT_PATHS = ["/doctor/register", "/doctor/login"];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState<UserRole>("guest");

  // ✅ فتح/قفل قائمة "تسجيل الدخول / إنشاء حساب" المنسدلة (ديسكتوب)
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);

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

  // ✅ قفل قائمة تسجيل الدخول/إنشاء الحساب المنسدلة لو المستخدم ضغط برّه
  useEffect(() => {
    if (!isAuthMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-auth-menu]")) {
        setIsAuthMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAuthMenuOpen]);

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
    setLanguage((currentLanguage) => (currentLanguage === "ar" ? "en" : "ar"));
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const notificationPath = isDoctor ? "/doctor/notifications" : "/patient/notifications";

  // مسار تسجيل المريض - عدّل هنا لو اسم المسار مختلف عندك
  const patientRegisterPath = "/patient/register";

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

  // ============================================================
  // بدل ما نخفي الـ Navbar كله، بنحسب فلاج بيتحقق منه بس عند
  // رندر قسم أزرار "إنشاء حساب / تسجيل الدخول" تحت.
  // ============================================================
  const hideAuthButtons = HIDDEN_AUTH_BUTTONS_PATHS.includes(location.pathname);

  // ============================================================
  // الداشبورد بتاعت الدكتور (كل مسارات /doctor/* ما عدا صفحات
  // تسجيل الدخول/إنشاء الحساب) عندها هيدر وSidebar خاص بيها،
  // فبنخفي الـ Navbar العام تمامًا هناك بدل ما يترندر فوقها.
  // ============================================================
  const isDoctorDashboardArea =
    location.pathname.startsWith("/doctor/") &&
    !DOCTOR_STANDALONE_LAYOUT_PATHS.includes(location.pathname);

  if (isDoctorDashboardArea) {
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

          {/* ============ 1) أقصى اليمين: تسجيل الدخول / إنشاء حساب ============ */}

          <div className="hidden items-center gap-2 lg:flex">
            {!hideAuthButtons && (
              isLoggedIn ? (
                <>
                  {/* Doctor Dashboard */}
                  {isDoctor && (
                    <Link to="/doctor/dashboard" className={linkClasses("/doctor/dashboard")}>
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {isArabic ? "لوحة التحكم" : "Dashboard"}
                      </span>
                    </Link>
                  )}

                  {/* Patient Payments */}
                  {isPatient && (
                    <Link to="/patient/payments" className={linkClasses("/patient/payments")}>
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {isArabic ? "المدفوعات" : "Payments"}
                      </span>
                    </Link>
                  )}

                  {/* Notifications */}
                  <Link
                    to={notificationPath}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    aria-label={t.common.notifications}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-xs font-bold text-white dark:border-slate-950">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    {isArabic ? "تسجيل الخروج" : "Logout"}
                  </button>
                </>
              ) : (
                // ✅ زرار "تسجيل الدخول" وجواه Dropdown فيه:
                // 1) تسجيل الدخول  2) إنشاء حساب كمريض
                <div className="relative" data-auth-menu>
                  <button
                    type="button"
                    onClick={() => setIsAuthMenuOpen((prev) => !prev)}
                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700"
                  >
                    <LogIn className="h-4 w-4" />
                    {isArabic ? "تسجيل الدخول" : "Login"}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        isAuthMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isAuthMenuOpen && (
                    <div
                      className={`absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900 ${
                        isArabic ? "right-0" : "left-0"
                      }`}
                    >
                      <Link
                        to="/patient/login"
                        onClick={() => setIsAuthMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        <LogIn className="h-4 w-4" />
                        {isArabic ? "تسجيل الدخول" : "Log in"}
                      </Link>
                      <Link
                        to={patientRegisterPath}
                        onClick={() => setIsAuthMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        <UserPlus className="h-4 w-4" />
                        {isArabic ? "إنشاء حساب كمريض" : "Sign up as patient"}
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* ============ 2) روابط التنقل - النص ============ */}

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClasses(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ============ 3) اللغة + الثيم - شكل موحّد زي الصورة ============ */}

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

            {/* مفتاح تبديل واحد بين الوضع الفاتح والداكن */}
            <button
              onClick={toggleTheme}
              type="button"
              dir="ltr"
              aria-label={theme === "dark" ? t.common.lightMode : t.common.darkMode}
              className="relative flex h-7 w-14 items-center rounded-full bg-blue-600 px-1.5 transition-colors"
            >
              <Sun className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  theme === "dark" ? "translate-x-[26px]" : "translate-x-[2px]"
                }`}
              />
              <Moon className="mr-0 ml-auto h-3.5 w-3.5 shrink-0 text-white/80" />
            </button>
          </div>

          {/* ============ 4) أقصى الشمال: اللوجو ============ */}

          <Link to="/" className="group flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <h1
                className={`text-lg font-bold leading-tight ${
                  theme === "dark" ? "text-white" : "text-slate-800"
                }`}
              >
                {isArabic ? "دنتال كير" : "DentalCare"}
              </h1>
              <p className="text-xs font-medium text-blue-500">DentalCare Egypt</p>
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
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* ============ Mobile Menu ============ */}

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            className={`rounded-b-2xl border-t py-4 ${
              theme === "dark" ? "border-slate-800 bg-slate-950/95" : "border-blue-100 bg-white/95"
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
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  {theme === "dark" ? t.common.lightMode : t.common.darkMode}
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

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  type="button"
                  className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-5 w-5" />
                  {isArabic ? "تسجيل الخروج" : "Logout"}
                </button>
              ) : (
                !hideAuthButtons && (
                  // ✅ في الموبايل بنعرض الزرارين واضحين تحت بعض:
                  // "تسجيل الدخول" و "إنشاء حساب كمريض"
                  <div className="mx-4 mt-2 flex flex-col gap-2">
                    <Link
                      to="/patient/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-600 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <LogIn className="h-5 w-5" />
                      {isArabic ? "تسجيل الدخول" : "Log in"}
                    </Link>
                    <Link
                      to={patientRegisterPath}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-md shadow-blue-600/25"
                    >
                      <UserPlus className="h-5 w-5" />
                      {isArabic ? "إنشاء حساب كمريض" : "Sign Up as Patient"}
                    </Link>
                  </div>
                )
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