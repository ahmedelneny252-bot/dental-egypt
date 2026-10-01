import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  CalendarX,
  Clock,
  Languages,
  Moon,
  Plus,
  RefreshCcw,
  Sun,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

// ============================================
// Types
// ============================================

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  appointment_type: string | null;
  patients?: { name: string; phone?: string | null } | null;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
};

// ============================================
// Helpers
// ============================================

const formatDate = (date: string, isArabic: boolean) => {
  try {
    return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
};

const formatTime = (time: string, isArabic: boolean) => {
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

function WeekAppointments() {
  const navigate = useNavigate();

  // ============================================
  // Language / Theme
  // ============================================

  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("dentalcare-language");
    return stored === "en" ? "en" : "ar";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("dentalcare-theme");
    return stored === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("dentalcare-language", language);
  }, [language, isArabic]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("dentalcare-theme", theme);
  }, [theme]);

  // ============================================
  // State
  // ============================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Follow-up modal
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpPatientId, setFollowUpPatientId] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // ============================================
  // Week days (اليوم + 6 أيام قادمة)
  // ============================================

  const weekDays = useMemo(() => {
    const today = new Date();
    const days: { iso: string; label: string; dayNumber: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const iso = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
      }).format(d);

      days.push({
        iso,
        label: d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
          weekday: "short",
        }),
        dayNumber: d.getDate(),
      });
    }

    return days;
  }, [isArabic]);

  useEffect(() => {
    if (weekDays.length > 0 && !selectedDay) {
      setSelectedDay(weekDays[0].iso);
    }
  }, [weekDays, selectedDay]);

  // منع سكرول الصفحة الخلفية أثناء فتح النافذة
  useEffect(() => {
    if (showFollowUpModal) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [showFollowUpModal]);

  // ============================================
  // Load data
  // ============================================

  const loadData = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.clinic_id) {
        throw new Error(
          isArabic
            ? "لم يتم ربط حساب الطبيب بعيادة."
            : "Your doctor account is not connected to a clinic."
        );
      }

      setClinicId(profile.clinic_id);

      const from = weekDays[0].iso;
      const to = weekDays[weekDays.length - 1].iso;

      const [clinicResult, appointmentsResult, patientsResult] =
        await Promise.all([
          supabase
            .from("clinics")
            .select("name, logo_url")
            .eq("id", profile.clinic_id)
            .single(),

          supabase
            .from("appointments")
            .select(
              `id, appointment_date, appointment_time, status, appointment_type,
               patients ( name, phone )`
            )
            .eq("clinic_id", profile.clinic_id)
            .gte("appointment_date", from)
            .lte("appointment_date", to)
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true }),

          supabase
            .from("patients")
            .select("id, name, phone")
            .eq("clinic_id", profile.clinic_id)
            .order("name", { ascending: true }),
        ]);

      if (clinicResult.error) throw clinicResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;
      if (patientsResult.error) throw patientsResult.error;

      setClinicName(clinicResult.data?.name || "");
      setClinicLogo(clinicResult.data?.logo_url || null);

      setAppointments(
        (appointmentsResult.data || []).map((a: any) => ({
          id: a.id,
          appointment_date: a.appointment_date,
          appointment_time: a.appointment_time,
          status: a.status,
          appointment_type: a.appointment_type,
          patients: Array.isArray(a.patients)
            ? a.patients[0] || null
            : a.patients || null,
        }))
      );

      setPatients(patientsResult.data || []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء تحميل المواعيد."
            : "Failed to load appointments.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // Group by day
  // ============================================

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    weekDays.forEach((d) => map.set(d.iso, []));

    appointments.forEach((a) => {
      if (map.has(a.appointment_date)) {
        map.get(a.appointment_date)!.push(a);
      }
    });

    return map;
  }, [appointments, weekDays]);

  const selectedAppointments = byDay.get(selectedDay) || [];

  // ============================================
  // Labels
  // ============================================

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

  // ============================================
  // Language / theme toggles
  // ============================================

  const toggleLanguage = () => {
    const next: Language = isArabic ? "en" : "ar";
    setLanguage(next);
    localStorage.setItem("dentalcare-language", next);
    window.dispatchEvent(new Event("dentalcare-language-change"));
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("dentalcare-theme", next);
    window.dispatchEvent(new Event("dentalcare-theme-change"));
  };

  // ============================================
  // Follow-up
  // ============================================

  const openFollowUpModal = () => {
    setError("");
    setSuccess("");
    setFollowUpPatientId("");
    setFollowUpTime("");
    setFollowUpNotes("");
    setShowFollowUpModal(true);
  };

  const checkAppointmentConflict = async (date: string, time: string) => {
    if (!clinicId) return { error: null, conflict: false };

    const { data, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("appointment_date", date)
      .eq("appointment_time", time)
      .neq("status", "cancelled")
      .limit(1);

    if (conflictError) {
      console.error("Conflict check error:", conflictError);
      return { error: conflictError, conflict: false };
    }

    return { error: null, conflict: (data?.length ?? 0) > 0 };
  };

  const handleCreateFollowUp = async () => {
    if (!clinicId || !selectedDay) return;

    if (!followUpPatientId || !followUpTime) {
      setError(
        isArabic
          ? "من فضلك اختر المريض والوقت."
          : "Please select the patient and time."
      );
      return;
    }

    setFollowUpLoading(true);
    setError("");
    setSuccess("");

    try {
      const { conflict, error: conflictError } =
        await checkAppointmentConflict(selectedDay, followUpTime);

      if (conflictError) {
        setError(
          isArabic
            ? "تعذر التحقق من توفر الموعد."
            : "Could not check appointment availability."
        );
        return;
      }

      if (conflict) {
        setError(
          isArabic
            ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
            : "This time is already booked. Please choose another time."
        );
        return;
      }

      const { data: newAppointment, error: insertError } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinicId,
          patient_id: followUpPatientId,
          appointment_date: selectedDay,
          appointment_time: followUpTime,
          status: "confirmed",
          notes: followUpNotes.trim() || null,
          appointment_type: "follow_up",
          created_by: "doctor",
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError || !newAppointment) {
        throw (
          insertError ||
          new Error(
            isArabic
              ? "تعذر إنشاء موعد المتابعة."
              : "Could not create follow-up appointment."
          )
        );
      }

      const selectedPatient = patients.find((p) => p.id === followUpPatientId);
      const patientName =
        selectedPatient?.name || (isArabic ? "المريض" : "Patient");
      const formattedDate = formatDate(selectedDay, isArabic);

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          clinic_id: clinicId,
          patient_id: followUpPatientId,
          appointment_id: newAppointment.id,
          title: isArabic
            ? "تم تحديد موعد متابعة جديد"
            : "New Follow-up Appointment Scheduled",
          message: isArabic
            ? `مرحبًا ${patientName}، قام الطبيب بتحديد موعد متابعة لك يوم ${formattedDate} الساعة ${formatTime(
                followUpTime,
                true
              )}.`
            : `Hello ${patientName}, your doctor scheduled a follow-up for ${formattedDate} at ${formatTime(
                followUpTime,
                false
              )}.`,
          is_read: false,
          recipient_type: "patient",
          notification_type: "follow_up_created",
        });

      if (notificationError) {
        console.error("Notification error:", notificationError);
      }

      setSuccess(
        isArabic
          ? "تم إنشاء موعد المتابعة بنجاح."
          : "Follow-up appointment created successfully."
      );

      setShowFollowUpModal(false);
      await loadData(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء إنشاء موعد المتابعة."
            : "Failed to create follow-up appointment.")
      );
    } finally {
      setFollowUpLoading(false);
    }
  };

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  // ============================================
  // Render
  // ============================================

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/doctor/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={isArabic ? "العودة" : "Back"}
            >
              <BackIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Activity className="h-6 w-6" />
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  DentalCare
                </p>

                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {clinicName || (isArabic ? "عيادتي" : "My Clinic")}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/doctor/notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={isArabic ? "الإشعارات" : "Notifications"}
            >
              <Bell className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={toggleLanguage}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Languages className="h-4 w-4" />
              {isArabic ? "EN" : "عربي"}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isArabic ? "مواعيد هذا الأسبوع" : "This Week's Appointments"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? `${appointments.length} موعد خلال الأيام السبعة القادمة`
                : `${appointments.length} appointments in the next 7 days`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openFollowUpModal}
              disabled={loading || !selectedDay}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isArabic ? "إضافة موعد متابعة" : "Add Follow-up"}
            </button>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={isArabic ? "تحديث" : "Refresh"}
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Week day tabs */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const count = byDay.get(day.iso)?.length || 0;
            const active = selectedDay === day.iso;

            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelectedDay(day.iso)}
                className={`flex flex-col items-center rounded-xl px-1 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <span>{day.label}</span>
                <span className="mt-0.5 text-base">{day.dayNumber}</span>
                <span
                  className={`mt-1 min-w-[18px] rounded-full px-1.5 text-[10px] ${
                    active
                      ? "bg-white/20 text-white"
                      : count > 0
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                      : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected day's appointments */}
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
            {selectedDay ? formatDate(selectedDay, isArabic) : ""}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500 dark:text-slate-400">
              <RefreshCcw className="h-6 w-6 animate-spin" />
              <span className="text-sm">
                {isArabic
                  ? "جاري تحميل المواعيد..."
                  : "Loading appointments..."}
              </span>
            </div>
          ) : selectedAppointments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <CalendarX className="h-8 w-8" />
              <p className="text-sm">
                {isArabic
                  ? "لا توجد مواعيد في هذا اليوم."
                  : "No appointments this day."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatTime(a.appointment_time, isArabic)}
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {a.patients?.name || (isArabic ? "مريض" : "Patient")}
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatAppointmentType(a.appointment_type)}
                        {a.patients?.phone ? ` - ${a.patients.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                      a.status
                    )}`}
                  >
                    {formatStatusLabel(a.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          Add Follow-up Modal (التاريخ = اليوم المحدد)
         ======================================================== */}

      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900">
              <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isArabic ? "إضافة موعد متابعة" : "Add Follow-up"}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowFollowUpModal(false)}
                    className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-6">
                {/* Patient */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic ? "المريض" : "Patient"}
                  </label>

                  <select
                    value={followUpPatientId}
                    onChange={(event) =>
                      setFollowUpPatientId(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      {isArabic ? "اختر المريض" : "Select Patient"}
                    </option>

                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                        {patient.phone ? ` - ${patient.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date (ثابت = اليوم المحدد) */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic ? "التاريخ" : "Date"}
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedDay, isArabic)}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic ? "الوقت" : "Time"}
                  </label>

                  <div className="relative">
                    <Clock
                      className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                        isArabic ? "left-3" : "right-3"
                      }`}
                    />

                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(event) => setFollowUpTime(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic ? "ملاحظات" : "Notes"}
                  </label>

                  <textarea
                    value={followUpNotes}
                    onChange={(event) => setFollowUpNotes(event.target.value)}
                    rows={3}
                    placeholder={
                      isArabic
                        ? "مثال: متابعة بعد العلاج..."
                        : "Example: Follow-up after treatment..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={followUpLoading}
                    onClick={handleCreateFollowUp}
                    className="flex-1 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {followUpLoading
                      ? "..."
                      : isArabic
                      ? "إنشاء المتابعة"
                      : "Create Follow-up"}
                  </button>

                  <button
                    type="button"
                    disabled={followUpLoading}
                    onClick={() => setShowFollowUpModal(false)}
                    className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {isArabic ? "إلغاء" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeekAppointments;