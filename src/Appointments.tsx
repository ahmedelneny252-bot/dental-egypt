import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type PatientInfo = {
  name: string;
  phone: string | null;
};

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  patient_id: string;
  clinic_id: string;
  patient: PatientInfo | null;
};

const Appointments = () => {
  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);

  const [clinicId, setClinicId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // Language
  // =========================

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage =
      localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      setLanguage(
        savedLanguage === "en" ? "en" : "ar"
      );
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

  // =========================
  // Format Date
  // =========================

  const formatDate = (date: string) => {
    try {
      return new Intl.DateTimeFormat(
        isArabic ? "ar-EG" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ).format(new Date(`${date}T00:00:00`));
    } catch {
      return date;
    }
  };

  // =========================
  // Get Doctor Clinic
  // =========================

  const getClinic = async () => {
    setLoading(true);
    setError("");

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

    await loadAppointments(profile.clinic_id);
  };

  // =========================
  // Load Appointments
  // =========================

  const loadAppointments = async (
    clinicIdValue: string
  ) => {
    const {
      data,
      error: appointmentsError,
    } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        patient_id,
        clinic_id,
        patients (
          name,
          phone
        )
      `)
      .eq("clinic_id", clinicIdValue)
      .order("appointment_date", {
        ascending: true,
      })
      .order("appointment_time", {
        ascending: true,
      });

    if (appointmentsError) {
      console.error(appointmentsError);

      setError(appointmentsError.message);
      setLoading(false);

      return;
    }

    /*
      We intentionally do not rely on the generated
      Supabase TypeScript type for patients here.
      The database relationship may be generated as
      an object or an array depending on the schema.
    */

    const formattedAppointments: Appointment[] = (
      data ?? []
    ).map((item) => {
      const row = item as unknown as {
        id: string;
        appointment_date: string;
        appointment_time: string;
        status: string;
        notes: string | null;
        patient_id: string;
        clinic_id: string;
        patients:
          | {
              name: string;
              phone: string | null;
            }
          | {
              name: string;
              phone: string | null;
            }[]
          | null;
      };

      let patient: PatientInfo | null = null;

      if (Array.isArray(row.patients)) {
        if (row.patients.length > 0) {
          patient = {
            name: row.patients[0].name,
            phone: row.patients[0].phone,
          };
        }
      } else if (row.patients) {
        patient = {
          name: row.patients.name,
          phone: row.patients.phone,
        };
      }

      return {
        id: row.id,
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time,
        status: row.status as AppointmentStatus,
        notes: row.notes,
        patient_id: row.patient_id,
        clinic_id: row.clinic_id,
        patient,
      };
    });

    setAppointments(formattedAppointments);
    setLoading(false);
  };

  // =========================
  // Initial Load
  // =========================

  useEffect(() => {
    getClinic();
  }, []);

  // =========================
  // Appointment Action
  // =========================

  const handleAppointmentAction = async (
    appointment: Appointment,
    action: "confirm" | "cancel"
  ) => {
    if (!clinicId) {
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(appointment.id);

    const newStatus: AppointmentStatus =
      action === "confirm"
        ? "confirmed"
        : "cancelled";

    // =========================
    // Update Appointment
    // =========================

    const {
      data: updatedAppointment,
      error: updateError,
    } = await supabase
      .from("appointments")
      .update({
        status: newStatus,
      })
      .eq("id", appointment.id)
      .eq("clinic_id", clinicId)
      .select(`
        id,
        appointment_date,
        appointment_time,
        patient_id,
        clinic_id,
        status
      `)
      .single();

    if (updateError || !updatedAppointment) {
      console.error(updateError);

      setError(
        updateError?.message ||
          (isArabic
            ? "تعذر تحديث حالة الموعد."
            : "Could not update appointment status.")
      );

      setActionLoading(null);

      return;
    }

    // =========================
    // Patient Notification
    // =========================

    const patientName =
      appointment.patient?.name ||
      (isArabic ? "المريض" : "Patient");

    const formattedDate = formatDate(
      appointment.appointment_date
    );

    const notificationTitle =
      action === "confirm"
        ? isArabic
          ? "تم قبول موعدك"
          : "Your Appointment Was Confirmed"
        : isArabic
        ? "تم رفض موعدك"
        : "Your Appointment Was Rejected";

    const notificationMessage =
      action === "confirm"
        ? isArabic
          ? `مرحبًا ${patientName}، تم قبول موعدك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
          : `Hello ${patientName}, your appointment on ${formattedDate} at ${appointment.appointment_time} has been confirmed.`
        : isArabic
        ? `مرحبًا ${patientName}، نعتذر، تم رفض موعدك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
        : `Hello ${patientName}, unfortunately your appointment on ${formattedDate} at ${appointment.appointment_time} has been rejected.`;

    const {
      error: notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        clinic_id: clinicId,
        patient_id: updatedAppointment.patient_id,
        appointment_id: updatedAppointment.id,
        title: notificationTitle,
        message: notificationMessage,
        is_read: false,
        recipient_type: "patient",
      });

    if (notificationError) {
      console.error(
        "Notification error:",
        notificationError
      );

      setError(
        isArabic
          ? "تم تحديث الموعد، لكن تعذر إرسال إشعار للمريض."
          : "Appointment updated, but the patient notification could not be sent."
      );
    } else {
      setSuccess(
        action === "confirm"
          ? isArabic
            ? "تم قبول الموعد وإرسال إشعار للمريض."
            : "Appointment confirmed and the patient was notified."
          : isArabic
          ? "تم رفض الموعد وإرسال إشعار للمريض."
          : "Appointment rejected and the patient was notified."
      );
    }

    // =========================
    // Update UI
    // =========================

    setAppointments((currentAppointments) =>
      currentAppointments.map((item) =>
        item.id === appointment.id
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    setActionLoading(null);
  };

  // =========================
  // Status Label
  // =========================

  const getStatusLabel = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case "pending":
        return isArabic
          ? "في انتظار الموافقة"
          : "Pending";

      case "confirmed":
        return isArabic
          ? "تم التأكيد"
          : "Confirmed";

      case "completed":
        return isArabic
          ? "مكتمل"
          : "Completed";

      case "cancelled":
        return isArabic
          ? "مرفوض"
          : "Rejected";

      default:
        return status;
    }
  };

  // =========================
  // Status Classes
  // =========================

  const getStatusClasses = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";

      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";

      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";

      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center pt-28"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل المواعيد..."
            : "Loading appointments..."}
        </p>
      </div>
    );
  }

  // =========================
  // Page
  // =========================

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-12 px-6"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "المواعيد"
                : "Appointments"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "إدارة مواعيد المرضى وطلبات الحجز."
                : "Manage patient appointments and booking requests."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              loadAppointments(clinicId);
            }}
            className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
          >
            {isArabic
              ? "تحديث المواعيد"
              : "Refresh Appointments"}
          </button>

        </div>

        {/* Messages */}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 dark:bg-green-950/30 p-4 text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Statistics */}

        <div className="mb-8 grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "كل المواعيد"
                : "All Appointments"}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {appointments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "طلبات معلقة"
                : "Pending Requests"}
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {
                appointments.filter(
                  (appointment) =>
                    appointment.status ===
                    "pending"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "مواعيد مؤكدة"
                : "Confirmed"}
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                appointments.filter(
                  (appointment) =>
                    appointment.status ===
                    "confirmed"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "مواعيد مرفوضة"
                : "Rejected"}
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {
                appointments.filter(
                  (appointment) =>
                    appointment.status ===
                    "cancelled"
                ).length
              }
            </p>
          </div>

        </div>

        {/* Appointments */}

        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm">

          <div className="border-b border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isArabic
                ? "قائمة المواعيد"
                : "Appointment List"}
            </h2>
          </div>

          {appointments.length === 0 ? (
            <div className="p-12 text-center">

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد مواعيد حتى الآن."
                  : "No appointments yet."}
              </p>

              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {isArabic
                  ? "عندما يحجز مريض موعدًا سيظهر هنا."
                  : "When a patient books an appointment, it will appear here."}
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 dark:bg-slate-800">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "المريض"
                        : "Patient"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الهاتف"
                        : "Phone"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "التاريخ"
                        : "Date"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الوقت"
                        : "Time"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الحالة"
                        : "Status"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الملاحظات"
                        : "Notes"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الإجراء"
                        : "Action"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {appointments.map(
                    (appointment) => {

                      const isPending =
                        appointment.status ===
                        "pending";

                      const isProcessing =
                        actionLoading ===
                        appointment.id;

                      return (
                        <tr
                          key={appointment.id}
                          className="border-t border-slate-100 dark:border-slate-800"
                        >

                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {appointment.patient
                                ?.name ||
                                (isArabic
                                  ? "مريض غير معروف"
                                  : "Unknown Patient")}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-slate-600 dark:text-slate-300">
                            {appointment.patient
                              ?.phone || "-"}
                          </td>

                          <td className="px-6 py-5 text-slate-600 dark:text-slate-300">
                            {formatDate(
                              appointment.appointment_date
                            )}
                          </td>

                          <td className="px-6 py-5 font-medium text-slate-700 dark:text-slate-200">
                            {appointment.appointment_time}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                                appointment.status
                              )}`}
                            >
                              {getStatusLabel(
                                appointment.status
                              )}
                            </span>
                          </td>

                          <td className="max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300">
                            {appointment.notes ||
                              "-"}
                          </td>

                          <td className="px-6 py-5">

                            {isPending ? (
                              <div className="flex flex-col gap-2 sm:flex-row">

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleAppointmentAction(
                                      appointment,
                                      "confirm"
                                    )
                                  }
                                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? "..."
                                    : isArabic
                                    ? "قبول"
                                    : "Accept"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleAppointmentAction(
                                      appointment,
                                      "cancel"
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? "..."
                                    : isArabic
                                    ? "رفض"
                                    : "Reject"}
                                </button>

                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 dark:text-slate-500">
                                {isArabic
                                  ? "لا يوجد إجراء"
                                  : "No action"}
                              </span>
                            )}

                          </td>

                        </tr>
                      );
                    }
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

export default Appointments;
