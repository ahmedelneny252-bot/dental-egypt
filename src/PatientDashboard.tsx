import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Building2,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Circle,
  FileText,
  Home as HomeIcon,
  Languages,
  Menu,
  MessageCircle,
  Moon,
  PanelRightClose,
  RefreshCcw,
  Search,
  Settings as SettingsIcon,
  Sun,
  Wallet,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

// ============================================
// Types
// ============================================

type PatientRow = {
  id: string;
  name: string;
};

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  appointment_type: string | null;
  clinics?: { name: string } | null;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

// ============================================
// شعار السن (نفس الشعار المستخدم في باقي الصفحات)
// ============================================

const ToothIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2c-2.2 0-3.3 1.1-4.5 1.1S5 2 3.6 2C2 2 1 3.6 1 5.8c0 2.7.9 5 1.6 7.2.6 2 1.1 4.2 2 5.7.6 1 1.3 1.3 1.9 1.3.9 0 1.2-1 1.5-2.3.3-1.2.6-2.7 1.6-2.7s1.3 1.5 1.6 2.7c.3 1.3.6 2.3 1.5 2.3.6 0 1.3-.3 1.9-1.3.9-1.5 1.4-3.7 2-5.7C17.1 10.8 18 8.5 18 5.8 18 3.6 17 2 15.4 2c-1.4 0-2.3 1.1-3.4 1.1S12.9 2 12 2Z"
      fill="currentColor"
    />
  </svg>
);

// ============================================
// خطوات خطة العلاج
// ------------------------------------------------
// ملاحظة مهمة: مفيش جدول جاهز في القاعدة بيمثل "خطة علاج"
// بخطوات، فالقائمة والنسبة دي شكل توضيحي (placeholder) بس
// عشان التصميم يبان زي الصورة تمامًا. لما يبقى عندك جدول
// حقيقي (زي treatment_plans / treatment_steps) هنا بالظبط
// المكان اللي تجيب بيانات منه بدل المصفوفة الثابتة تحت.
// ============================================

type TreatmentStepStatus = "done" | "current" | "upcoming";

type TreatmentStep = {
  id: string;
  label: string;
  helper: string;
  status: TreatmentStepStatus;
};

