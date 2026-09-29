import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Languages,
  Moon,
  Sun,
  Activity,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  appointment_type: string | null;
  created_by: string | null;
  clinics?: {
    name: string;
  } | null;
};

type Patient = {
  id: string;
  name: string;
};

type FilterType =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

const PatientAppointments = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(
      "dentalcare-language"
    );

    return savedLanguage === "en" ? "en" : "ar";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // ============================================
  // Language
  // ============================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem(
        "dentalcare-language"
      );

      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );
    };
  }, []);

  // ============================================
  // Theme
  // ============================================

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
    const nextDarkMode = !root.classList.contains("dark");

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

  // ============================================
  // Load patient records
  // ============================================

  const loadPatients = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);

        setError(
          isArabic
            ? "حدث خطأ أثناء التحقق من تسجيل الدخول."
            : "An error occurred while checking your login."
        );

        return;
      }

      if (!user) {
        navigate("/patient/login", {
          replace: true,
        });

        return;
      }

      const {
        data: patientData,
        error: patientError,
      } = await supabase
        .from("patients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (patientError) {
        console.error(patientError);

        setError(
          isArabic
            ? `تعذر تحميل بيانات المريض: ${patientError.message}`
            : `Could not load patient data: ${patientError.message}`
        );

        return;
      }

      if (!patientData || patientData.length === 0) {
        setPatients([]);
        setSelectedPatientId("");
        setAppointments([]);

        setError(
          isArabic
            ? "حساب المريض الخاص بك غير مرتبط بسجل مريض."
            : "Your patient account is not connected to a patient record."
        );

        return;
      }

      const patientList = patientData as Patient[];

      setPatients(patientList);

      setSelectedPatientId((currentSelectedId) => {
        if (
          currentSelectedId &&
          patientList.some(
            (patient) => patient.id === currentSelectedId
          )
        ) {
          return currentSelectedId;
        }

        return patientList[0].id;
      });
    } catch (error) {
      console.error(error);

      setError(
        isArabic
          ? "حدث خطأ أثناء تحميل بيانات المريض."
          : "An error occurred while loading patient data."
      );
    }
  };

  // ============================================
  // Load selected patient's appointments
  // ============================================

  const loadPatientAppointments = async (
    patientId: string
  ) => {
    if (!patientId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data: appointmentData,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          appointment_type,
          created_by,
          clinics (
            name
          )
        `)
        .eq("patient_id", patientId)
        .order("appointment_date", {
          ascending: false,
        })
        .order("appointment_time", {
          ascending: false,
        });

      if (appointmentError) {
        console.error(appointmentError);

        setError(
          isArabic
            ? `تعذر تحميل المواعيد: ${appointmentError.message}`
            : `Could not load appointments: ${appointmentError.message}`
        );

        setAppointments([]);
        return;
      }

      const formattedAppointments: Appointment[] =
        (appointmentData || []).map(
          (appointment: any) => ({
            id: appointment.id,
            appointment_date:
              appointment.appointment_date,
            appointment_time:
              appointment.appointment_time,
            status:
              appointment.status,
            notes:
              appointment.notes,
            appointment_type:
              appointment.appointment_type,
            created_by:
              appointment.created_by,
            clinics:
              Array.isArray(
                appointment.clinics
              )
                ? appointment.clinics[0] || null
                : appointment.clinics || null,
          })
        );

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error(error);

      setError(
        isArabic
          ? "حدث خطأ أثناء تحميل المواعيد."
          : "An error occurred while loading appointments."
      );

      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Initial load
  // ============================================

  useEffect(() => {
    loadPatients();
  }, []);

  // ============================================
  // Load appointments when selected patient changes
  // ============================================

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientAppointments(selectedPatientId);
    }
  }, [selectedPatientId]);

  // ============================================
  // Clear error after language change
  // ============================================

  useEffect(() => {
    setError("");
  }, [language]);

  // ============================================
  // Status style
  // ============================================

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300";

      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";

      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";

      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";

      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  // ============================================
  // Status translation
  // ============================================

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return isArabic ? "قيد الانتظار" : "Pending";

      case "confirmed":
        return isArabic ? "مؤكد" : "Confirmed";

      case "cancelled":
        return isArabic ? "ملغي" : "Cancelled";

      case "completed":
        return isArabic ? "مكتمل" : "Completed";

      default:
        return status;
    }
  };

  // ============================================
  // Appointment type
  // ============================================

  const formatAppointmentType = (
    type: string | null,
    createdBy: string | null
  ) => {
    if (
      type === "follow_up" ||
      createdBy === "doctor"
    ) {
      return isArabic
        ? "متابعة"
        : "Follow-up";
    }

    return isArabic
      ? "حجز كشف"
      : "Booking";
  };

  const getAppointmentTypeStyle = (
    type: string | null,
    createdBy: string | null
  ) => {
    if (
      type === "follow_up" ||
      createdBy === "doctor"
    ) {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    }

    return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
  };

  // ============================================
  // Date formatting
  // ============================================

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      isArabic ? "ar-EG" : "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================
  // Time formatting
  // ============================================

  const formatTime = (time: string) => {
    if (!time) {
      return "-";
    }

    const [hours, minutes] = time.split(":");

    if (!hours || !minutes) {
      return time;
    }

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      isArabic ? "ar-EG" : "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ============================================
  // Filter appointments
  // ============================================

  const filteredAppointments = useMemo(() => {
    if (filter === "all") {
      return appointments;
    }

    return appointments.filter(
      (appointment) =>
        appointment.status === filter
    );
  }, [appointments, filter]);

  // ============================================
  // Appointment counts
  // ============================================

  const counts = useMemo(() => {
    return {
      all: appointments.length,

      pending: appointments.filter(
        (appointment) =>
          appointment.status === "pending"
      ).length,

      confirmed: appointments.filter(
        (appointment) =>
          appointment.status === "confirmed"
      ).length,

      completed: appointments.filter(
        (appointment) =>
          appointment.status === "completed"
      ).length,

      cancelled: appointments.filter(
        (appointment) =>
          appointment.status === "cancelled"
      ).length,
    };
  }, [appointments]);

  // ============================================
  // Filter labels
  // ============================================

  const filterLabels: Record<
    FilterType,
    string
  > = {
    all: isArabic ? "الكل" : "All",
    pending: isArabic
      ? "قيد الانتظار"
      : "Pending",
    confirmed: isArabic
      ? "مؤكد"
      : "Confirmed",
    completed: isArabic
      ? "مكتمل"
      : "Completed",
    cancelled: isArabic
      ? "ملغي"
      : "Cancelled",
  };

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"
      >
        <div className="rounded-2xl bg-white px-10 py-8 shadow-lg dark:bg-slate-900">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {isArabic
              ? "جاري تحميل مواعيدك..."
              : "Loading your appointments..."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Main page
  // ============================================

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950"
    >
      {/* ========================================
          Simple Patient Header
      ======================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Back + Logo */}

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

            {/* DentalCare Logo */}

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Activity className="h-5 w-5" />
              </div>

              <div className="leading-tight">
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  DentalCare
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "رعاية أسنانك"
                    : "Dental Care Platform"}
                </p>
              </div>
            </div>
          </div>

          {/* Language + Theme */}

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
                {isArabic ? "English" : "العربية"}
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

          </div>
        </div>
      </header>

      {/* ========================================
          Page Content
      ======================================== */}

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">

        {/* ========================================
            Error
        ======================================== */}

        {error && (
          <div
            className={`mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            {error}
          </div>
        )}

        {/* ========================================
            Patient Selector
        ======================================== */}

        {patients.length >= 2 && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <label
              className={`mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
            >
              {isArabic
                ? "اختر الملف الطبي"
                : "Select medical file"}
            </label>

            <select
              value={selectedPatientId}
              onChange={(event) => {
                setSelectedPatientId(
                  event.target.value
                );
                setFilter("all");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-900"
            >
              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ========================================
            Status Filters
        ======================================== */}

        <div className="mb-6">

          <h2
            className={`mb-3 text-lg font-semibold text-slate-900 dark:text-white ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            {isArabic
              ? "حالة المواعيد"
              : "Appointment Status"}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            {(
              [
                "all",
                "pending",
                "confirmed",
                "completed",
                "cancelled",
              ] as FilterType[]
            ).map((status) => {

              const active =
                filter === status;

              const activeClasses: Record<
                FilterType,
                string
              > = {
                all:
                  "bg-teal-600 text-white",
                pending:
                  "bg-yellow-500 text-white",
                confirmed:
                  "bg-green-600 text-white",
                completed:
                  "bg-blue-600 text-white",
                cancelled:
                  "bg-red-600 text-white",
              };

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setFilter(status)
                  }
                  className={`rounded-2xl p-4 shadow-sm transition ${
                    isArabic
                      ? "text-right"
                      : "text-left"
                  } ${
                    active
                      ? activeClasses[status]
                      : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {filterLabels[status]}
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {counts[status]}
                  </p>
                </button>
              );
            })}

          </div>
        </div>

        {/* ========================================
            Appointments Card
        ======================================== */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">

          <div
            className={`flex flex-col gap-2 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic
                  ? "قائمة المواعيد"
                  : "Appointment List"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "هنا تظهر المواعيد الخاصة بك فقط، سواء حجزتها بنفسك أو حددها لك الطبيب."
                  : "Only your appointments are shown here, whether you booked them yourself or your doctor scheduled them for you."}
              </p>
            </div>

            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic
                ? `عرض ${
                    filteredAppointments.length
                  } ${
                    filteredAppointments.length ===
                    1
                      ? "موعد"
                      : "مواعيد"
                  }`
                : `Showing ${
                    filteredAppointments.length
                  } appointment${
                    filteredAppointments.length !==
                    1
                      ? "s"
                      : ""
                  }`}
            </div>
          </div>

          {/* ========================================
              No Appointments
          ======================================== */}

          {filteredAppointments.length ===
          0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Calendar className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="font-semibold text-slate-800 dark:text-white">
                {appointments.length ===
                0
                  ? isArabic
                    ? "لا توجد مواعيد بعد"
                    : "No appointments yet"
                  : isArabic
                  ? "لا توجد مواعيد"
                  : "No appointments found"}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {appointments.length ===
                0
                  ? isArabic
                    ? "لا توجد مواعيد مرتبطة بحسابك حاليًا."
                    : "There are currently no appointments linked to your account."
                  : isArabic
                  ? "لا توجد مواعيد بهذه الحالة."
                  : "There are no appointments with this status."}
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

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
                        ? "العيادة"
                        : "Clinic"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "التاريخ"
                        : "Date"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الوقت"
                        : "Time"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "نوع الموعد"
                        : "Type"}
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
                        ? "ملاحظات"
                        : "Notes"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredAppointments.map(
                    (appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >

                        <td
                          className={`px-6 py-5 font-semibold text-slate-900 dark:text-white ${
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {appointment.clinics
                            ?.name ||
                            t.common
                              .dentalClinic}
                        </td>

                        <td
                          className={`px-6 py-5 text-slate-600 dark:text-slate-300 ${
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {formatDate(
                            appointment.appointment_date
                          )}
                        </td>

                        <td
                          className={`px-6 py-5 text-slate-600 dark:text-slate-300 ${
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {formatTime(
                            appointment.appointment_time
                          )}
                        </td>

                        <td
                          className={`px-6 py-5 ${
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getAppointmentTypeStyle(
                              appointment.appointment_type,
                              appointment.created_by
                            )}`}
                          >
                            {formatAppointmentType(
                              appointment.appointment_type,
                              appointment.created_by
                            )}
                          </span>
                        </td>

                        <td
                          className={`px-6 py-5 ${
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                              appointment.status
                            )}`}
                          >
                            {formatStatus(
                              appointment.status
                            )}
                          </span>
                        </td>

                        <td
                          className={`max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300 ${
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {appointment.notes ||
                            "-"}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PatientAppointments;



