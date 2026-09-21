import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  MessageCircle,
  Search,
  ChevronDown,
  Users,
  CalendarCheck,
  Wallet,
  UserPlus,
  BarChart3,
  CalendarPlus,
  Activity,
  Settings as SettingsIcon,
  Building2,
  Pencil,
  Home as HomeIcon,
  ClipboardList,
  PackageSearch,
  Star,
  Menu,
  PanelRightClose,
  Languages,
  Sun,
  Moon,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

// ============================================
// Types
// ============================================

type ClinicInfo = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  subscription_plan: string | null;
  working_hours: string | null;
};

type DoctorProfile = {
  name: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  avatar_url: string | null;
};

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  appointment_type: string | null;
  patients?: { name: string } | null;
};

type RecentPatientRow = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  latest_status: string;
  latest_visit: string | null;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

// ============================================
// Tooth logo (لا يوجد أيقونة سن جاهزة في lucide)
// ============================================

const ToothIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2c-2.2 0-3.3 1.1-4.5 1.1S5 2 3.6 2C2 2 1 3.6 1 5.8c0 2.7.9 5 1.6 7.2.6 2 1.1 4.2 2 5.7.6 1 1.3 1.3 1.9 1.3.9 0 1.2-1 1.5-2.3.3-1.2.6-2.7 1.6-2.7s1.3 1.5 1.6 2.7c.3 1.3.6 2.3 1.5 2.3.6 0 1.3-.3 1.9-1.3.9-1.5 1.4-3.7 2-5.7C17.1 10.8 18 8.5 18 5.8 18 3.6 17 2 15.4 2c-1.4 0-2.3 1.1-3.4 1.1S12.9 2 12 2Z"
      fill="currentColor"
    />
  </svg>
);