const PatientDashboard = () => {
  const location = useLocation();

  // ============================================
  // Language + Theme (نفس نمط باقي صفحات المريض/الدكتور)
  // ============================================

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("dentalcare-theme");
    return savedTheme === "dark" ? "dark" : "light";
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

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // ============================================
  // Language / Theme toggles — بتاعة الهيدر فوق
  // ============================================

  const toggleLanguage = () => {
    const next = language === "ar" ? "en" : "ar";
    localStorage.setItem("dentalcare-language", next);
    setLanguage(next);
    window.dispatchEvent(new Event("dentalcare-language-change"));
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem("dentalcare-theme", next);
    setTheme(next);
    window.dispatchEvent(new Event("dentalcare-theme-change"));
  };

  // ============================================
  // State
  // ============================================

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientRow | null>(null);

  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentRow[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [recentVisits, setRecentVisits] = useState<AppointmentRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const [totalPaid, setTotalPaid] = useState(0);
  const [totalTreatmentValue, setTotalTreatmentValue] = useState(0);
  const [monthlyPayments, setMonthlyPayments] = useState<{ label: string; total: number }[]>([]);

  const [searchValue, setSearchValue] = useState("");

  // هل الـ Sidebar (الرئيسية / مواعيدي / ملفي الطبي / ... إلخ) ظاهر؟
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ============================================
  // العيادة المختارة — كل حاجة في الداشبورد (المواعيد،
  // الحجز، الإشعارات، المدفوعات) بتبقى خاصة بالعيادة دي بس
  // ============================================

  const [clinicsList, setClinicsList] = useState<{ id: string; name: string }[]>([]);

  const [selectedClinicId, setSelectedClinicId] = useState<string>(() => {
    return localStorage.getItem("dentalcare-selected-clinic") || "";
  });

  const handleClinicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClinicId = e.target.value;
    setSelectedClinicId(newClinicId);
    localStorage.setItem("dentalcare-selected-clinic", newClinicId);
  };

  // ============================================
  // Helpers
  // ============================================

  const getEgyptToday = () =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());

  const formatMoney = (amount: number) =>
    `${amount.toLocaleString(isArabic ? "ar-EG" : "en-US")} ${isArabic ? "ج.م" : "EGP"}`;

  const formatDate = (date: string) => {
    if (!date) return "-";
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(isArabic ? "ar-EG" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (date: string) => {
    if (!date) return "-";
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(isArabic ? "ar-EG" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

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

  const formatAppointmentType = (type: string | null) => {
    switch (type) {
      case "follow_up":
        return isArabic ? "إعادة" : "Follow-up";
      case "xray":
        return isArabic ? "أشعة" : "X-ray";
      default:
        return isArabic ? "كشف" : "Checkup";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300";
      case "confirmed":
        return "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300";
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return isArabic ? "قيد الانتظار" : "Pending";
      case "confirmed":
        return isArabic ? "موعد مؤكد" : "Confirmed";
      case "completed":
        return isArabic ? "مكتمل" : "Completed";
      case "cancelled":
        return isArabic ? "ملغي" : "Cancelled";
      default:
        return status;
    }
  };

  // ============================================
  // Load clinics list (لملء قائمة اختيار العيادة فوق)
  // ============================================

  useEffect(() => {
    const loadClinicsList = async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Clinics list load error:", error);
        setClinicsList([]);
        return;
      }

      setClinicsList(data || []);
    };

    loadClinicsList();
  }, []);

  // ============================================
  // Load dashboard data
  // ============================================

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/patient/login";
        return;
      }

      // كل سجلات المريض عبر كل العيادات — بنستخدمها بس عشان
      // نحدد عيادة افتراضية لو المريض لسه ما اختارش عيادة
      const { data: allPatientRows, error: allPatientsError } = await supabase
        .from("patients")
        .select("id, name, clinic_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (allPatientsError) {
        console.error("Patient load error:", allPatientsError);
      }

      let activeClinicId = selectedClinicId;

      // لسه ما اختارش عيادة يدويًا؟ نفترض عيادة أول سجل مريض عنده كعيادة افتراضية
      if (!activeClinicId && allPatientRows && allPatientRows.length > 0) {
        activeClinicId = allPatientRows[0].clinic_id;
        setSelectedClinicId(activeClinicId);
        localStorage.setItem("dentalcare-selected-clinic", activeClinicId);
      }

      // مفيش عيادة متحددة خالص ومفيش سجلات قديمة — لازم يختار عيادة الأول
      if (!activeClinicId) {
        setPatient(null);
        setUpcomingAppointments([]);
        setUpcomingCount(0);
        setRecentVisits([]);
        setNotifications([]);
        setTotalPaid(0);
        setTotalTreatmentValue(0);
        setMonthlyPayments([]);
        setLoading(false);
        return;
      }

      // سجل المريض الخاص بالعيادة المختارة تحديدًا
      const matchingPatient =
        (allPatientRows || []).find((p) => p.clinic_id === activeClinicId) || null;

      // اختار عيادة لسه ما حجزش فيها قبل كده — نعرض حالة فاضية
      // (لحد ما يحجز أول موعد فيها من زرار "حجز موعد جديد")
      if (!matchingPatient) {
        setPatient(null);
        setUpcomingAppointments([]);
        setUpcomingCount(0);
        setRecentVisits([]);
        setNotifications([]);
        setTotalPaid(0);
        setTotalTreatmentValue(0);
        setMonthlyPayments([]);
        setLoading(false);
        return;
      }

      setPatient({ id: matchingPatient.id, name: matchingPatient.name });
      const patientIds = [matchingPatient.id];

      // ---------- Appointments ----------

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(
          `id, appointment_date, appointment_time, status, appointment_type,
           clinics ( name )`
        )
        .in("patient_id", patientIds)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (appointmentsError) {
        console.error("Appointments load error:", appointmentsError);
      } else {
        const rows: AppointmentRow[] = (appointmentsData || []).map((a: any) => ({
          id: a.id,
          appointment_date: a.appointment_date,
          appointment_time: a.appointment_time,
          status: a.status,
          appointment_type: a.appointment_type,
          clinics: Array.isArray(a.clinics) ? a.clinics[0] || null : a.clinics || null,
        }));

        const today = getEgyptToday();

        const upcoming = rows
          .filter(
            (a) =>
              a.appointment_date >= today &&
              (a.status === "pending" || a.status === "confirmed")
          )
          .sort((a, b) =>
            a.appointment_date === b.appointment_date
              ? a.appointment_time.localeCompare(b.appointment_time)
              : a.appointment_date.localeCompare(b.appointment_date)
          );

        setUpcomingAppointments(upcoming.slice(0, 3));
        setUpcomingCount(upcoming.length);

        const completedVisits = rows
          .filter((a) => a.status === "completed")
          .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));

        setRecentVisits(completedVisits.slice(0, 4));
      }

      // ---------- Payments ----------
      // ملحوظة: الاستعلام ده بيفترض إن جدول payments فيه عمود
      // patient_id (زي appointments بالظبط). لو الاسم مختلف
      // عندك، غيّر السطر ده بس.

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("id, amount, created_at")
        .in("patient_id", patientIds);

      if (paymentsError) {
        console.error("Payments load error:", paymentsError);
      } else {
        const payments = paymentsData || [];

        const paidTotal = payments.reduce(
          (sum: number, p: any) => sum + Number(p.amount || 0),
          0
        );
        setTotalPaid(paidTotal);

        // آخر 6 شهور لعمل الرسم البياني البسيط
        const now = new Date();
        const months: { key: string; label: string; total: number }[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
            month: "short",
          });
          months.push({ key, label, total: 0 });
        }

        payments.forEach((p: any) => {
          const createdKey = (p.created_at || "").slice(0, 7);
          const bucket = months.find((m) => m.key === createdKey);
          if (bucket) {
            bucket.total += Number(p.amount || 0);
          }
        });

        setMonthlyPayments(months.map((m) => ({ label: m.label, total: m.total })));
      }

      // ---------- Medical records (لحساب المبلغ المتبقي) ----------
      // نفس الملحوظة: بيفترض عمود patient_id في medical_records

      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select("id, cost")
        .in("patient_id", patientIds);

      if (recordsError) {
        console.error("Medical records load error:", recordsError);
      } else {
        const treatmentValue = (recordsData || []).reduce(
          (sum: number, r: any) => sum + Number(r.cost || 0),
          0
        );
        setTotalTreatmentValue(treatmentValue);
      }

      // ---------- Notifications ----------

      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("id, title, message, created_at, is_read")
        .eq("patient_id", matchingPatient.id)
        .eq("recipient_type", "patient")
        .order("created_at", { ascending: false })
        .limit(3);

      if (notificationsError) {
        console.error("Notifications load error:", notificationsError);
      } else {
        setNotifications(notificationsData || []);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [selectedClinicId]);

  // ============================================
  // Derived — المبلغ المتبقي
  // ============================================

  const remainingAmount = useMemo(
    () => Math.max(totalTreatmentValue - totalPaid, 0),
    [totalTreatmentValue, totalPaid]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // ============================================
  // خطة العلاج الحالية (Placeholder — شوف الملاحظة فوق)
  // ============================================

  const treatmentProgressPercent = 60;

  const treatmentSteps: TreatmentStep[] = [
    {
      id: "1",
      label: isArabic ? "الفحص والتشخيص" : "Examination & Diagnosis",
      helper: isArabic ? "تم الانتهاء منه" : "Completed",
      status: "done",
    },
    {
      id: "2",
      label: isArabic ? "تنظيف الأسنان" : "Teeth Cleaning",
      helper: isArabic ? "تم الانتهاء منه" : "Completed",
      status: "done",
    },
    {
      id: "3",
      label: isArabic ? "حشو الأسنان" : "Filling",
      helper: isArabic ? "في الجلسة الحالية" : "In current session",
      status: "current",
    },
    {
      id: "4",
      label: isArabic ? "تركيب تاج" : "Crown Placement",
      helper: isArabic ? "قادم" : "Upcoming",
      status: "upcoming",
    },
  ];

  // ============================================
  // القائمة الجانبية
  // ============================================

  const navItems = [
    { icon: HomeIcon, label: isArabic ? "الرئيسية" : "Home", to: "/patient/dashboard" },
    { icon: Calendar, label: isArabic ? "مواعيدي" : "My Appointments", to: "/patient/appointments" },
    { icon: FileText, label: isArabic ? "ملفي الطبي" : "Medical File", to: "/patient/medical-file" },
    { icon: Wallet, label: isArabic ? "المدفوعات" : "Payments", to: "/patient/payments" },
    { icon: BarChart3, label: isArabic ? "التقارير" : "Reports", to: "/patient/reports" },
    {
      icon: Bell,
      label: isArabic ? "الإشعارات" : "Notifications",
      to: "/patient/notifications",
      badge: unreadNotificationsCount,
    },
    { icon: SettingsIcon, label: isArabic ? "الإعدادات" : "Settings", to: "/patient/settings" },
  ];

  // ============================================
  // إجراءات سريعة
  // ============================================

  const quickActions = [
    {
      icon: CalendarPlus,
      label: isArabic ? "حجز موعد جديد" : "Book new appointment",
      to: selectedClinicId ? `/clinics/${selectedClinicId}/book` : "/clinics",
    },
    { icon: Activity, label: isArabic ? "متابعة حالتي" : "Track my status", to: "/patient/appointments" },
   // {
      //icon: RefreshCcw,
     // label: isArabic ? "حجز موعد متابعة" : "Book follow-up appointment",
     // to: selectedClinicId ? `/clinics/${selectedClinicId}/book?type=follow_up` : "/clinics",
   // },
    { icon: MessageCircle, label: isArabic ? "التواصل مع العيادة" : "Contact clinic", to: "/contact" },
  ];

  const ChevronIcon = isArabic ? ChevronLeft : ChevronRight;
  const maxMonthlyPayment = Math.max(1, ...monthlyPayments.map((m) => m.total));

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
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ==================== Sidebar (على يمين الشاشة) ==================== */}
      <aside
        className={`fixed inset-y-0 right-0 z-30 hidden w-64 flex-col overflow-y-auto border-l border-slate-100 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 ${
          sidebarOpen ? "lg:flex" : "lg:hidden"
        }`}
      >
        <Link to="/patient/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
            <ToothIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-bold leading-tight text-slate-800 dark:text-white">
              DentalCare
            </p>
            <p className="text-[11px] font-medium leading-tight text-blue-500">
              {isArabic ? "ابتسامتك، صحتنا" : "Your Smile, Our Care"}
            </p>
          </div>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </span>

                {"badge" in item && item.badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="relative overflow-hidden rounded-2xl bg-blue-50 p-4 text-center dark:bg-slate-800">
            <ToothIcon className="mx-auto mb-2 h-9 w-9 text-blue-500" />
            <p className="text-sm font-bold leading-snug text-slate-700 dark:text-slate-200">
              {isArabic ? "ابتسامتك.. هي هدفنا" : "Your smile is our goal"}
            </p>
          </div>
        </div>
      </aside>

      {/* ==================== Main column ==================== */}
      <div className={sidebarOpen ? "lg:pr-64" : ""}>
        {/* ---------- Top bar: بحث + لغة + وضع الرؤية + إشعارات ---------- */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">

          {/* زرار إخفاء/إظهار القائمة الجانبية بالكامل */}
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

          {/* البحث - في النص شوية بدل ما يكون لاصق على الطرف */}
          <div className="flex flex-1 justify-center">
            <div className="relative w-full max-w-[220px] sm:max-w-xs">
              <Search
                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                  isArabic ? "right-3.5" : "left-3.5"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={isArabic ? "ابحث..." : "Search..."}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                  isArabic ? "pr-9 pl-3" : "pl-9 pr-3"
                }`}
              />
            </div>
          </div>

          {/* باقي الأزرار على الطرف التاني */}
          <div className="flex items-center gap-2">

            {/* اللغة */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title={isArabic ? "English" : "العربية"}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{isArabic ? "EN" : "عربي"}</span>
            </button>

            {/* الوضع الليلي / النهاري */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-yellow-400 dark:hover:bg-slate-800"
              title={theme === "dark" ? (isArabic ? "الوضع النهاري" : "Light mode") : (isArabic ? "الوضع الليلي" : "Dark mode")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* الإشعارات */}
            <Link
              to="/patient/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={isArabic ? "الإشعارات" : "Notifications"}
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white dark:border-slate-900">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* ---------- Content ---------- */}
        <main className="px-4 py-6 sm:px-6">
          <div className="space-y-6">
            {/* اختيار العيادة - كل حاجة تحت بتبقى خاصة بالعيادة دي */}
            <div className="flex flex-col gap-3 rounded-2xl bg-blue-50/70 p-5 shadow-sm dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {isArabic ? "عيادتك" : "Your clinic"}
                </p>

                {selectedClinicId ? (
                  <p className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
                    {isArabic ? "عيادتك الحالية: " : "Current clinic: "}
                    {clinicsList.find((c) => c.id === selectedClinicId)?.name ||
                      (isArabic ? "جاري التحميل..." : "Loading...")}
                  </p>
                ) : (
                  <p className="mt-1 font-semibold text-amber-600 dark:text-amber-400">
                    {isArabic
                      ? "من فضلك اختر عيادتك عشان تقدر تحجز وتتابع مواعيدك"
                      : "Please choose your clinic so you can book and track your appointments"}
                  </p>
                )}
              </div>

              <select
                value={selectedClinicId}
                onChange={handleClinicChange}
                className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 dark:border-blue-900 dark:bg-slate-800 dark:text-white sm:w-64"
              >
                <option value="" disabled>
                  {isArabic ? "اختر عيادة" : "Choose a clinic"}
                </option>
                {clinicsList.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <Calendar className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {upcomingCount}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? "مواعيدي القادمة" : "Upcoming appointments"}
                </p>
                <Link
                  to="/patient/appointments"
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {isArabic ? "عرض المواعيد" : "View appointments"}
                  <ChevronIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <ToothIcon className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {treatmentProgressPercent}%
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? "خطة العلاج الحالية" : "Current treatment plan"}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${treatmentProgressPercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <Wallet className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatMoney(remainingAmount)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? "المبلغ المتبقي" : "Remaining balance"}
                </p>
                <Link
                  to="/patient/payments"
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {isArabic ? "عرض الفواتير" : "View invoices"}
                  <ChevronIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatMoney(totalPaid)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? "إجمالي المدفوعات" : "Total payments"}
                </p>
                <Link
                  to="/patient/payments"
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {isArabic ? "عرض المدفوعات" : "View payments"}
                  <ChevronIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* إجراءات سريعة + المواعيد القادمة + تقدم خطة العلاج/إشعارات
                ملحوظة: تم تبديل مكان "تقدم خطة العلاج" مع "إجراءات سريعة"
                بناءً على طلبك — إجراءات سريعة بقت في أول عمود، وتقدم خطة
                العلاج بقى في العمود التالت جنب الإشعارات. */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* إجراءات سريعة */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <h2 className="mb-4 font-bold text-slate-900 dark:text-white">
                  {isArabic ? "إجراءات سريعة" : "Quick actions"}
                </h2>

                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/20 dark:hover:text-blue-300"
                    >
                      <span className="flex items-center gap-2">
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </span>
                      <ChevronIcon className="h-4 w-4 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* المواعيد القادمة */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "المواعيد القادمة" : "Upcoming appointments"}
                  </h2>
                  <Link
                    to="/patient/appointments"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ChevronIcon className="h-3.5 w-3.5" />
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                {upcomingAppointments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {isArabic ? "لا توجد مواعيد قادمة." : "No upcoming appointments."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {a.clinics?.name || (isArabic ? "عيادة الأسنان" : "Dental Clinic")}
                            </p>
                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusStyle(
                                a.status
                              )}`}
                            >
                              {formatAppointmentType(a.appointment_type)}
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatShortDate(a.appointment_date)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatTime(a.appointment_time)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* تقدم خطة العلاج */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <h2 className="mb-1 font-bold text-slate-900 dark:text-white">
                  {isArabic ? "تقدم خطة العلاج" : "Treatment plan progress"}
                </h2>
                <p className="mb-4 text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {treatmentProgressPercent}%
                </p>
                <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${treatmentProgressPercent}%` }}
                  />
                </div>

                <ol className="relative space-y-6 border-e-2 border-slate-100 pe-5 dark:border-slate-800">
                  {treatmentSteps.map((step) => (
                    <li key={step.id} className="relative">
                      <span
                        className={`absolute top-0.5 -end-[27px] flex h-5 w-5 items-center justify-center rounded-full ${
                          step.status === "done"
                            ? "bg-blue-500 text-white"
                            : step.status === "current"
                            ? "border-2 border-blue-500 bg-white text-blue-500 dark:bg-slate-900"
                            : "border-2 border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900"
                        }`}
                      >
                        {step.status === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-2 w-2 fill-current" />
                        )}
                      </span>
                      <p
                        className={`text-sm font-semibold ${
                          step.status === "upcoming"
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{step.helper}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* آخر الزيارات + أحدث الإشعارات + ملخص المدفوعات */}
            <div className="grid gap-6 lg:grid-cols-6">
              {/* آخر الزيارات */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "آخر الزيارات" : "Recent visits"}
                  </h2>
                  <Link
                    to="/patient/appointments"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ChevronIcon className="h-3.5 w-3.5" />
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                {recentVisits.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {isArabic ? "لا توجد زيارات سابقة بعد." : "No past visits yet."}
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
                            {isArabic ? "العيادة" : "Clinic"}
                          </th>
                          <th className="pb-2 text-start font-medium">
                            {isArabic ? "نوع الزيارة" : "Visit type"}
                          </th>
                          <th className="pb-2 text-start font-medium">
                            {isArabic ? "التاريخ" : "Date"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVisits.map((visit) => (
                          <tr key={visit.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="py-2.5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                  visit.status
                                )}`}
                              >
                                {formatStatusLabel(visit.status)}
                              </span>
                            </td>
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-white">
                              {visit.clinics?.name || (isArabic ? "عيادة الأسنان" : "Dental Clinic")}
                            </td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-300">
                              {formatAppointmentType(visit.appointment_type)}
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">
                              {formatDate(visit.appointment_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ملخص المدفوعات - جنب آخر الزيارات */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "ملخص المدفوعات" : "Payments summary"}
                  </h2>
                  <Link
                    to="/patient/payments"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ChevronIcon className="h-3.5 w-3.5" />
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatMoney(totalPaid)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isArabic ? "إجمالي المدفوعات" : "Total payments"}
                    </p>
                  </div>
                </div>

                <div className="flex h-32 items-end justify-between gap-2">
                  {monthlyPayments.map((m, idx) => (
                    <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-24 w-full items-end justify-center">
                        <div
                          className="w-3/5 rounded-t-md bg-gradient-to-t from-blue-300 to-blue-500"
                          style={{
                            height: `${Math.max(
                              6,
                              (m.total / maxMonthlyPayment) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* أحدث الإشعارات */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 lg:col-span-1">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {isArabic ? "أحدث الإشعارات" : "Latest notifications"}
                  </h2>
                  <Link
                    to="/patient/notifications"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ChevronIcon className="h-3.5 w-3.5" />
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    {isArabic ? "لا توجد إشعارات جديدة." : "No new notifications."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.is_read ? "bg-slate-300 dark:bg-slate-600" : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm leading-snug text-slate-600 dark:text-slate-300">
                            {n.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;