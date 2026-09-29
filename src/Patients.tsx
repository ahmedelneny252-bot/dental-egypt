import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Languages,
  Moon,
  RefreshCcw,
  Search,
  Sun,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
  case_status: string | null;
};

type LatestAppointmentInfo = {
  status: string;
  appointment_date: string;
};

type PatientStatusCategory =
  | "completed"
  | "upcoming"
  | "in_treatment"
  | "needs_followup"
  | "no_data";

type PatientWithStatus = Patient & {
  latestAppointment: LatestAppointmentInfo | null;
  upcomingCount: number;
  statusCategory: PatientStatusCategory;
  totalTreatment: number;
  totalPaid: number;
  remaining: number;
};

type ClinicHeader = {
  name: string;
  logo_url: string | null;
};

const FREE_PATIENT_LIMIT = 20;
const PAGE_SIZE = 6;

type StatusFilter = "all" | PatientStatusCategory;
type PeriodFilter = "all" | "week" | "month";

const Patients = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<PatientWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(
    null
  );

  const [clinicId, setClinicId] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [clinicHeader, setClinicHeader] = useState<ClinicHeader | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [page, setPage] = useState(1);

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isArabic = language === "ar";
  const t = translations[language];

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");

      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark")
      );
    };

    window.addEventListener(
      "dentalcare-theme-change",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "dentalcare-theme-change",
        handleThemeChange
      );
    };
  }, []);

  const toggleLanguage = () => {
    const nextLanguage: Language =
      language === "ar" ? "en" : "ar";

    localStorage.setItem(
      "dentalcare-language",
      nextLanguage
    );

    setLanguage(nextLanguage);

    window.dispatchEvent(
      new Event("dentalcare-language-change")
    );
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDarkMode =
      !root.classList.contains("dark");

    root.classList.toggle("dark", nextDarkMode);

    localStorage.setItem(
      "dentalcare-theme",
      nextDarkMode ? "dark" : "light"
    );

    setIsDarkMode(nextDarkMode);

    window.dispatchEvent(
      new Event("dentalcare-theme-change")
    );
  };

  const loadNotificationsCount = async (
    clinicIdValue: string
  ) => {
    const { count, error: notificationsError } =
      await supabase
        .from("notifications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicIdValue)
        .eq("recipient_type", "doctor")
        .eq("is_read", false);

    if (notificationsError) {
      console.error(notificationsError);
      return;
    }

    setUnreadNotifications(count || 0);
  };

  const loadPatients = async (clinicIdValue: string) => {
    const { data, error: patientsError } =
      await supabase
        .from("patients")
        .select(
          "id, name, phone, age, gender, address, medical_notes, created_at, case_status"
        )
        .eq("clinic_id", clinicIdValue)
        .order("created_at", { ascending: false });

    if (patientsError) {
      console.error(patientsError);
      setError(patientsError.message);
      setLoading(false);
      return;
    }

    const patientRows = data || [];
    const patientIds = patientRows.map((p) => p.id);

    const {
      data: appointmentsData,
      error: appointmentsError,
    } = await supabase
      .from("appointments")
      .select("patient_id, appointment_date, status")
      .eq("clinic_id", clinicIdValue)
      .in(
        "patient_id",
        patientIds.length ? patientIds : [""]
      )
      .order("appointment_date", { ascending: false });

    if (appointmentsError) {
      console.error(appointmentsError);
    }

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
    }).format(new Date());

    const latestByPatient = new Map<
      string,
      LatestAppointmentInfo
    >();

    const upcomingCountByPatient = new Map<
      string,
      number
    >();

    (appointmentsData || []).forEach((a: any) => {
      if (!latestByPatient.has(a.patient_id)) {
        latestByPatient.set(a.patient_id, {
          status: a.status,
          appointment_date: a.appointment_date,
        });
      }

      if (
        a.appointment_date >= today &&
        a.status !== "cancelled"
      ) {
        upcomingCountByPatient.set(
          a.patient_id,
          (upcomingCountByPatient.get(a.patient_id) || 0) + 1
        );
      }
    });

    const {
      data: recordsData,
      error: recordsError,
    } = await supabase
      .from("medical_records")
      .select("patient_id, cost")
      .eq("clinic_id", clinicIdValue)
      .in(
        "patient_id",
        patientIds.length ? patientIds : [""]
      );

    if (recordsError) {
      console.error(recordsError);
    }

    const {
      data: paymentsData,
      error: paymentsError,
    } = await supabase
      .from("payments")
      .select("patient_id, amount")
      .eq("clinic_id", clinicIdValue)
      .in(
        "patient_id",
        patientIds.length ? patientIds : [""]
      );

    if (paymentsError) {
      console.error(paymentsError);
    }

    const treatmentByPatient = new Map<
      string,
      number
    >();

    (recordsData || []).forEach((r: any) => {
      treatmentByPatient.set(
        r.patient_id,
        (treatmentByPatient.get(r.patient_id) || 0) +
          Number(r.cost || 0)
      );
    });

    const paidByPatient = new Map<string, number>();

    (paymentsData || []).forEach((p: any) => {
      paidByPatient.set(
        p.patient_id,
        (paidByPatient.get(p.patient_id) || 0) +
          Number(p.amount || 0)
      );
    });

    const patientsWithStatus: PatientWithStatus[] =
      patientRows.map((p) => {
        const latestAppointment =
          latestByPatient.get(p.id) || null;

        const upcomingCount =
          p.case_status === "completed"
            ? 0
            : upcomingCountByPatient.get(p.id) || 0;

        let statusCategory: PatientStatusCategory;

        if (p.case_status === "completed") {
          statusCategory = "completed";
        } else if (!latestAppointment) {
          statusCategory = "no_data";
        } else if (
          latestAppointment.status === "cancelled"
        ) {
          statusCategory = "needs_followup";
        } else if (upcomingCount > 0) {
          statusCategory = "upcoming";
        } else if (
          latestAppointment.status === "completed"
        ) {
          statusCategory = "completed";
        } else {
          statusCategory = "in_treatment";
        }

        const totalTreatment =
          treatmentByPatient.get(p.id) || 0;

        const totalPaid =
          paidByPatient.get(p.id) || 0;

        const remaining = Math.max(
          totalTreatment - totalPaid,
          0
        );

        return {
          ...p,
          latestAppointment,
          upcomingCount,
          statusCategory,
          totalTreatment,
          totalPaid,
          remaining,
        };
      });

    setPatients(patientsWithStatus);
    setLoading(false);
  };

  const getClinic = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/doctor/login";
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);

      setError(
        isArabic
          ? "تعذر تحميل معلومات العيادة."
          : "Could not load clinic information."
      );

      setLoading(false);
      return;
    }

    if (!profile?.clinic_id) {
      setError(
        isArabic
          ? "لا توجد عيادة مرتبطة بهذا الطبيب."
          : "No clinic is connected to this doctor."
      );

      setLoading(false);
      return;
    }

    setClinicId(profile.clinic_id);

    const {
      data: clinic,
      error: clinicError,
    } = await supabase
      .from("clinics")
      .select("subscription_plan, name, logo_url")
      .eq("id", profile.clinic_id)
      .single();

    if (clinicError) {
      console.error(clinicError);

      setError(
        isArabic
          ? "تعذر تحميل معلومات الاشتراك."
          : "Could not load subscription information."
      );

      setLoading(false);
      return;
    }

    setSubscriptionPlan(
      clinic?.subscription_plan || "Free"
    );

    setClinicHeader({
      name: clinic?.name || "",
      logo_url: clinic?.logo_url || null,
    });

    await Promise.all([
      loadPatients(profile.clinic_id),
      loadNotificationsCount(profile.clinic_id),
    ]);
  };

  useEffect(() => {
    getClinic();
  }, []);

  const resetForm = () => {
    setName("");
    setPhone("");
    setAge("");
    setGender("");
    setAddress("");
    setMedicalNotes("");
    setEditingPatientId(null);
  };

  const hasReachedPatientLimit =
    subscriptionPlan === "Free" &&
    patients.length >= FREE_PATIENT_LIMIT;

  const handleSubmitPatient = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!clinicId) {
      setError(
        isArabic
          ? "لم يتم العثور على العيادة."
          : "Clinic not found."
      );

      return;
    }

    if (
      !editingPatientId &&
      subscriptionPlan === "Free" &&
      patients.length >= FREE_PATIENT_LIMIT
    ) {
      setError(
        isArabic
          ? "الباقة المجانية تسمح بحد أقصى 20 مريضًا. يرجى ترقية اشتراكك لإضافة المزيد من المرضى."
          : "Your Free plan allows up to 20 patients. Please upgrade your subscription to add more patients."
      );

      setShowForm(false);
      return;
    }

    const payload = {
      clinic_id: clinicId,
      name,
      phone: phone || null,
      age: age ? Number(age) : null,
      gender: gender || null,
      address: address || null,
      medical_notes: medicalNotes || null,
    };

    const { error: submitError } =
      editingPatientId
        ? await supabase
            .from("patients")
            .update(payload)
            .eq("id", editingPatientId)
        : await supabase
            .from("patients")
            .insert(payload);

    if (submitError) {
      console.error(submitError);
      setError(submitError.message);
      return;
    }

    setSuccess(
      editingPatientId
        ? isArabic
          ? "تم تحديث بيانات المريض بنجاح!"
          : "Patient updated successfully!"
        : isArabic
        ? "تمت إضافة المريض بنجاح!"
        : "Patient added successfully!"
    );

    resetForm();
    setShowForm(false);

    await loadPatients(clinicId);
  };

  const statusMeta: Record<
    PatientStatusCategory,
    {
      label: string;
      icon: typeof CheckCircle2;
      badgeClass: string;
      dotClass: string;
    }
  > = {
    completed: {
      label: isArabic ? "مكتمل" : "Completed",
      icon: CheckCircle2,
      badgeClass:
        "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
      dotClass: "bg-green-500",
    },

    upcoming: {
      label: isArabic
        ? "لديه مواعيد قادمة"
        : "Upcoming appointments",
      icon: Clock,
      badgeClass:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      dotClass: "bg-blue-500",
    },

    in_treatment: {
      label: isArabic ? "قيد العلاج" : "In treatment",
      icon: RefreshCcw,
      badgeClass:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      dotClass: "bg-orange-500",
    },

    needs_followup: {
      label: isArabic
        ? "متابعة مطلوبة"
        : "Follow-up needed",
      icon: AlertCircle,
      badgeClass:
        "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      dotClass: "bg-red-500",
    },

    no_data: {
      label: isArabic ? "لا يوجد بيانات" : "No data",
      icon: Clock,
      badgeClass:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      dotClass: "bg-slate-400",
    },
  };

  const statusFilterOptions: {
    value: StatusFilter;
    label: string;
  }[] = [
    {
      value: "all",
      label: isArabic
        ? "جميع الحالات"
        : "All statuses",
    },
    {
      value: "completed",
      label: statusMeta.completed.label,
    },
    {
      value: "upcoming",
      label: statusMeta.upcoming.label,
    },
    {
      value: "in_treatment",
      label: statusMeta.in_treatment.label,
    },
    {
      value: "needs_followup",
      label: statusMeta.needs_followup.label,
    },
  ];

  const periodFilterOptions: {
    value: PeriodFilter;
    label: string;
  }[] = [
    {
      value: "all",
      label: isArabic ? "كل المرضى" : "All patients",
    },
    {
      value: "week",
      label: isArabic
        ? "سجلوا هذا الأسبوع"
        : "Registered this week",
    },
    {
      value: "month",
      label: isArabic
        ? "سجلوا هذا الشهر"
        : "Registered this month",
    },
  ];

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    return patients.filter((p) => {
      if (
        query &&
        !p.name.toLowerCase().includes(query) &&
        !(p.phone || "")
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        p.statusCategory !== statusFilter
      ) {
        return false;
      }

      if (periodFilter !== "all") {
        const createdAt = new Date(p.created_at);

        if (
          periodFilter === "week" &&
          createdAt < weekAgo
        ) {
          return false;
        }

        if (
          periodFilter === "month" &&
          createdAt < monthAgo
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    patients,
    searchQuery,
    statusFilter,
    periodFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, periodFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPatients.length / PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedPatients =
    filteredPatients.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(
      1,
      currentPage - Math.floor(maxButtons / 2)
    );

    const end = Math.min(
      totalPages,
      start + maxButtons - 1
    );

    start = Math.max(
      1,
      end - maxButtons + 1
    );

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  const formatMoney = (amount: number) =>
    `${amount.toLocaleString(
      isArabic ? "ar-EG" : "en-US"
    )} ${isArabic ? "ج.م" : "EGP"}`;

  const formatDate = (date: string | null) => {
    if (!date) return "-";

    const parsed = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      isArabic ? "ar-EG" : "en-GB",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );
  };

  const PrevIcon = isArabic
    ? ChevronRight
    : ChevronLeft;

  const NextIcon = isArabic
    ? ChevronLeft
    : ChevronRight;

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل المرضى..."
            : "Loading patients..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
    >
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={
                isArabic
                  ? "رجوع"
                  : "Go back"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isArabic ? (
                <ArrowRight className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              {clinicHeader?.logo_url ? (
                <img
                  src={clinicHeader.logo_url}
                  alt={
                    clinicHeader.name ||
                    "Clinic logo"
                  }
                  className="h-10 w-10 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                  <Activity className="h-5 w-5" />
                </div>
              )}

              <div className="leading-tight">
                <p className="max-w-[220px] truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {clinicHeader?.name ||
                    (isArabic
                      ? "العيادة"
                      : "Clinic")}
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "إدارة المرضى"
                    : "Patient Management"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={
                isArabic
                  ? "تغيير اللغة"
                  : "Change language"
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Languages className="h-4 w-4" />

              <span className="hidden sm:inline">
                {isArabic
                  ? "English"
                  : "العربية"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDarkMode
                  ? isArabic
                    ? "الوضع الفاتح"
                    : "Light mode"
                  : isArabic
                  ? "الوضع الداكن"
                  : "Dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <Link
              to="/doctor/notifications"
              title={
                isArabic
                  ? "إشعارات الدكتور"
                  : "Doctor notifications"
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />

              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 99
                    ? "99+"
                    : unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-600 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
            {success}
          </div>
        )}

        {hasReachedPatientLimit && (
          <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-950/40">
            <p className="font-semibold text-orange-800 dark:text-orange-300">
              {isArabic
                ? "تم الوصول إلى الحد الأقصى للباقة المجانية"
                : "Free plan limit reached"}
            </p>

            <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
              {isArabic
                ? "لقد وصلت إلى الحد الأقصى وهو 20 مريضًا في الباقة المجانية."
                : "You have reached the maximum of 20 patients on the Free plan."}
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/doctor/subscription";
              }}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              {isArabic
                ? "ترقية الاشتراك"
                : "Upgrade Subscription"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">
              {editingPatientId
                ? isArabic
                  ? "تعديل بيانات المريض"
                  : "Edit Patient"
                : isArabic
                ? "إضافة مريض جديد"
                : "Add New Patient"}
            </h2>

            <form
              onSubmit={handleSubmitPatient}
              className="grid gap-4 md:grid-cols-2"
            >
              <input
                type="text"
                placeholder={
                  isArabic
                    ? "اسم المريض"
                    : "Patient Name"
                }
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              <input
                type="tel"
                placeholder={
                  isArabic
                    ? "رقم الهاتف"
                    : "Phone"
                }
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                dir="ltr"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              <input
                type="number"
                placeholder={
                  isArabic ? "العمر" : "Age"
                }
                min="0"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">
                  {isArabic
                    ? "اختر النوع"
                    : "Select Gender"}
                </option>

                <option value="Male">
                  {isArabic ? "ذكر" : "Male"}
                </option>

                <option value="Female">
                  {isArabic
                    ? "أنثى"
                    : "Female"}
                </option>
              </select>

              <input
                type="text"
                placeholder={
                  isArabic
                    ? "العنوان"
                    : "Address"
                }
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              <textarea
                placeholder={
                  isArabic
                    ? "الملاحظات الطبية"
                    : "Medical Notes"
                }
                value={medicalNotes}
                onChange={(e) =>
                  setMedicalNotes(e.target.value)
                }
                className="min-h-32 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 md:col-span-2"
              />

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  {editingPatientId
                    ? isArabic
                      ? "حفظ التعديلات"
                      : "Save changes"
                    : isArabic
                    ? "إضافة المريض"
                    : "Add Patient"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* قائمة المرضى */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <div className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isArabic
                  ? "قائمة المرضى"
                  : "Patient List"}
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filteredPatients.length}{" "}
                {isArabic
                  ? filteredPatients.length === 1
                    ? "مريض"
                    : "مرضى"
                  : filteredPatients.length === 1
                  ? "patient"
                  : "patients"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                    isArabic
                      ? "right-3"
                      : "left-3"
                  }`}
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder={
                    isArabic
                      ? "ابحث عن مريض بالاسم أو رقم الهاتف..."
                      : "Search patient by name or phone..."
                  }
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                    isArabic
                      ? "pr-9 pl-3"
                      : "pl-9 pr-3"
                  }`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as StatusFilter
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {statusFilterOptions.map(
                  (opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  )
                )}
              </select>

              <select
                value={periodFilter}
                onChange={(e) =>
                  setPeriodFilter(
                    e.target.value as PeriodFilter
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {periodFilterOptions.map(
                  (opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={() => {
                  if (hasReachedPatientLimit) {
                    setError(
                      isArabic
                        ? "الباقة المجانية تسمح بحد أقصى 20 مريضًا. يرجى ترقية اشتراكك لإضافة المزيد من المرضى."
                        : "Your Free plan allows up to 20 patients. Please upgrade your subscription to add more patients."
                    );

                    setSuccess("");
                    return;
                  }

                  resetForm();
                  setShowForm((v) => !v);
                  setError("");
                  setSuccess("");
                }}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                  hasReachedPatientLimit
                    ? "bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {showForm && !editingPatientId
                  ? isArabic
                    ? "إلغاء"
                    : "Cancel"
                  : isArabic
                  ? "+ إضافة مريض جديد"
                  : "+ Add New Patient"}
              </button>
            </div>
          </div>

          {paginatedPatients.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا يوجد مرضى مطابقين."
                  : "No matching patients."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "المريض"
                        : "Patient"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "العمر"
                        : "Age"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "رقم الهاتف"
                        : "Phone"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الحالة"
                        : "Status"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "آخر موعد"
                        : "Last visit"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "إجمالي العلاج"
                        : "Total treatment"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "المدفوع"
                        : "Paid"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الباقي"
                        : "Remaining"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "المواعيد القادمة"
                        : "Upcoming"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPatients.map(
                    (patient) => {
                      const meta =
                        statusMeta[
                          patient.statusCategory
                        ];

                      return (
                        <tr
                          key={patient.id}
                          className="border-t border-slate-100 dark:border-slate-800"
                        >
                          <td className="px-6 py-4">
                            <Link
                              to={`/doctor/patients/${patient.id}`}
                              className="flex items-center gap-3"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                {patient.name.charAt(0)}
                              </span>

                              <span className="font-semibold text-slate-800 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400">
                                {patient.name}
                              </span>
                            </Link>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                            {patient.age !== null
                              ? patient.age
                              : "-"}
                          </td>

                          <td
                            className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300"
                            dir="ltr"
                          >
                            {patient.phone || "-"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                            >
                              <meta.icon className="h-3.5 w-3.5" />
                              {meta.label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                            {formatDate(
                              patient
                                .latestAppointment
                                ?.appointment_date ||
                                null
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                            {formatMoney(
                              patient.totalTreatment
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-green-600 dark:text-green-400">
                            {formatMoney(
                              patient.totalPaid
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-orange-600 dark:text-orange-400">
                            {patient.remaining > 0
                              ? formatMoney(
                                  patient.remaining
                                )
                              : isArabic
                              ? "مدفوع بالكامل"
                              : "Paid in full"}
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                            {patient.upcomingCount}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {filteredPatients.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? `عرض ${
                      (currentPage - 1) *
                        PAGE_SIZE +
                      1
                    } - ${Math.min(
                      currentPage * PAGE_SIZE,
                      filteredPatients.length
                    )} من ${
                      filteredPatients.length
                    } مريض`
                  : `Showing ${
                      (currentPage - 1) *
                        PAGE_SIZE +
                      1
                    } - ${Math.min(
                      currentPage * PAGE_SIZE,
                      filteredPatients.length
                    )} of ${
                      filteredPatients.length
                    } patients`}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((p) =>
                      Math.max(1, p - 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <PrevIcon className="h-4 w-4" />
                </button>

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                      num === currentPage
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        totalPages,
                        p + 1
                      )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <NextIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Patients;




