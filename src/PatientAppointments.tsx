import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
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
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
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

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  // ============================================
  // Load appointments
  // ============================================

  const loadPatientAppointments = async (
    showRefreshLoader = false
  ) => {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // ==========================================
      // Get logged-in user
      // ==========================================

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
        window.location.href = "/patient/login";
        return;
      }

      // ==========================================
      // Get ALL patient records for this user
      // ==========================================
      //
      // IMPORTANT:
      // Do NOT use .single() or .maybeSingle()
      // because one user can have multiple patient
      // records due to previous bookings.
      //

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

      // ==========================================
      // No patient records
      // ==========================================

      if (!patientData || patientData.length === 0) {
        setError(
          isArabic
            ? "حساب المريض الخاص بك غير مرتبط بسجل مريض."
            : "Your patient account is not connected to a patient record."
        );

        return;
      }

      // ==========================================
      // Keep the first patient as the displayed name
      // ==========================================

      setPatient(patientData[0]);

      // ==========================================
      // Get ALL patient IDs
      // ==========================================

      const patientIds = patientData.map(
        (patient) => patient.id
      );

      // ==========================================
      // Load ALL appointments for all patient records
      // ==========================================

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
          clinics (
            name
          )
        `)
        .in("patient_id", patientIds)
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

        return;
      }

      // ==========================================
      // Format appointments
      // ==========================================

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================
  // Initial load
  // ============================================

  useEffect(() => {
    loadPatientAppointments();
  }, []);

  // ============================================
  // Clear error after language change
  // ============================================

  useEffect(() => {
    setError("");
  }, [language]);

  // ============================================
  // Logout
  // ============================================

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/patient/login";
  };

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
  // Date formatting
  // ============================================

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(`${date}T00:00:00`);

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

  const filterLabels: Record<FilterType, string> = {
    all: isArabic ? "الكل" : "All",
    pending: isArabic ? "قيد الانتظار" : "Pending",
    confirmed: isArabic ? "مؤكد" : "Confirmed",
    completed: isArabic ? "مكتمل" : "Completed",
    cancelled: isArabic ? "ملغي" : "Cancelled",
  };

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24 dark:bg-slate-950"
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
      className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 dark:bg-slate-950 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Patient Information */}

            <div
              className={
                isArabic
                  ? "text-right"
                  : "text-left"
              }
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
                {isArabic
                  ? "بوابة المريض"
                  : "Patient Portal"}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {t.appointment.bookTitle ===
                "حجز موعد"
                  ? "مواعيدي"
                  : "My Appointments"}
              </h1>

              {patient && (
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                  {isArabic
                    ? "مرحباً، "
                    : "Welcome, "}

                  <span className="font-semibold text-slate-900 dark:text-white">
                    {patient.name}
                  </span>
                </p>
              )}
            </div>

            {/* Actions */}

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/patient/notifications"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                🔔 {t.common.notifications}
              </Link>

              <button
                type="button"
                onClick={() =>
                  loadPatientAppointments(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {refreshing
                  ? isArabic
                    ? "جاري التحديث..."
                    : "Refreshing..."
                  : isArabic
                  ? "↻ تحديث"
                  : "↻ Refresh"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                {t.auth.logout}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}

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

        {/* Status Filters */}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              all: "bg-teal-600 text-white",
              pending: "bg-yellow-500 text-white",
              confirmed: "bg-green-600 text-white",
              completed: "bg-blue-600 text-white",
              cancelled: "bg-red-600 text-white",
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

        {/* Appointments Card */}

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
                  ? "مواعيدك"
                  : "Your Appointments"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "عرض حالة وتفاصيل مواعيدك."
                  : "View the status and details of your appointments."}
              </p>
            </div>

            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic
                ? `عرض ${filteredAppointments.length} ${
                    filteredAppointments.length === 1
                      ? "موعد"
                      : "مواعيد"
                  }`
                : `Showing ${filteredAppointments.length} appointment${
                    filteredAppointments.length !== 1
                      ? "s"
                      : ""
                  }`}
            </div>
          </div>

          {/* No Appointments */}

          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <span className="text-2xl">
                  📅
                </span>
              </div>

              <h3 className="font-semibold text-slate-800 dark:text-white">
                {appointments.length === 0
                  ? isArabic
                    ? "لا توجد مواعيد بعد"
                    : "No appointments yet"
                  : isArabic
                  ? "لا توجد مواعيد"
                  : "No appointments found"}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {appointments.length === 0
                  ? isArabic
                    ? "ليس لديك أي مواعيد حتى الآن."
                    : "You don't have any appointments yet."
                  : isArabic
                  ? "لا توجد مواعيد بهذه الحالة."
                  : "There are no appointments with this status."}
              </p>

              {appointments.length === 0 && (
                <Link
                  to="/clinics"
                  className="mt-5 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700"
                >
                  {t.common.findClinic}
                </Link>
              )}
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
                          {appointment.clinics?.name ||
                            t.common.dentalClinic}
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
                          {appointment.notes || "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;