const DoctorDashboard = () => {
  // ============================================
  // Language
  // ============================================

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  // وضعية الرؤية (فاتح/داكن) — بتتقرأ من نفس المفتاح اللي
  // صفحة الإعدادات (/doctor/settings) بتستخدمه، عشان التبديل من
  // هنا أو من هناك يفضل متزامن في كل الصفحات
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";
  const t = translations[language];
  const location = useLocation();

  useEffect(() => {
    const handleLanguageChange = () => {
      const saved = localStorage.getItem("dentalcare-language");
      setLanguage(saved === "en" ? "en" : "ar");
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

  // بيطبق كلاس "dark" على الصفحة كلها وبيحفظ الاختيار، وبيبلّغ
  // باقي الصفحات (زي الإعدادات) إن الثيم اتغير
  useEffect(() => {
    localStorage.setItem("dentalcare-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window.dispatchEvent(new Event("dentalcare-theme-change"));
  }, [theme]);

  // بيسمع لو حد غيّر الثيم من صفحة تانية (زي الإعدادات) عشان
  // الزرار هنا يفضل متزامن معاها
  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("dentalcare-theme");
      setTheme(savedTheme === "dark" ? "dark" : "light");
    };

    window.addEventListener("dentalcare-theme-change", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("dentalcare-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  const toggleLanguage = () => {
    const newLanguage: Language = language === "ar" ? "en" : "ar";
    setLanguage(newLanguage);
    localStorage.setItem("dentalcare-language", newLanguage);
    document.documentElement.lang = newLanguage;
    document.documentElement.dir = newLanguage === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(new Event("dentalcare-language-change"));
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  // ملاحظة: تبديل اللغة والوضع الداكن متاح دلوقتي من هنا (جنب
  // البحث في الهيدر) وكمان من صفحة الإعدادات المستقلة
  // (/doctor/settings) — الاتنين متزامنين مع بعض عن طريق نفس
  // مفاتيح localStorage والأحداث المخصصة.

  // ============================================
  // State
  // ============================================

  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);

  const [patientsCount, setPatientsCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0);
  const [paidThisMonth, setPaidThisMonth] = useState(0);
  const [paidToday, setPaidToday] = useState(0);
  const [totalTreatmentValue, setTotalTreatmentValue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  const [allAppointments, setAllAppointments] = useState<AppointmentRow[]>([]);
  const [recentPatients, setRecentPatients] = useState<RecentPatientRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const [selectedWeekDay, setSelectedWeekDay] = useState<string>("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // هل الـ Sidebar (الرئيسية / المرضى / المواعيد / ... إلخ) ظاهر؟
  // نفس فكرة داشبورد المريض بالظبط: مش أوفرلاي فوق الصفحة،
  // ده جزء ثابت على اليمين بيظهر أو يختفي بزرار في الهيدر.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // فتح/قفل لوحة "ملخص اليوم" جوه الأدوات السريعة
  const [todaySummaryOpen, setTodaySummaryOpen] = useState(false);

  // ============================================
  // Helpers — dates
  // ============================================

  const getEgyptToday = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const getEgyptNowTime = () =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

  // آخر 7 أيام تبدأ من اليوم (تُستخدم في شريط "مواعيد هذا الأسبوع")
  const weekDays = useMemo(() => {
    const today = new Date();
    const days: { iso: string; label: string; dayNumber: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const iso = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
      }).format(d);

      const label = d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        weekday: "short",
      });

      days.push({ iso, label, dayNumber: d.getDate() });
    }

    return days;
  }, [isArabic]);

  useEffect(() => {
    if (weekDays.length > 0 && !selectedWeekDay) {
      setSelectedWeekDay(weekDays[0].iso);
    }
  }, [weekDays, selectedWeekDay]);

  const todayLongLabel = new Date().toLocaleDateString(
    isArabic ? "ar-EG" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  const formatTime = (time: string) => {
    if (!time) return "-";
    const [h, m] = time.split(":");
    if (!h || !m) return time;
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);
    return d.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount: number) =>
    `${amount.toLocaleString(isArabic ? "ar-EG" : "en-US")} ${
      isArabic ? "ج.م" : "EGP"
    }`;

  const formatAppointmentType = (type: string | null) => {
    switch (type) {
      case "follow_up":
        return isArabic ? "متابعة" : "Follow-up";
      case "xray":
        return isArabic ? "أشعة" : "X-ray";
      default:
        return isArabic ? "كشف" : "Checkup";
    }
  };

  // ============================================
  // Load everything
  // ============================================

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          `name, email, phone, specialty, avatar_url, clinic_id,
           clinics ( id, name, address, phone, whatsapp, subscription_plan, working_hours )`
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading doctor:", profileError);
        setLoading(false);
        return;
      }

      setDoctor({
        name: profile.name || "",
        email: profile.email || user.email || "",
        phone: (profile as any).phone || null,
        specialty: (profile as any).specialty || null,
        avatar_url: (profile as any).avatar_url || null,
      });

      const clinicData: any = Array.isArray(profile.clinics)
        ? profile.clinics[0]
        : profile.clinics;

      if (clinicData) {
        setClinic({
          id: clinicData.id,
          name: clinicData.name,
          address: clinicData.address,
          phone: clinicData.phone,
          whatsapp: clinicData.whatsapp,
          subscription_plan: clinicData.subscription_plan,
          working_hours: clinicData.working_hours || null,
        });
      }

      const cId = profile.clinic_id;
      setClinicId(cId || null);

      if (!cId) {
        setLoading(false);
        return;
      }

      // ---------- Patients ----------

      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", cId);

      setPatientsCount(totalPatients || 0);

      const now = new Date();
      const monthStart = new Intl.DateTimeFormat("en-CA").format(
        new Date(now.getFullYear(), now.getMonth(), 1)
      );

      const { count: newPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", cId)
        .gte("created_at", monthStart);

      setNewPatientsThisMonth(newPatients || 0);

      // ---------- Appointments ----------

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `id, appointment_date, appointment_time, status, appointment_type,
             patients ( name )`
          )
          .eq("clinic_id", cId)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });

      if (appointmentsError) {
        console.error(appointmentsError);
      } else {
        const rows: AppointmentRow[] = (appointmentsData || []).map(
          (a: any) => ({
            id: a.id,
            appointment_date: a.appointment_date,
            appointment_time: a.appointment_time,
            status: a.status,
            appointment_type: a.appointment_type,
            patients: Array.isArray(a.patients)
              ? a.patients[0] || null
              : a.patients || null,
          })
        );

        setAllAppointments(rows);

        const today = getEgyptToday();

        const upcoming = rows.filter(
          (a) => a.appointment_date >= today && a.status !== "cancelled"
        );

        setUpcomingCount(upcoming.length);
      }

      // ---------- Recent patients ----------

      const { data: patientsData, error: patientsErr } = await supabase
        .from("patients")
        .select("id, name, phone, created_at")
        .eq("clinic_id", cId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (patientsErr) {
        console.error(patientsErr);
      } else if (patientsData) {
        const patientIds = patientsData.map((p) => p.id);

        const { data: lastAppointments } = await supabase
          .from("appointments")
          .select("patient_id, appointment_date, status")
          .in("patient_id", patientIds.length ? patientIds : [""])
          .order("appointment_date", { ascending: false });

        const lastByPatient = new Map<
          string,
          { date: string; status: string }
        >();

        (lastAppointments || []).forEach((a: any) => {
          if (!lastByPatient.has(a.patient_id)) {
            lastByPatient.set(a.patient_id, {
              date: a.appointment_date,
              status: a.status,
            });
          }
        });

        setRecentPatients(
          patientsData.map((p) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            created_at: p.created_at,
            latest_status: lastByPatient.get(p.id)?.status || "pending",
            latest_visit: lastByPatient.get(p.id)?.date || null,
          }))
        );
      }

      // ---------- Financials ----------

      const { data: medicalRecords } = await supabase
        .from("medical_records")
        .select("id, cost")
        .eq("clinic_id", cId);

      const treatmentValue = (medicalRecords || []).reduce(
        (sum: number, r: any) => sum + Number(r.cost || 0),
        0
      );

      setTotalTreatmentValue(treatmentValue);

      const { data: payments } = await supabase
        .from("payments")
        .select("id, amount, created_at")
        .eq("clinic_id", cId);

      const paid = (payments || []).reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      );

      setTotalPaid(paid);

      const paidThisMonthTotal = (payments || [])
        .filter((p: any) => p.created_at >= monthStart)
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

      setPaidThisMonth(paidThisMonthTotal);

      // مدفوعات اليوم بس (بنقارن أول 10 حروف من created_at
      // بتاريخ النهارده بتوقيت مصر)
      const todayDateStr = getEgyptToday();

      const paidTodayTotal = (payments || [])
        .filter((p: any) => (p.created_at || "").slice(0, 10) === todayDateStr)
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

      setPaidToday(paidTodayTotal);

      // ---------- Notifications ----------

      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("id, title, message, created_at, is_read")
        .eq("clinic_id", cId)
        .eq("recipient_type", "doctor")
        .order("created_at", { ascending: false })
        .limit(5);

      setNotifications(notificationsData || []);

      setLoading(false);
    };

    loadDashboard();
  }, []);

  // ============================================
  // Derived — today's appointments
  // ============================================

  const todayAppointments = useMemo(() => {
    const today = getEgyptToday();
    const nowTime = getEgyptNowTime();

    return allAppointments
      .filter((a) => a.appointment_date === today)
      .map((a) => ({
        ...a,
        checkedState:
          a.status === "cancelled"
            ? "cancelled"
            : a.appointment_time <= nowTime
            ? "attended"
            : "upcoming",
      }));
  }, [allAppointments]);

  // ============================================
  // Derived — عدد الكشوفات وعدد الإعادات (المتابعة) اليوم
  // (بنستبعد المواعيد الملغية من العد)
  // ============================================

  const todayCheckupsCount = useMemo(
    () =>
      todayAppointments.filter(
        (a) => a.status !== "cancelled" && a.appointment_type !== "follow_up"
      ).length,
    [todayAppointments]
  );

  const todayFollowUpCount = useMemo(
    () =>
      todayAppointments.filter(
        (a) => a.status !== "cancelled" && a.appointment_type === "follow_up"
      ).length,
    [todayAppointments]
  );

  // ============================================
  // Derived — this week's appointments (by selected day)
  // ============================================

  const weekAppointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    weekDays.forEach((d) => map.set(d.iso, []));

    allAppointments.forEach((a) => {
      if (map.has(a.appointment_date)) {
        map.get(a.appointment_date)!.push(a);
      }
    });

    return map;
  }, [allAppointments, weekDays]);

  const selectedDayAppointments =
    weekAppointmentsByDay.get(selectedWeekDay) || [];

  // ============================================
  // Derived — patient status donut (تقديري بناءً على آخر موعد لكل مريض)
  // ============================================

  const patientStatusBreakdown = useMemo(() => {
    const counts = { in_progress: 0, completed: 0, follow_up: 0, no_show: 0 };

    recentPatients.forEach((p) => {
      switch (p.latest_status) {
        case "completed":
          counts.completed += 1;
          break;
        case "confirmed":
          counts.follow_up += 1;
          break;
        case "cancelled":
          counts.no_show += 1;
          break;
        default:
          counts.in_progress += 1;
      }
    });

    return counts;
  }, [recentPatients]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300";
      case "confirmed":
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300";
      case "completed":
        return "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300";
      case "cancelled":
        return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return isArabic ? "قيد الانتظار" : "Pending";
      case "confirmed":
        return isArabic ? "مؤكد" : "Confirmed";
      case "completed":
        return isArabic ? "مكتمل" : "Completed";
      case "cancelled":
        return isArabic ? "ملغي" : "Cancelled";
      default:
        return status;
    }
  };

  // ============================================
  // Sidebar nav items (القائمة الجانبية الكاملة، مع بند "معلومات العيادة" الجديد بين الرئيسية والمرضى)
  // ============================================

  const navItems = [
    {
      icon: HomeIcon,
      label: isArabic ? "الرئيسية" : "Home",
      to: "/doctor/dashboard",
    },
    {
      icon: Building2,
      label: isArabic ? "معلومات العيادة" : "Clinic Info",
      to: "/doctor/clinic-profile",
    },
    { icon: Users, label: t.dashboard.patients, to: "/doctor/patients" },
    {
      icon: Calendar,
      label: t.dashboard.appointments,
      to: "/doctor/appointments",
    },
    {
      icon: ClipboardList,
      label: isArabic ? "السجلات الطبية" : "Medical Records",
      to: "/doctor/medical-records",
    },
    { icon: Wallet, label: t.dashboard.payments, to: "/doctor/payments" },
    {
      icon: BarChart3,
      label: isArabic ? "التقارير" : "Reports",
      to: "/doctor/reports",
    },
    {
      icon: PackageSearch,
      label: isArabic ? "المخزون" : "Inventory",
      to: "/doctor/inventory",
    },
    {
      icon: SettingsIcon,
      label: isArabic ? "الإعدادات" : "Settings",
      to: "/doctor/settings",
    },
  ];

  // ============================================
  // Quick tools (تم حذف "المخزون" و"الإعدادات"، وإضافة
  // "متابعة حالة مريض" و"ملخص اليوم")
  // ============================================

  type QuickTool = {
    icon: typeof BarChart3;
    label: string;
    to?: string;
    action?: "todaySummary";
  };

  const quickTools: QuickTool[] = [
    {
      icon: BarChart3,
      label: isArabic ? "التقارير" : "Reports",
      to: "/doctor/reports",
    },
    {
      icon: Search,
      label: isArabic ? "بحث عن مريض" : "Find patient",
      to: "/doctor/patients",
    },
    {
      icon: CalendarPlus,
      label: isArabic ? "إضافة موعد" : "Add appointment",
      to: "/doctor/appointments",
    },
    {
      icon: Activity,
      label: isArabic ? "متابعة حالة مريض" : "Track patient status",
      to: "/doctor/patients",
    },
    { icon: Wallet, label: t.dashboard.payments, to: "/doctor/payments" },
    {
      icon: CalendarCheck,
      label: isArabic ? "ملخص اليوم" : "Today's Summary",
      action: "todaySummary",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      {/* ====================================================
          Sidebar — بقى على اليمين بالظبط زي داشبورد المريض،
          وثابت في مكانه (مش أوفرلاي)، بيظهر/يختفي بزرار في
          الهيدر بدل ما يتفتح فوق الصفحة.
         ==================================================== */}
      <aside
        className={`fixed inset-y-0 right-0 z-30 hidden w-64 flex-col overflow-y-auto bg-[#0b1526] px-4 py-6 ${
          sidebarOpen ? "lg:flex" : "lg:hidden"
        }`}
      >
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
            <ToothIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight text-white">
              DentalCare
            </p>
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

        {/* ---------- أدوات سريعة + آخر الإشعارات ---------- */}
        <div className="mt-4 flex-1 space-y-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-white">
              <Star className="h-3.5 w-3.5 text-teal-400" />
              {isArabic ? "أدوات سريعة" : "Quick Tools"}
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {quickTools.map((tool) =>
                tool.action === "todaySummary" ? (
                  <button
                    key={tool.label}
                    type="button"
                    onClick={() => setTodaySummaryOpen((v) => !v)}
                    className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-center transition hover:bg-teal-500/20 ${
                      todaySummaryOpen ? "bg-teal-500/20" : "bg-white/5"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-teal-400">
                      <tool.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-slate-300">
                      {tool.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    key={tool.label}
                    to={tool.to!}
                    className="flex flex-col items-center gap-1 rounded-lg bg-white/5 py-2.5 text-center transition hover:bg-teal-500/20"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-teal-400">
                      <tool.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-slate-300">
                      {tool.label}
                    </span>
                  </Link>
                )
              )}
            </div>

            {/* لوحة ملخص اليوم: بتظهر لما تدوس على "ملخص اليوم" فوق */}
            {todaySummaryOpen && (
              <div className="mt-3 space-y-2 rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    {isArabic ? "عدد الكشوفات اليوم" : "Checkups today"}
                  </span>
                  <span className="font-bold text-white">
                    {todayCheckupsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    {isArabic ? "عدد الإعادات اليوم" : "Follow-ups today"}
                  </span>
                  <span className="font-bold text-white">
                    {todayFollowUpCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    {isArabic ? "إجمالي مدفوعات اليوم" : "Payments today"}
                  </span>
                  <span className="font-bold text-white">
                    {formatMoney(paidToday)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold text-white">
                {isArabic ? "آخر الإشعارات" : "Latest Notifications"}
              </h2>
              <Link
                to="/doctor/notifications"
                className="text-[10px] font-semibold text-teal-400 hover:text-teal-300"
              >
                {isArabic ? "عرض الكل" : "View all"}
              </Link>
            </div>

            {notifications.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-slate-500">
                {isArabic ? "لا توجد إشعارات جديدة." : "No new notifications."}
              </p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.is_read ? "bg-slate-600" : "bg-teal-400"
                      }`}
                    />
                    <div>
                      <p className="text-[11px] leading-snug text-slate-300">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {new Date(n.created_at).toLocaleString(
                          isArabic ? "ar-EG" : "en-US",
                          { hour: "numeric", minute: "2-digit" }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-4 text-white">
          <ToothIcon className="mb-2 h-7 w-7 opacity-90" />
          <p className="text-sm font-bold leading-snug">
            {isArabic ? "ابتسامتك... صحتنا" : "Your smile, our care"}
          </p>
        </div>
      </aside>

      {/* ==================== Main column ==================== */}
      <div className={sidebarOpen ? "lg:pr-64" : ""}>
        {/* ---------- Top bar ---------- */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:px-6">
          {/* يمين: زرار إظهار/إخفاء القائمة الجانبية + شعار المنصة */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:flex"
              aria-label={
                sidebarOpen
                  ? isArabic
                    ? "إخفاء القائمة"
                    : "Hide sidebar"
                  : isArabic
                  ? "إظهار القائمة"
                  : "Show sidebar"
              }
              title={
                sidebarOpen
                  ? isArabic
                    ? "إخفاء القائمة"
                    : "Hide sidebar"
                  : isArabic
                  ? "إظهار القائمة"
                  : "Show sidebar"
              }
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>

            <Link to="/doctor/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                <ToothIcon className="h-5 w-5" />
              </span>
              <span className="hidden text-sm font-bold leading-tight text-slate-800 dark:text-white sm:block">
                DentalCare
              </span>
            </Link>
          </div>

          {/* النص: خانة البحث + أزرار اللغة والوضع الداكن جنبها */}
          <div className="hidden flex-1 items-center justify-center gap-3 sm:flex">
            <div className="relative w-full max-w-md">
              <Search
                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                  isArabic ? "right-3" : "left-3"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  isArabic
                    ? "ابحث عن مريض، موعد، رقم هاتف، أو أي شيء..."
                    : "Search patient, appointment, phone, or anything..."
                }
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                  isArabic ? "pr-9 pl-3" : "pl-9 pr-3"
                }`}
              />
            </div>

            {/* اللغة + الوضع الداكن */}
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-all hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                title={isArabic ? "English" : "العربية"}
              >
                <Languages className="h-4 w-4" />
                <span>{isArabic ? "العربية" : "English"}</span>
              </button>

              <span className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

              <button
                type="button"
                onClick={toggleTheme}
                dir="ltr"
                aria-label={
                  theme === "dark"
                    ? isArabic
                      ? "الوضع الفاتح"
                      : "Light mode"
                    : isArabic
                    ? "الوضع الداكن"
                    : "Dark mode"
                }
                className="relative flex h-7 w-14 items-center rounded-full bg-teal-600 px-1.5 transition-colors"
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
          </div>

          {/* الشمال: الإشعارات + البروفايل */}
          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/doctor/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </Link>

            <Link
              to="/doctor/appointments"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
            >
              <Calendar className="h-5 w-5" />
            </Link>

            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
            >
              <MessageCircle className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="text-end">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {isArabic ? `د. ${doctor?.name}` : `Dr. ${doctor?.name}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {doctor?.specialty ||
                      (isArabic ? "طبيب أسنان عام" : "General dentist")}
                  </p>
                </div>

                {doctor?.avatar_url ? (
                  <img
                    src={doctor.avatar_url}
                    alt={doctor.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    {doctor?.name?.charAt(0) || "D"}
                  </span>
                )}

                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute end-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <Link
                    to="/doctor/clinic-profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    {isArabic ? "تعديل البيانات" : "Edit profile"}
                  </Link>

                  {/* اللغة/الوضع الداكن/تسجيل الخروج بقوا في صفحة
                      الإعدادات المستقلة (/doctor/settings) */}
                  <Link
                    to="/doctor/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    {isArabic ? "الإعدادات" : "Settings"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ---------- Content ---------- */}
        <main className="px-4 py-6 sm:px-6">
          <div className="space-y-6">
            {/* ====================================================
                Welcome banner
                - تم تغيير الخلفية للون فاتح بين اللبني والأزرق
                  (جراديانت sky/blue فاتح) بدل التيل الغامق.
                - النص بقى غامق (slate) عشان يبان واضح فوق الخلفية
                  الفاتحة، مع نسخة dark mode بتفضل غامقة زي الأول.
                - الصورة موجودة في public/doctor.jpeg
               ==================================================== */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8">
              <div className="absolute inset-0 z-0">
                <img
                  src="/doctor.jpeg"
                  alt={
                    isArabic ? "صورة ترحيبية" : "Welcome illustration"
                  }
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/40" />
              </div>

              <div className="relative z-10 max-w-md">
                <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
                  {isArabic
                    ? `مرحباً بك د. ${doctor?.name}`
                    : `Welcome, Dr. ${doctor?.name}`}{" "}
                  👋
                </h1>
                <p className="mt-2 text-white/90">
                  {isArabic
                    ? "نتمنى لك يومًا مليئًا بالنجاحات والابتسامات."
                    : "We wish you a day full of success and smiles."}
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm text-white/80">
                  <Calendar className="h-4 w-4" />
                  {todayLongLabel}
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <Wallet className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatMoney(paidThisMonth)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "إجمالي المدفوعات هذا الشهر"
                    : "Payments this month"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <Users className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {patientsCount}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? "عدد المرضى النشطين" : "Active patients"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <CalendarCheck className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {upcomingCount}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? "المواعيد القادمة" : "Upcoming appointments"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <UserPlus className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {newPatientsThisMonth}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "المرضى الجدد هذا الشهر"
                    : "New patients this month"}
                </p>
              </div>
            </div>

            {/* مواعيد اليوم (يسار) + مواعيد هذا الأسبوع (يمين) */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* مواعيد اليوم */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "مواعيد اليوم" : "Today's Appointments"}
                  </h2>
                  <Link
                    to="/doctor/appointments"
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                {todayAppointments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {isArabic
                      ? "لا توجد مواعيد اليوم."
                      : "No appointments today."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400">
                          <th className="pb-2 text-start font-medium">
                            {isArabic ? "الحالة" : "Status"}
                          </th>
                          <th className="pb-2 text-start font-medium">
                            {isArabic ? "نوع الزيارة" : "Type"}
                          </th>
                          <th className="pb-2 text-start font-medium">
                            {isArabic ? "اسم المريض" : "Patient"}
                          </th>
                          <th className="pb-2 text-start font-medium">
                            {isArabic ? "الوقت" : "Time"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayAppointments.map((a) => (
                          <tr
                            key={a.id}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="py-2.5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  a.checkedState === "attended"
                                    ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                                    : a.checkedState === "cancelled"
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                    : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                                }`}
                              >
                                {a.checkedState === "attended"
                                  ? isArabic
                                    ? "حاضر"
                                    : "Attended"
                                  : a.checkedState === "cancelled"
                                  ? isArabic
                                    ? "ملغي"
                                    : "Cancelled"
                                  : isArabic
                                  ? "قادم"
                                  : "Upcoming"}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-300">
                              {formatAppointmentType(a.appointment_type)}
                            </td>
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-white">
                              {a.patients?.name ||
                                (isArabic ? "مريض" : "Patient")}
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">
                              {formatTime(a.appointment_time)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* مواعيد هذا الأسبوع */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "مواعيد هذا الأسبوع"
                      : "This Week's Appointments"}
                  </h2>
                  <Link
                    to="/doctor/appointments"
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {weekDays.map((day) => (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedWeekDay(day.iso)}
                      className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        selectedWeekDay === day.iso
                          ? "bg-teal-600 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span>{day.label}</span>
                      <span className="mt-0.5">{day.dayNumber}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {selectedDayAppointments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">
                      {isArabic
                        ? "لا توجد مواعيد في هذا اليوم."
                        : "No appointments this day."}
                    </p>
                  ) : (
                    selectedDayAppointments.map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${getStatusStyle(
                          a.status
                        )}`}
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {a.patients?.name ||
                              (isArabic ? "مريض" : "Patient")}
                          </p>
                          <p className="text-xs opacity-80">
                            {formatAppointmentType(a.appointment_type)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold">
                          {formatTime(a.appointment_time)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* المدفوعات + المرضى الأخيرون + حالة المرضى */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* المدفوعات */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "المدفوعات" : "Payments"}
                  </h2>
                  <Link
                    to="/doctor/payments"
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                <div
                  className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#14b8a6 0% ${
                      totalTreatmentValue > 0
                        ? (totalPaid / totalTreatmentValue) * 100
                        : 0
                    }%, #f97316 0)`,
                  }}
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatMoney(paidThisMonth)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isArabic ? "هذا الشهر" : "this month"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                      {isArabic ? "مدفوع" : "Paid"}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatMoney(totalPaid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      {isArabic ? "متبقي" : "Remaining"}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatMoney(
                        Math.max(totalTreatmentValue - totalPaid, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* المرضى الأخيرون */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "المرضى الأخيرون" : "Recent Patients"}
                  </h2>
                  <Link
                    to="/doctor/patients"
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                {recentPatients.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    {isArabic ? "لا يوجد مرضى بعد." : "No patients yet."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPatients.map((p) => (
                      <Link
                        key={p.id}
                        to={`/doctor/patients/${p.id}`}
                        className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                            {p.name.charAt(0)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {p.phone || "-"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                            p.latest_status
                          )}`}
                        >
                          {formatStatusLabel(p.latest_status)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* حالة المرضى */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "حالة المرضى" : "Patient Status"}
                  </h2>
                  <Bell className="h-4 w-4 text-slate-300" />
                </div>

                <div
                  className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(
                      #14b8a6 0% 40%,
                      #3b82f6 40% 65%,
                      #f97316 65% 85%,
                      #ef4444 85% 100%
                    )`,
                  }}
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {patientsCount}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isArabic ? "إجمالي المرضى" : "total patients"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                    {isArabic ? "قيد العلاج" : "In progress"} (
                    {patientStatusBreakdown.in_progress})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    {isArabic ? "في المتابعة" : "Follow-up"} (
                    {patientStatusBreakdown.follow_up})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    {isArabic ? "مكتمل العلاج" : "Completed"} (
                    {patientStatusBreakdown.completed})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    {isArabic ? "لم يحضر" : "No show"} (
                    {patientStatusBreakdown.no_show})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;



