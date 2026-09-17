import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Calendar,
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
  recipient_type:
    | "doctor"
    | "patient"
    | null;

  notification_type:
    | "appointment_request"
    | "appointment_confirmed"
    | "appointment_rejected"
    | null;
};

const PatientNotifications = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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
  // Notification Type
  // ============================================

  const getNotificationType = (
    notification: Notification
  ) => {
    if (
      notification.notification_type ===
      "appointment_confirmed"
    ) {
      return "confirmed";
    }

    if (
      notification.notification_type ===
      "appointment_rejected"
    ) {
      return "rejected";
    }

    if (
      notification.notification_type ===
      "appointment_request"
    ) {
      return "request";
    }

    // Old notifications fallback
    const title =
      notification.title.toLowerCase();

    if (
      title.includes("رفض") ||
      title.includes("rejected")
    ) {
      return "rejected";
    }

    if (
      title.includes("قبول") ||
      title.includes("confirmed")
    ) {
      return "confirmed";
    }

    if (
      title.includes("طلب") ||
      title.includes("request")
    ) {
      return "request";
    }

    return "general";
  };

  // ============================================
  // Appointment Type From Message
  // ============================================

  const getAppointmentType = (
    message: string
  ) => {
    if (
      message.includes("كشف جديد") ||
      message.includes("New Checkup")
    ) {
      return isArabic
        ? "كشف جديد"
        : "New Checkup";
    }

    if (
      message.includes("إعادة") ||
      message.includes("Follow-up")
    ) {
      return isArabic
        ? "إعادة"
        : "Follow-up";
    }

    if (
      message.includes("أشعة") ||
      message.includes("X-ray")
    ) {
      return isArabic
        ? "أشعة"
        : "X-ray";
    }

    return null;
  };

  // ============================================
  // Load Notifications
  // ============================================

  const loadNotifications =
    async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href =
            "/patient/login";
          return;
        }

        // ======================================
        // All Patient Records
        // ======================================

        const {
          data: patients,
          error:
            patientError,
        } = await supabase
          .from("patients")
          .select("id")
          .eq(
            "user_id",
            user.id
          );

        if (patientError) {
          console.error(
            patientError
          );

          setError(
            patientError.message
          );

          return;
        }

        if (
          !patients ||
          patients.length === 0
        ) {
          setError(
            isArabic
              ? "حساب المريض الخاص بك غير مرتبط بسجل مريض."
              : "Your patient account is not connected to a patient record."
          );

          return;
        }

        const patientIds =
          patients.map(
            (patient) =>
              patient.id
          );

        // ======================================
        // ONLY Patient Notifications
        // ======================================

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
            recipient_type,
            notification_type
          `)
          .in(
            "patient_id",
            patientIds
          )
          .eq(
            "recipient_type",
            "patient"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (notificationError) {
          console.error(
            notificationError
          );

          setError(
            notificationError.message
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
          "patient"
        );

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

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
    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.is_read
      );

    if (
      unreadNotifications.length ===
      0
    ) {
      return;
    }

    const ids =
      unreadNotifications.map(
        (notification) =>
          notification.id
      );

    const { error } =
      await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .in("id", ids)
        .eq(
          "recipient_type",
          "patient"
        );

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

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
  // Date
  // ============================================

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString(
      isArabic
        ? "ar-EG"
        : "en-US"
    );
  };

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">
              {t.common.loading}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6"
    >
      <div className="mx-auto max-w-4xl">

        {/* Header */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
                {isArabic
                  ? "بوابة المريض"
                  : "Patient Portal"}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {t.common.notifications}
              </h1>

              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {unreadCount > 0
                  ? isArabic
                    ? `لديك ${unreadCount} إشعار غير مقروء.`
                    : `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                  : isArabic
                    ? "ليس لديك إشعارات غير مقروءة."
                    : "You have no unread notifications."}
              </p>
            </div>

            <button
              onClick={
                markAllAsRead
              }
              disabled={
                unreadCount === 0
              }
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              {isArabic
                ? "تحديد الكل كمقروء"
                : "Mark All as Read"}
            </button>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Notifications */}

        <div className="space-y-4">

          {notifications.length ===
          0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Bell className="h-8 w-8 text-slate-400" />
              </div>

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic
                  ? "لا توجد إشعارات"
                  : "No notifications"}
              </h2>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "ليس لديك أي إشعارات حتى الآن."
                  : "You don't have any notifications yet."}
              </p>

              <Link
                to="/patient/appointments"
                className="mt-6 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700"
              >
                {isArabic
                  ? "مواعيدي"
                  : "My Appointments"}
              </Link>
            </div>
          ) : (
            notifications.map(
              (notification) => {
                const notificationType =
                  getNotificationType(
                    notification
                  );

                const isConfirmed =
                  notificationType ===
                  "confirmed";

                const isRejected =
                  notificationType ===
                  "rejected";

                const isRequest =
                  notificationType ===
                  "request";

                const appointmentType =
                  getAppointmentType(
                    notification.message
                  );

                const iconBackground =
                  isConfirmed
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : isRejected
                      ? "bg-red-100 dark:bg-red-900/40"
                      : isRequest
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : "bg-slate-100 dark:bg-slate-800";

                const iconColor =
                  isConfirmed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isRejected
                      ? "text-red-600 dark:text-red-400"
                      : isRequest
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-500 dark:text-slate-400";

                const cardStyle =
                  isConfirmed
                    ? notification.is_read
                      ? "border-emerald-200 bg-white dark:border-emerald-900/50 dark:bg-slate-900"
                      : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : isRejected
                      ? notification.is_read
                        ? "border-red-200 bg-white dark:border-red-900/50 dark:bg-slate-900"
                        : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                      : isRequest
                        ? notification.is_read
                          ? "border-blue-200 bg-white dark:border-blue-900/50 dark:bg-slate-900"
                          : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                        : notification.is_read
                          ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                          : "border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/30";

                return (
                  <div
                    key={
                      notification.id
                    }
                    className={`rounded-2xl border p-6 shadow-sm transition ${cardStyle}`}
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex gap-4">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBackground}`}
                        >
                          {isConfirmed ? (
                            <CheckCircle2
                              className={`h-6 w-6 ${iconColor}`}
                            />
                          ) : isRejected ? (
                            <XCircle
                              className={`h-6 w-6 ${iconColor}`}
                            />
                          ) : (
                            <Calendar
                              className={`h-6 w-6 ${iconColor}`}
                            />
                          )}
                        </div>

                        <div className="min-w-0">

                          {/* Status Badge */}

                          {isConfirmed && (
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />

                              {isArabic
                                ? "تم قبول الموعد"
                                : "Appointment Confirmed"}
                            </div>
                          )}

                          {isRejected && (
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              <XCircle className="h-3.5 w-3.5" />

                              {isArabic
                                ? "تم رفض الموعد"
                                : "Appointment Rejected"}
                            </div>
                          )}

                          {isRequest && (
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              <Calendar className="h-3.5 w-3.5" />

                              {isArabic
                                ? "طلب موعد"
                                : "Appointment Request"}
                            </div>
                          )}

                          {!isConfirmed &&
                            !isRejected &&
                            !isRequest && (
                              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <Bell className="h-3.5 w-3.5" />

                                {isArabic
                                  ? "إشعار"
                                  : "Notification"}
                              </div>
                            )}

                          {/* Appointment Type */}

                          {appointmentType && (
                            <div className="mb-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                  isConfirmed
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : isRejected
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                      : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                                }`}
                              >
                                {isArabic
                                  ? `نوع الحجز: ${appointmentType}`
                                  : `Appointment Type: ${appointmentType}`}
                              </span>
                            </div>
                          )}

                          {/* Title */}

                          <h2 className="font-semibold text-slate-900 dark:text-white">
                            {
                              notification.title
                            }
                          </h2>

                          {/* Message */}

                          <p className="mt-2 text-slate-600 dark:text-slate-300">
                            {
                              notification.message
                            }
                          </p>

                          {/* Date */}

                          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                            {formatDate(
                              notification.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Mark Read */}

                      {!notification.is_read && (
                        <button
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {isArabic
                            ? "تحديد كمقروء"
                            : "Mark as Read"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientNotifications;



