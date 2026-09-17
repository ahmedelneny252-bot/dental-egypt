import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  Calendar,
  User,
  X,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment_id: string | null;
  patient_id: string | null;
};

type AppointmentAction = "confirm" | "reject";

const DoctorNotifications = () => {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("");

  const [processingAppointments, setProcessingAppointments] =
    useState<Record<string, boolean>>({});

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage =
      localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // Listen for language changes
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

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        setError(userError.message);
        return;
      }

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, name, email, clinic_id")
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

      const currentClinicId = profile.clinic_id;

      setClinicId(currentClinicId);

      const {
        data,
        error: notificationError,
      } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          is_read,
          created_at,
          appointment_id,
          patient_id
        `)
        .eq("clinic_id", currentClinicId)
        .order("created_at", {
          ascending: false,
        });

      if (notificationError) {
        console.error(
          "Notification error:",
          notificationError
        );

        setError(
          isArabic
            ? `تعذر تحميل الإشعارات: ${notificationError.message}`
            : `Could not load notifications: ${notificationError.message}`
        );
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error(
        "Load doctor notifications error:",
        error
      );

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

  const markAsRead = async (
    notificationId: string
  ) => {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notificationId);

    if (error) {
      console.error(
        "Mark notification error:",
        error
      );
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
            }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    if (!clinicId) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("clinic_id", clinicId)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Mark all notifications error:",
        error
      );
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  };

  const handleAppointmentAction = async (
    notification: Notification,
    action: AppointmentAction
  ) => {
    if (
      !notification.appointment_id ||
      !notification.patient_id ||
      !clinicId
    ) {
      return;
    }

    const appointmentId = notification.appointment_id;

    setProcessingAppointments((current) => ({
      ...current,
      [appointmentId]: true,
    }));

    setError("");

    try {
      /*
       * confirm = accepted appointment
       * reject = cancelled appointment
       */
      const newStatus =
        action === "confirm"
          ? "confirmed"
          : "cancelled";

      const {
        data: updatedAppointment,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .update({
          status: newStatus,
        })
        .eq("id", appointmentId)
        .eq("clinic_id", clinicId)
        .select("id, patient_id, clinic_id")
        .maybeSingle();

      if (appointmentError) {
        console.error(
          "Update appointment error:",
          appointmentError
        );

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
            ? "لم يتم العثور على الموعد أو لا تملك العيادة صلاحية تعديله."
            : "Appointment not found or you do not have permission to update it."
        );

        return;
      }

      const notificationTitle =
        action === "confirm"
          ? isArabic
            ? "تم قبول موعدك"
            : "Your appointment was confirmed"
          : isArabic
            ? "تم رفض موعدك"
            : "Your appointment was rejected";

      const notificationMessage =
        action === "confirm"
          ? isArabic
            ? "وافقت العيادة على طلب حجز الموعد الخاص بك."
            : "The clinic has accepted your appointment request."
          : isArabic
            ? "رفضت العيادة طلب حجز الموعد الخاص بك."
            : "The clinic has rejected your appointment request.";

      /*
       * Send response notification to the patient.
       */
      const {
        error: patientNotificationError,
      } = await supabase
        .from("notifications")
        .insert({
          clinic_id: clinicId,
          patient_id: updatedAppointment.patient_id,
          appointment_id: updatedAppointment.id,
          title: notificationTitle,
          message: notificationMessage,
          is_read: false,
        });

      if (patientNotificationError) {
        console.error(
          "Patient notification error:",
          patientNotificationError
        );

        setError(
          isArabic
            ? `تم تحديث حالة الموعد، لكن تعذر إرسال إشعار للمريض: ${patientNotificationError.message}`
            : `Appointment updated, but the patient notification could not be sent: ${patientNotificationError.message}`
        );

        return;
      }

      /*
       * Mark the doctor's original notification as read.
       */
      const {
        error: markReadError,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notification.id);

      if (markReadError) {
        console.error(
          "Mark notification as read error:",
          markReadError
        );
      }

      /*
       * Update the notification locally.
       */
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Appointment action error:",
        error
      );

      setError(
        isArabic
          ? "حدث خطأ أثناء معالجة طلب الموعد."
          : "Something went wrong while processing the appointment."
      );
    } finally {
      setProcessingAppointments((current) => ({
        ...current,
        [appointmentId]: false,
      }));
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(
      isArabic ? "ar-EG" : "en-EG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center pt-28"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل الإشعارات..."
            : "Loading notifications..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12"
    >
      <div className="mx-auto max-w-4xl px-6">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/50">
                <Bell className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {t.common.notifications}
                </h1>

                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {isArabic
                    ? "إشعارات مواعيد العيادة"
                    : "Clinic appointment notifications"}
                </p>
              </div>

            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              <Check className="h-5 w-5" />

              {isArabic
                ? "تحديد الكل كمقروء"
                : "Mark All as Read"}
            </button>
          )}

        </div>

        {/* Error */}

        {error && (
          <div
            className={`mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-red-600 dark:text-red-400 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {error}
          </div>
        )}

        {/* No Notifications */}

        {notifications.length === 0 && !error ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-800 dark:text-white">
              {isArabic
                ? "لا توجد إشعارات"
                : "No notifications"}
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {isArabic
                ? "لا توجد إشعارات لعيادتك حتى الآن."
                : "Your clinic has no notifications yet."}
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {notifications.map((notification) => {
              const isAppointmentRequest =
                Boolean(notification.appointment_id);

              const isProcessing =
                notification.appointment_id
                  ? Boolean(
                      processingAppointments[
                        notification.appointment_id
                      ]
                    )
                  : false;

              return (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    notification.is_read
                      ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      : "border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/30"
                  }`}
                >

                  <div className="flex items-start gap-4">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        notification.is_read
                          ? "bg-slate-100 dark:bg-slate-800"
                          : "bg-teal-100 dark:bg-teal-950/60"
                      }`}
                    >
                      <Bell
                        className={`h-5 w-5 ${
                          notification.is_read
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-teal-600 dark:text-teal-400"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {notification.title}
                          </h3>

                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {notification.message}
                          </p>
                        </div>

                        {!notification.is_read && (
                          <span className="w-fit rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                            {isArabic ? "جديد" : "New"}
                          </span>
                        )}

                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">

                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />

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

                      {/* Appointment Actions */}

                      {isAppointmentRequest &&
                        notification.is_read === false && (
                          <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">

                            <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                              {isArabic
                                ? "هل تريد قبول طلب الموعد أم رفضه؟"
                                : "Would you like to accept or reject this appointment request?"}
                            </p>

                            <div className="flex flex-wrap gap-3">

                              <button
                                type="button"
                                disabled={isProcessing}
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

                              <button
                                type="button"
                                disabled={isProcessing}
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

                      <div className="mt-4 flex flex-wrap gap-3">

                        {notification.appointment_id && (
                          <Link
                            to="/doctor/appointments"
                            className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                          >
                            {isArabic
                              ? "عرض الموعد"
                              : "View Appointment"}
                          </Link>
                        )}

                        {!notification.is_read && !isAppointmentRequest && (
                          <button
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
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
            })}

          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorNotifications;


