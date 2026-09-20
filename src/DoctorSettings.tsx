import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  Users,
  Wallet,
  BarChart3,
  SettingsIcon as SettingsIconAlias,
  Settings as SettingsIcon,
  Building2,
  LogOut,
  Home as HomeIcon,
  ClipboardList,
  PackageSearch,
  Languages,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

// ============================================
// Tooth logo (نفس الشعار المستخدم في الداشبورد)
// ============================================

const ToothIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2c-2.2 0-3.3 1.1-4.5 1.1S5 2 3.6 2C2 2 1 3.6 1 5.8c0 2.7.9 5 1.6 7.2.6 2 1.1 4.2 2 5.7.6 1 1.3 1.3 1.9 1.3.9 0 1.2-1 1.5-2.3.3-1.2.6-2.7 1.6-2.7s1.3 1.5 1.6 2.7c.3 1.3.6 2.3 1.5 2.3.6 0 1.3-.3 1.9-1.3.9-1.5 1.4-3.7 2-5.7C17.1 10.8 18 8.5 18 5.8 18 3.6 17 2 15.4 2c-1.4 0-2.3 1.1-3.4 1.1S12.9 2 12 2Z"
      fill="currentColor"
    />
  </svg>
);

type DoctorProfile = {
  name: string;
  email: string;
  avatar_url: string | null;
};

const DoctorSettings = () => {
  const location = useLocation();

  // ============================================
  // Language — نفس منطق باقي الصفحات (localStorage + event)
  // ============================================

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

    window.addEventListener("dentalcare-language-change", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener("dentalcare-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  const setAppLanguage = (next: Language) => {
    localStorage.setItem("dentalcare-language", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(new Event("dentalcare-language-change"));
    setLanguage(next);
  };

  // ============================================
  // Theme — نفس منطق الـ Navbar
  // ============================================

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("dentalcare-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("dentalcare-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.dispatchEvent(new Event("dentalcare-theme-change"));
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  // ============================================
  // Doctor profile (بس عشان نعرض الاسم/الإيميل فوق)
  // ============================================

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctor = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      setDoctor({
        name: profile?.name || "",
        email: profile?.email || user.email || "",
        avatar_url: (profile as any)?.avatar_url || null,
      });

      setLoading(false);
    };

    loadDoctor();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/doctor/login";
  };

  // ============================================
  // Sidebar nav (نفس عناصر الداشبورد، مع تفعيل "الإعدادات")
  // ============================================

  const navItems = [
    { icon: HomeIcon, label: isArabic ? "الرئيسية" : "Home", to: "/doctor/dashboard" },
    { icon: Building2, label: isArabic ? "معلومات العيادة" : "Clinic Info", to: "/doctor/clinic-profile" },
    { icon: Users, label: t.dashboard.patients, to: "/doctor/patients" },
    { icon: Calendar, label: t.dashboard.appointments, to: "/doctor/appointments" },
    { icon: ClipboardList, label: isArabic ? "السجلات الطبية" : "Medical Records", to: "/doctor/medical-records" },
    { icon: Wallet, label: t.dashboard.payments, to: "/doctor/payments" },
    { icon: BarChart3, label: isArabic ? "التقارير" : "Reports", to: "/doctor/reports" },
    { icon: PackageSearch, label: isArabic ? "المخزون" : "Inventory", to: "/doctor/inventory" },
    { icon: SettingsIcon, label: isArabic ? "الإعدادات" : "Settings", to: "/doctor/settings" },
  ];

  const BackChevron = isArabic ? ChevronLeft : ChevronRight;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ==================== Sidebar ==================== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto bg-[#0b1526] px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
            <ToothIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight text-white">DentalCare</p>
            <p className="text-[11px] leading-tight text-slate-400">
              {isArabic ? "نظام إدارة العيادة" : "Clinic System"}
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                location.pathname === item.to
                  ? "bg-teal-600 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-4 text-white">
          <ToothIcon className="mb-2 h-7 w-7 opacity-90" />
          <p className="text-sm font-bold leading-snug">
            {isArabic ? "ابتسامتك... صحتنا" : "Your smile, our care"}
          </p>
        </div>
      </aside>

      {/* ==================== Main column ==================== */}
      <div className="lg:pl-64">
        {/* ---------- Top bar ---------- */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <Link
            to="/doctor/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <BackChevron className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {isArabic ? "الإعدادات" : "Settings"}
            </h1>
            <p className="text-xs text-slate-400">
              {isArabic ? "اللغة، المظهر، والحساب" : "Language, appearance, and account"}
            </p>
          </div>

          {!loading && doctor && (
            <div className="ms-auto flex items-center gap-2">
              {doctor.avatar_url ? (
                <img
                  src={doctor.avatar_url}
                  alt={doctor.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  {doctor.name?.charAt(0) || "D"}
                </span>
              )}
              <div className="hidden text-end sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {isArabic ? `د. ${doctor.name}` : `Dr. ${doctor.name}`}
                </p>
                <p className="text-xs text-slate-400">{doctor.email}</p>
              </div>
            </div>
          )}
        </header>

        {/* ---------- Content ---------- */}
        <main className="px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* ---------- اللغة ---------- */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Languages className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "اللغة" : "Language"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isArabic ? "لغة عرض النظام بالكامل" : "Display language across the app"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppLanguage("ar")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    language === "ar"
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  العربية
                </button>

                <button
                  type="button"
                  onClick={() => setAppLanguage("en")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    language === "en"
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* ---------- المظهر ---------- */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "المظهر" : "Appearance"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isArabic ? "الوضع الفاتح أو الداكن" : "Light or dark mode"}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                type="button"
                dir="ltr"
                aria-label={theme === "dark" ? t.common.lightMode : t.common.darkMode}
                className="relative flex h-9 w-16 items-center rounded-full bg-blue-600 px-1.5 transition-colors"
              >
                <Sun className="h-4 w-4 shrink-0 text-white/80" />
                <span
                  className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    theme === "dark" ? "translate-x-[30px]" : "translate-x-[2px]"
                  }`}
                />
                <Moon className="mr-0 ml-auto h-4 w-4 shrink-0 text-white/80" />
              </button>
            </div>

            {/* ---------- الحساب ---------- */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "الحساب" : "Account"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isArabic ? "بيانات الحساب وتسجيل الخروج" : "Account details and logout"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/doctor/clinic-profile"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                  {isArabic ? "تعديل بيانات العيادة" : "Edit clinic profile"}
                </Link>

                <button
                  onClick={handleLogout}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  {isArabic ? "تسجيل الخروج" : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorSettings;