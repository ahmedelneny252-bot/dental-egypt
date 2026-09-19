import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
Bell,
Check,
Calendar,
User,
X,
Clock,
} from "lucide-react";
import { supabase } from "./supabase";
import {
translations,
type Language,
} from "./i18n";

type Notification = {
id: string;
title: string;
message: string;
is_read: boolean;
created_at: string;
appointment_id: string | null;
patient_id: string | null;
recipient_type:
| "doctor"
| "patient"
| null;
notification_type: string | null;
};

type AppointmentAction =
| "confirm"
| "reject";

type AppointmentType =
| "new_checkup"
| "follow_up"
| "xray"
| "unknown";

const DoctorNotifications = () => {
const [notifications, setNotifications] =
useState<Notification[]>([]);

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState("");

const [clinicId, setClinicId] =
useState("");

const [
processingAppointments,
setProcessingAppointments,
] = useState<Record<string, boolean>>({});

const [language, setLanguage] =
useState<Language>(() => {
const savedLanguage =
localStorage.getItem(
"dentalcare-language"
);


  return savedLanguage === "en"
    ? "en"
    : "ar";
});

const isArabic = language === "ar";
const t = translations[language];

// ============================================
// Language
// ============================================

useEffect(() => {
const handleLanguageChange = () => {
const savedLanguage =
localStorage.getItem(
"dentalcare-language"
);


  setLanguage(
    savedLanguage === "en"
      ? "en"
      : "ar"
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

// ============================================
// Get Appointment Type
// ============================================

const getAppointmentType = (
message: string
): AppointmentType => {
if (
message.includes("كشف جديد") ||
message.includes("New Checkup")
) {
return "new_checkup";
}


if (
  message.includes("إعادة") ||
  message.includes("Follow-up")
) {
  return "follow_up";
}

if (
  message.includes("أشعة") ||
  message.includes("X-ray")
) {
  return "xray";
}

return "unknown";


};

const getAppointmentTypeLabel = (
type: AppointmentType
) => {
if (type === "new_checkup") {
return isArabic
? "كشف جديد"
: "New Checkup";
}


if (type === "follow_up") {
  return isArabic
    ? "إعادة"
    : "Follow-up";
}

if (type === "xray") {
  return isArabic
    ? "أشعة"
    : "X-ray";
}

return isArabic
  ? "نوع غير محدد"
  : "Unknown Type";


};

// ============================================
// Load Notifications
// ============================================

const loadNotifications = async () => {
setLoading(true);
setError("");


try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    setError(userError.message);
    return;
  }

  if (!user) {
    window.location.href =
      "/doctor/login";
    return;
  }

  // ======================================
  // Doctor Profile
  // ======================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id, name, email, clinic_id"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    setError(
      isArabic
        ? `تعذر تحميل ملف الطبيب: ${profileError.message}`
        : `Could not load doctor profile: ${profileError.message}`
    );
    return;
  }

  if (!profile) {
    setError(
      isArabic
        ? "لم يتم العثور على ملف الطبيب."
        : "Doctor profile not found."
    );
    return;
  }

  if (!profile.clinic_id) {
    setError(
      isArabic
        ? "ملف الطبيب غير مرتبط بأي عيادة."
        : "This doctor profile does not have a clinic connected."
    );
    return;
  }

  const currentClinicId =
    profile.clinic_id;

  setClinicId(currentClinicId);

  // ======================================
  // Load ALL Doctor Notifications
  // ======================================
  //
  // IMPORTANT:
  // We intentionally do NOT filter by:
  // notification_type = appointment_request
  // or is_read = false.
  //
  // This keeps accepted/rejected notifications
  // visible as notification history.
  //

  const {
    data,
    error:
      notificationError,
  } = await supabase
    .from("notifications")
    .select(`
      id,
      title,
      message,
      is_read,
      created_at,
      appointment_id,
      patient_id,
      recipient_type,
      notification_type
    `)
    .eq(
      "clinic_id",
      currentClinicId
    )
    .eq(
      "recipient_type",
      "doctor"
    )
    .order("created_at", {
      ascending: false,
    });

  if (notificationError) {
    setError(
      isArabic
        ? `تعذر تحميل الإشعارات: ${notificationError.message}`
        : `Could not load notifications: ${notificationError.message}`
    );
    return;
  }

  setNotifications(
    (data || []) as Notification[]
  );
} catch (err) {
  console.error(err);

  setError(
    isArabic
      ? "حدث خطأ أثناء تحميل الإشعارات."
      : "Something went wrong while loading notifications."
  );
} finally {
  setLoading(false);
}


};

useEffect(() => {
loadNotifications();
}, []);

// ============================================
// Mark One Read
// ============================================

const markAsRead = async (
notificationId: string
) => {
const { error } =
await supabase
.from("notifications")
.update({
is_read: true,
})
.eq(
"id",
notificationId
)
.eq(
"recipient_type",
"doctor"
);


if (error) {
  console.error(error);
  setError(error.message);
  return;
}

// Keep the notification visible.
setNotifications(
  (current) =>
    current.map(
      (notification) =>
        notification.id ===
        notificationId
          ? {
              ...notification,
              is_read: true,
            }
          : notification
    )
);


};

// ============================================
// Mark All Read
// ============================================

const markAllAsRead = async () => {
if (!clinicId) {
return;
}


const { error } =
  await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq(
      "clinic_id",
      clinicId
    )
    .eq(
      "recipient_type",
      "doctor"
    )
    .eq(
      "is_read",
      false
    );

if (error) {
  console.error(error);
  setError(error.message);
  return;
}

// Keep all notifications visible.
setNotifications(
  (current) =>
    current.map(
      (notification) => ({
        ...notification,
        is_read: true,
      })
    )
);


};

// ============================================
// Appointment Action
// ============================================

const handleAppointmentAction =
async (
notification: Notification,
action: AppointmentAction
) => {
if (
!notification.appointment_id ||
!notification.patient_id ||
!clinicId
) {
setError(
isArabic
? "بيانات طلب الموعد غير مكتملة."
: "Appointment request data is incomplete."
);
return;
}


  // Only pending appointment requests
  // can be accepted/rejected.
  if (
    notification.notification_type !==
    "appointment_request"
  ) {
    return;
  }

  const appointmentId =
    notification.appointment_id;

  setProcessingAppointments(
    (current) => ({
      ...current,
      [appointmentId]: true,
    })
  );

  setError("");

  try {
    // ======================================
    // 1. New Appointment Status
    // ======================================

    const newStatus =
      action === "confirm"
        ? "confirmed"
        : "cancelled";

    // ======================================
    // 2. Update Appointment
    // ======================================

    const {
      data:
        updatedAppointment,
      error:
        appointmentError,
    } = await supabase
      .from("appointments")
      .update({
        status: newStatus,
      })
      .eq(
        "id",
        appointmentId
      )
      .eq(
        "clinic_id",
        clinicId
      )
      .eq(
        "patient_id",
        notification.patient_id
      )
      .eq(
        "status",
        "pending"
      )
      .select(`
        id,
        patient_id,
        clinic_id,
        appointment_date,
        appointment_time,
        appointment_type,
        status
      `)
      .maybeSingle();

    if (appointmentError) {
      setError(
        isArabic
          ? `تعذر تحديث الموعد: ${appointmentError.message}`
          : `Could not update appointment: ${appointmentError.message}`
      );
      return;
    }

    if (!updatedAppointment) {
      setError(
        isArabic
          ? "هذا الموعد تم التعامل معه بالفعل أو لم يعد في حالة انتظار."
          : "This appointment has already been processed or is no longer pending."
      );

      // Refresh notifications in case another page
      // already processed the request.
      await loadNotifications();

      return;
    }

    // ======================================
    // 3. Appointment Type
    // ======================================

    const appointmentType =
      (updatedAppointment.appointment_type ||
        "new_checkup") as AppointmentType;

    const appointmentTypeLabel =
      getAppointmentTypeLabel(
        appointmentType
      );

    // ======================================
    // 4. Notification Type
    // ======================================

    const notificationType =
      action === "confirm"
        ? "appointment_confirmed"
        : "appointment_rejected";

    // ======================================
    // 5. Patient Notification
    // ======================================

    const patientNotificationTitle =
      action === "confirm"
        ? isArabic
          ? "تم قبول موعدك"
          : "Your appointment was confirmed"
        : isArabic
          ? "تم رفض موعدك"
          : "Your appointment was rejected";

    const appointmentDate =
      new Date(
        `${updatedAppointment.appointment_date}T00:00:00`
      ).toLocaleDateString(
        isArabic
          ? "ar-EG"
          : "en-US",
        {
          dateStyle: "medium",
        }
      );

    const patientNotificationMessage =
      action === "confirm"
        ? isArabic
          ? `تم قبول موعدك يوم ${appointmentDate} الساعة ${updatedAppointment.appointment_time}. نوع الحجز: ${appointmentTypeLabel}.`
          : `Your appointment on ${appointmentDate} at ${updatedAppointment.appointment_time} has been confirmed. Appointment type: ${appointmentTypeLabel}.`
        : isArabic
          ? `تم رفض موعدك يوم ${appointmentDate} الساعة ${updatedAppointment.appointment_time}. نوع الحجز: ${appointmentTypeLabel}.`
          : `Your appointment on ${appointmentDate} at ${updatedAppointment.appointment_time} has been rejected. Appointment type: ${appointmentTypeLabel}.`;

    const {
      error:
        patientNotificationError,
    } = await supabase
      .from("notifications")
      .insert({
        clinic_id:
          clinicId,

        patient_id:
          updatedAppointment.patient_id,

        appointment_id:
          updatedAppointment.id,

        title:
          patientNotificationTitle,

        message:
          patientNotificationMessage,

        is_read: false,

        recipient_type:
          "patient",

        notification_type:
          notificationType,
      });

    // ======================================
    // 6. Update SAME Doctor Notification
    // ======================================
    //
    // IMPORTANT:
    // We do NOT delete the notification.
    //
    // We change:
    // appointment_request
    // ->
    // appointment_confirmed / appointment_rejected
    //
    // and mark it as read.
    //

    const doctorNotificationTitle =
      action === "confirm"
        ? isArabic
          ? "تم قبول الموعد"
          : "Appointment Accepted"
        : isArabic
          ? "تم رفض الموعد"
          : "Appointment Rejected";

    const doctorNotificationMessage =
      action === "confirm"
        ? isArabic
          ? `تم قبول موعد المريض يوم ${appointmentDate} الساعة ${updatedAppointment.appointment_time}.`
          : `The patient's appointment on ${appointmentDate} at ${updatedAppointment.appointment_time} has been accepted.`
        : isArabic
          ? `تم رفض موعد المريض يوم ${appointmentDate} الساعة ${updatedAppointment.appointment_time}.`
          : `The patient's appointment on ${appointmentDate} at ${updatedAppointment.appointment_time} has been rejected.`;

    const {
      data:
        updatedDoctorNotification,
      error:
        doctorNotificationError,
    } = await supabase
      .from("notifications")
      .update({
        title:
          doctorNotificationTitle,

        message:
          doctorNotificationMessage,

        is_read: true,

        notification_type:
          notificationType,
      })
      .eq(
        "id",
        notification.id
      )
      .eq(
        "clinic_id",
        clinicId
      )
      .eq(
        "recipient_type",
        "doctor"
      )
      .eq(
        "notification_type",
        "appointment_request"
      )
      .select(`
        id,
        title,
        message,
        is_read,
        created_at,
        appointment_id,
        patient_id,
        recipient_type,
        notification_type
      `)
      .maybeSingle();

    if (doctorNotificationError) {
      console.error(
        "Doctor notification update error:",
        doctorNotificationError
      );
    }

    // ======================================
    // 7. Update Notification On Screen
    // ======================================

    setNotifications(
      (current) =>
        current.map(
          (item) => {
            if (
              item.id !==
              notification.id
            ) {
              return item;
            }

            return (
              updatedDoctorNotification || {
                ...item,

                title:
                  doctorNotificationTitle,

                message:
                  doctorNotificationMessage,

                is_read: true,

                notification_type:
                  notificationType,
              }
            );
          }
        )
    );

    // ======================================
    // 8. Show Patient Notification Warning
    // ======================================

    if (
      patientNotificationError
    ) {
      setError(
        isArabic
          ? `تم تحديث حالة الموعد وإشعار الدكتور، لكن تعذر إرسال إشعار للمريض: ${patientNotificationError.message}`
          : `The appointment and doctor notification were updated, but the patient notification could not be sent: ${patientNotificationError.message}`
      );

      return;
    }

    // ======================================
    // 9. Doctor Notification Warning
    // ======================================

    if (
      doctorNotificationError
    ) {
      setError(
        isArabic
          ? "تم تحديث الموعد وإرسال إشعار للمريض، لكن تعذر تحديث إشعار الدكتور."
          : "The appointment was updated and the patient was notified, but the doctor notification could not be updated."
      );

      return;
    }
  } catch (err) {
    console.error(err);

    setError(
      isArabic
        ? "حدث خطأ أثناء معالجة طلب الموعد."
        : "Something went wrong while processing the appointment."
    );
  } finally {
    setProcessingAppointments(
      (current) => ({
        ...current,
        [appointmentId]:
          false,
      })
    );
  }
};


// ============================================
// Helpers
// ============================================

const unreadCount =
notifications.filter(
(notification) =>
!notification.is_read
).length;

const formatDate = (
date: string
) => {
return new Date(
date
).toLocaleString(
isArabic
? "ar-EG"
: "en-EG",
{
dateStyle: "medium",
timeStyle: "short",
}
);
};

const getNotificationLabel = (
notificationType:
| string
| null
) => {
if (
notificationType ===
"appointment_confirmed"
) {
return isArabic
? "تم قبول الموعد"
: "Appointment Accepted";
}


if (
  notificationType ===
  "appointment_rejected"
) {
  return isArabic
    ? "تم رفض الموعد"
    : "Appointment Rejected";
}

if (
  notificationType ===
  "appointment_request"
) {
  return isArabic
    ? "طلب موعد جديد"
    : "New Appointment Request";
}

return isArabic
  ? "إشعار"
  : "Notification";


};

// ============================================
// Loading
// ============================================

if (loading) {
return (
<div
dir={isArabic ? "rtl" : "ltr"}
className="flex min-h-screen items-center justify-center bg-slate-50 pt-28 dark:bg-slate-950"
> <p className="text-slate-600 dark:text-slate-300">
{isArabic
? "جاري تحميل الإشعارات..."
: "Loading notifications..."} </p> </div>
);
}

// ============================================
// UI
// ============================================

return (
<div
dir={isArabic ? "rtl" : "ltr"}
className="min-h-screen bg-slate-50 pb-12 pt-28 dark:bg-slate-950"
> <div className="mx-auto max-w-4xl px-6">


    {/* Header */}

    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t.common.notifications}
            </h1>

            <p className="mt-1 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "طلبات وحالة مواعيد المرضى"
                : "Patient appointment requests and status"}
            </p>
          </div>
        </div>
      </div>

      {unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          <Check className="h-5 w-5" />

          {isArabic
            ? `تحديد الكل كمقروء (${unreadCount})`
            : `Mark All as Read (${unreadCount})`}
        </button>
      )}
    </div>

    {/* Error */}

    {error && (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
        {error}
      </div>
    )}

    {/* Empty State */}

    {notifications.length === 0 &&
    !error ? (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Bell className="h-8 w-8 text-slate-400" />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-slate-800 dark:text-white">
          {isArabic
            ? "لا توجد إشعارات"
            : "No notifications"}
        </h2>

        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {isArabic
            ? "لا توجد إشعارات حاليًا."
            : "There are no notifications right now."}
        </p>
      </div>
    ) : (
      <div className="space-y-4">

        {notifications.map(
          (notification) => {
            const isProcessing =
              notification.appointment_id
                ? Boolean(
                    processingAppointments[
                      notification
                        .appointment_id
                    ]
                  )
                : false;

            const isAppointmentRequest =
              notification.notification_type ===
              "appointment_request";

            const appointmentType =
              getAppointmentType(
                notification.message
              );

            const appointmentTypeLabel =
              getAppointmentTypeLabel(
                appointmentType
              );

            const isConfirmed =
              notification.notification_type ===
              "appointment_confirmed";

            const isRejected =
              notification.notification_type ===
              "appointment_rejected";

            return (
              <div
                key={
                  notification.id
                }
                className={`rounded-2xl border p-5 shadow-sm ${
                  isConfirmed
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : isRejected
                      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                      : notification.is_read
                        ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                        : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                }`}
              >
                <div className="flex items-start gap-4">

                  {/* Icon */}

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      isConfirmed
                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                        : isRejected
                          ? "bg-red-100 dark:bg-red-900/50"
                          : "bg-blue-100 dark:bg-blue-900/50"
                    }`}
                  >
                    {isConfirmed ? (
                      <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    ) : isRejected ? (
                      <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">

                    {/* Header */}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>

                        <div
                          className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                            isConfirmed
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : isRejected
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : notification.is_read
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />

                          {getNotificationLabel(
                            notification.notification_type
                          )}
                        </div>

                        {/* Appointment Type */}

                        {isAppointmentRequest && (
                          <div className="mb-3">
                            <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                              {isArabic
                                ? "نوع الحجز: "
                                : "Type: "}

                              {
                                appointmentTypeLabel
                              }
                            </span>
                          </div>
                        )}

                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {
                            notification.title
                          }
                        </h3>

                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                          {
                            notification.message
                          }
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          notification.is_read
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {notification.is_read
                          ? isArabic
                            ? "مقروء"
                            : "Read"
                          : isArabic
                            ? "جديد"
                            : "New"}
                      </span>
                    </div>

                    {/* Date + Patient */}

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">

                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />

                        {formatDate(
                          notification.created_at
                        )}
                      </span>

                      {notification.patient_id && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-4 w-4" />

                          {isArabic
                            ? "طلب من مريض"
                            : "Patient request"}
                        </span>
                      )}

                    </div>

                    {/* Accept / Reject */}

                    {notification.appointment_id &&
                      isAppointmentRequest && (
                        <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 dark:border-blue-900 dark:bg-slate-900">

                          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {isArabic
                              ? "هل تريد قبول طلب الموعد أم رفضه؟"
                              : "Would you like to accept or reject this appointment request?"}
                          </p>

                          <div className="flex flex-wrap gap-3">

                            {/* Accept */}

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleAppointmentAction(
                                  notification,
                                  "confirm"
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />

                              {isProcessing
                                ? isArabic
                                  ? "جاري المعالجة..."
                                  : "Processing..."
                                : isArabic
                                  ? "قبول الموعد"
                                  : "Accept Appointment"}
                            </button>

                            {/* Reject */}

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleAppointmentAction(
                                  notification,
                                  "reject"
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />

                              {isProcessing
                                ? isArabic
                                  ? "جاري المعالجة..."
                                  : "Processing..."
                                : isArabic
                                  ? "رفض الموعد"
                                  : "Reject Appointment"}
                            </button>

                          </div>
                        </div>
                      )}

                    {/* Status Message */}

                    {isConfirmed && (
                      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-5 w-5" />

                          {isArabic
                            ? "تم قبول هذا الموعد."
                            : "This appointment has been accepted."}
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                        <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
                          <X className="h-5 w-5" />

                          {isArabic
                            ? "تم رفض هذا الموعد."
                            : "This appointment has been rejected."}
                        </div>
                      </div>
                    )}

                    {/* Actions */}

                    <div className="mt-4 flex flex-wrap gap-3">

                      {notification.appointment_id && (
                        <Link
                          to="/doctor/appointments"
                          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          {isArabic
                            ? "عرض المواعيد"
                            : "View Appointments"}
                        </Link>
                      )}

                      {/* Mark as Read */}

                      {!notification.is_read && (
                        <button
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Check className="h-4 w-4" />

                          {isArabic
                            ? "تحديد كمقروء"
                            : "Mark as Read"}
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              </div>
            );
          }
        )}

      </div>
    )}
  </div>
</div>


);
};

export default DoctorNotifications;







