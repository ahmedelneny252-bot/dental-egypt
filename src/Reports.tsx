
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Globe,
  Moon,
  Sun,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "./supabase";

type Language = "en" | "ar";
type Period = "today" | "week" | "month";

type ClinicAppointment = {
  id: string;
  status: string;
  appointment_type: string | null;
  appointment_date: string;
};

const Reports = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return saved === "ar" ? "ar" : "en";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  const [period, setPeriod] = useState<Period>("month");

  const isArabic = language === "ar";
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
  }, [language, isArabic]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [theme, isDark]);

  // ============================================
  // Live data state
  // ============================================

  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const [newPatients, setNewPatients] = useState(0);
  const [periodAppointments, setPeriodAppointments] = useState<
    ClinicAppointment[]
  >([]);
  const [periodRevenue, setPeriodRevenue] = useState(0);

  // ============================================
  // Helpers — dates
  // ============================================

  const getEgyptDateStr = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
    }).format(d);

  const getRange = (p: Period) => {
    const today = new Date();
    const todayStr = getEgyptDateStr(today);

    if (p === "today") {
      return { start: todayStr, end: todayStr };
    }

    if (p === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);

      return {
        start: getEgyptDateStr(weekAgo),
        end: todayStr,
      };
    }

    const firstOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const lastOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    return {
      start: getEgyptDateStr(firstOfMonth),
      end: getEgyptDateStr(lastOfMonth),
    };
  };

  // ============================================
  // Load clinic
  // ============================================

  useEffect(() => {
    const loadClinic = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/doctor/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (error || !profile?.clinic_id) {
        setLoading(false);
        return;
      }

      setClinicId(profile.clinic_id);
    };

    loadClinic();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // Load report data
  // ============================================

  useEffect(() => {
    if (!clinicId) return;

    const loadReportData = async () => {
      setLoading(true);

      const { start, end } = getRange(period);

      // ---------- New patients ----------

      const { count: patientsCount } = await supabase
        .from("patients")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId)
        .gte("created_at", start)
        .lte("created_at", `${end}T23:59:59`);

      setNewPatients(patientsCount || 0);

      // ---------- Appointments ----------

      const {
        data: appointmentsData,
        error: appointmentsError,
      } = await supabase
        .from("appointments")
        .select(
          "id, status, appointment_type, appointment_date"
        )
        .eq("clinic_id", clinicId)
        .gte("appointment_date", start)
        .lte("appointment_date", end);

      if (appointmentsError) {
        console.error(appointmentsError);
        setPeriodAppointments([]);
      } else {
        setPeriodAppointments(appointmentsData || []);
      }

      // ---------- Revenue ----------

      const {
        data: paymentsData,
        error: paymentsError,
      } = await supabase
        .from("payments")
        .select("amount, created_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", start)
        .lte("created_at", `${end}T23:59:59`);

      if (paymentsError) {
        console.error(paymentsError);
        setPeriodRevenue(0);
      } else {
        const total = (paymentsData || []).reduce(
          (sum: number, payment: any) =>
            sum + Number(payment.amount || 0),
          0
        );

        setPeriodRevenue(total);
      }

      setLoading(false);
    };

    loadReportData();
  }, [clinicId, period]);

  // ============================================
  // Derived stats
  // ============================================

  const data = useMemo(() => {
    const appointments = periodAppointments.length;

    const completed = periodAppointments.filter(
      (a) => a.status === "completed"
    ).length;

    const cancelled = periodAppointments.filter(
      (a) => a.status === "cancelled"
    ).length;

    return {
      patients: newPatients,
      appointments,
      completed,
      cancelled,
      revenue: periodRevenue,
    };
  }, [
    newPatients,
    periodAppointments,
    periodRevenue,
  ]);

  const appointmentRate =
    data.appointments > 0
      ? Math.round(
          (data.completed / data.appointments) * 100
        )
      : 0;

  const cancellationRate =
    data.appointments > 0
      ? Math.round(
          (data.cancelled / data.appointments) * 100
        )
      : 0;

  // ============================================
  // Visit Types
  // ============================================

  const treatments = useMemo(() => {
    const counts = {
      checkup: 0,
      follow_up: 0,
      xray: 0,
    };

    periodAppointments.forEach((appointment) => {
      if (appointment.status === "cancelled") {
        return;
      }

      const key =
        appointment.appointment_type === "follow_up"
          ? "follow_up"
          : appointment.appointment_type === "xray"
          ? "xray"
          : "checkup";

      counts[key] += 1;
    });

    return [
      {
        key: "checkup",
        name: isArabic ? "كشف" : "Checkup",
        count: counts.checkup,
      },
      {
        key: "follow_up",
        name: isArabic ? "متابعة" : "Follow-up",
        count: counts.follow_up,
      },
      {
        key: "xray",
        name: isArabic ? "أشعة" : "X-Ray",
        count: counts.xray,
      },
    ];
  }, [periodAppointments, isArabic]);

  const totalVisits = treatments.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const doughnutSegments = useMemo(() => {
    const colors = [
      "#14b8a6",
      "#6366f1",
      "#f59e0b",
    ];

    let currentOffset = 0;

    return treatments.map((item, index) => {
      const percentage =
        totalVisits > 0
          ? (item.count / totalVisits) * 100
          : 0;

      const segment = {
        ...item,
        percentage,
        color: colors[index],
        offset: currentOffset,
      };

      currentOffset += percentage;

      return segment;
    });
  }, [treatments, totalVisits]);

  const handleExport = () => {
    window.print();
  };

  // ============================================
  // Statistics
  // ============================================

  const statCards = [
    {
      title: isArabic ? "مرضى جدد" : "New Patients",
      value: data.patients,
      icon: Users,
      description: isArabic
        ? "خلال الفترة المحددة"
        : "During selected period",
    },
    {
      title: isArabic
        ? "المواعيد المكتملة"
        : "Completed",
      value: data.completed,
      icon: CheckCircle2,
      description: `${appointmentRate}% ${
        isArabic
          ? "من المواعيد"
          : "of appointments"
      }`,
    },
    {
      title: isArabic
        ? "المواعيد الملغاة"
        : "Cancelled",
      value: data.cancelled,
      icon: XCircle,
      description: `${cancellationRate}% ${
        isArabic
          ? "من المواعيد"
          : "of appointments"
      }`,
    },
  ];

  if (loading && !clinicId) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <p>
          {isArabic
            ? "جاري تحميل التقارير..."
            : "Loading reports..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Bar */}

      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
          isDark
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              isDark
                ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            {isArabic ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}

            {isArabic ? "رجوع" : "Back"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLanguage(
                  isArabic ? "en" : "ar"
                );
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <Globe className="h-4 w-4" />

              {isArabic ? "EN" : "AR"}
            </button>

            <button
              onClick={() =>
                setTheme(
                  isDark ? "light" : "dark"
                )
              }
              className={`rounded-xl border p-2.5 transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main */}

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        {/* Header */}

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
              <BarChart3 className="h-4 w-4" />

              {isArabic
                ? "تحليل العيادة"
                : "Clinic Analytics"}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isArabic ? "التقارير" : "Reports"}
            </h1>

            <p
              className={`mt-1.5 max-w-2xl text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {isArabic
                ? "تابع أداء العيادة والمرضى والمواعيد والإيرادات من مكان واحد."
                : "Track your clinic performance, patients, appointments and revenue in one place."}
            </p>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Download className="h-4 w-4" />

            {isArabic
              ? "تصدير التقرير"
              : "Export Report"}
          </button>
        </div>

        {/* Period Filter */}

        <div
          className={`mb-5 flex w-fit items-center gap-1 rounded-xl border p-1 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          {[
            {
              value: "today" as Period,
              label: isArabic ? "اليوم" : "Today",
            },
            {
              value: "week" as Period,
              label: isArabic
                ? "آخر 7 أيام"
                : "Last 7 Days",
            },
            {
              value: "month" as Period,
              label: isArabic
                ? "هذا الشهر"
                : "This Month",
            },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() =>
                setPeriod(item.value)
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                period === item.value
                  ? "bg-teal-600 text-white"
                  : isDark
                  ? "text-slate-400 hover:bg-slate-800"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p
            className={`mb-5 text-sm ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {isArabic
              ? "جاري تحديث البيانات..."
              : "Updating data..."}
          </p>
        ) : null}

        {/* Statistics */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* New Patients */}

          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className={`rounded-2xl border p-5 shadow-sm ${
                  isDark
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {card.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {card.value.toLocaleString()}
                    </p>

                    <p
                      className={`mt-2 text-xs ${
                        isDark
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-teal-50 p-3 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total Appointments — Premium Card */}

          <div
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            {/* Decorative background */}

            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-500/10" />

            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`text-sm ${
                      isDark
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    {isArabic
                      ? "إجمالي المواعيد"
                      : "Total Appointments"}
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-bold">
                      {data.appointments.toLocaleString()}
                    </span>

                    <span className="mb-1 text-xs font-medium text-teal-600 dark:text-teal-400">
                      {isArabic
                        ? "موعد"
                        : "Appointments"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-teal-50 p-3 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>

              {/* Mini visual */}

              <div className="mt-5 flex items-end gap-1.5">
                {[35, 55, 42, 70, 52, 85, 65, 95].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-teal-500/20"
                      style={{
                        height: `${Math.max(
                          8,
                          Math.round(
                            (height / 100) *
                              32
                          )
                        )}px`,
                      }}
                    >
                      <div
                        className="w-full rounded-t-md bg-teal-500"
                        style={{
                          height:
                            index === 7
                              ? "100%"
                              : `${Math.max(
                                  35,
                                  height -
                                    20
                                )}%`,
                        }}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isArabic
                    ? "خلال الفترة المحددة"
                    : "Selected period"}
                </span>

                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {period === "today"
                    ? isArabic
                      ? "اليوم"
                      : "Today"
                    : period === "week"
                    ? isArabic
                      ? "7 أيام"
                      : "7 Days"
                    : isArabic
                    ? "هذا الشهر"
                    : "This Month"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================
            Revenue + Appointment Performance
        ======================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Revenue */}

          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {isArabic
                    ? "الإيرادات"
                    : "Revenue"}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {data.revenue.toLocaleString()}{" "}
                  <span className="text-base font-medium text-slate-400">
                    EGP
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CircleDollarSign className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              {isArabic
                ? "إجمالي المبالغ المحصّلة خلال الفترة المحددة"
                : "Total amount collected during the selected period"}
            </p>
          </div>

          {/* Appointment Performance */}

          <div
            className={`rounded-2xl border p-6 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {isArabic
                    ? "أداء المواعيد"
                    : "Appointment Performance"}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {appointmentRate}%
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                <Clock3 className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${appointmentRate}%`,
                  }}
                />
              </div>

              <span className="text-sm font-semibold">
                {data.completed}/{data.appointments}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {isArabic
                ? "نسبة المواعيد المكتملة"
                : "Completed appointment rate"}
            </p>
          </div>
        </div>

        {/* ========================================
            Visit Types Doughnut Chart
        ======================================== */}

        <div
          className={`mt-6 rounded-2xl border p-6 shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                {isArabic
                  ? "أنواع الزيارات"
                  : "Visit Types"}
              </h2>

              <p className="text-sm text-slate-400">
                {isArabic
                  ? "توزيع أنواع المواعيد خلال الفترة المحددة"
                  : "Appointment type breakdown for the selected period"}
              </p>
            </div>
          </div>

          {totalVisits === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              {isArabic
                ? "لا توجد زيارات في هذه الفترة."
                : "No visits in this period."}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 md:flex-row">
              {/* Doughnut */}

              <div className="relative flex h-64 w-64 shrink-0 items-center justify-center">
                <div
                  className="h-56 w-56 rounded-full shadow-sm"
                  style={{
                    background: `conic-gradient(
                      ${doughnutSegments
                        .map(
                          (segment) =>
                            `${segment.color} ${segment.offset}% ${
                              segment.offset +
                              segment.percentage
                            }%`
                        )
                        .join(", ")}
                    )`,
                  }}
                />

                <div
                  className={`absolute flex h-32 w-32 flex-col items-center justify-center rounded-full shadow-inner ${
                    isDark
                      ? "bg-slate-900"
                      : "bg-white"
                  }`}
                >
                  <span className="text-3xl font-bold">
                    {totalVisits}
                  </span>

                  <span className="text-xs text-slate-400">
                    {isArabic
                      ? "زيارة"
                      : "Visits"}
                  </span>
                </div>
              </div>

              {/* Legend */}

              <div className="w-full flex-1 space-y-4">
                {doughnutSegments.map(
                  (item) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between rounded-xl border p-4 ${
                        isDark
                          ? "border-slate-800 bg-slate-950/50"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              item.color,
                          }}
                        />

                        <span className="font-medium">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold">
                          {item.count}
                        </span>

                        <span className="min-w-12 text-right text-sm text-slate-400">
                          {Math.round(
                            item.percentage
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Report Information */}

        <div
          className={`mt-6 rounded-2xl border p-5 ${
            isDark
              ? "border-slate-800 bg-slate-900/70"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

            <div>
              <p className="text-sm font-semibold">
                {isArabic
                  ? "الفترة الحالية"
                  : "Current Period"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {period === "today"
                  ? isArabic
                    ? "اليوم"
                    : "Today"
                  : period === "week"
                  ? isArabic
                    ? "آخر 7 أيام"
                    : "Last 7 Days"
                  : isArabic
                  ? "هذا الشهر"
                  : "This Month"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;

