import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment_id: string | null;
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

  const isArabic =
    language === "ar";

  // =========================
  // Language
  // =========================

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

  // =========================
  // Load Notifications
  // =========================

  const loadNotifications =
    async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          "/patient/login";
        return;
      }

      // =========================
      // Get Patient Records
      // =========================

      const {
        data: patients,
        error:
          patientsError,
      } = await supabase
        .from("patients")
        .select("id")
        .eq(
          "user_id",
          user.id
        );

      if (patientsError) {
        console.error(
          patientsError
        );

        setError(
          patientsError.message
        );

        setLoading(false);
        return;
      }

      const patientIds =
        (patients ?? []).map(
          (patient) =>
            patient.id
        );

      if (
        patientIds.length === 0
      ) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // =========================
      // Get Patient Notifications
      // =========================

      const {
        data,
        error:
          notificationsError,
      } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          is_read,
          created_at,
          appointment_id
        `)
        .in(
          "patient_id",
          patientIds
        )
        .eq(
          "recipient_type",
          "patient"
        )
        .in(
          "notification_type",
          [
            "appointment_confirmed",
            "appointment_rejected",
            "follow_up_created",
            "appointment_rescheduled",
            "appointment_cancelled",
            "appointment_reminder",
          ]
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (
        notificationsError
      ) {
        console.error(
          notificationsError
        );

        setError(
          notificationsError.message
        );

        setLoading(false);
        return;
      }

      setNotifications(
        data ?? []
      );

      setLoading(false);
    };

  // =========================
  // Initial Load
  // =========================

  useEffect(() => {
    loadNotifications();
  }, []);

  // =========================
  // Mark Notification As Read
  // =========================

  const markAsRead = async (
    notificationId: string
  ) => {
    const {
      error:
        updateError,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq(
        "id",
        notificationId
      );

    if (updateError) {
      console.error(
        updateError
      );
      return;
    }

    setNotifications(
      (
        currentNotifications
      ) =>
        currentNotifications.map(
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

  // =========================
  // Mark All As Read
  // =========================

  const markAllAsRead =
    async () => {
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

      const unreadIds =
        unreadNotifications.map(
          (notification) =>
            notification.id
        );

      const {
        error:
          updateError,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .in(
          "id",
          unreadIds
        );

      if (updateError) {
        console.error(
          updateError
        );
        return;
      }

      setNotifications(
        (
          currentNotifications
        ) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              is_read: true,
            })
          )
      );
    };

  // =========================
  // Format Date
  // =========================

  const formatDateTime =
    (date: string) => {
      try {
        return new Intl.DateTimeFormat(
          isArabic
            ? "ar-EG"
            : "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        ).format(
          new Date(date)
        );
      } catch {
        return date;
      }
    };

  // =========================
  // Unread Count
  // =========================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
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

  // =========================
  // Page
  // =========================

  return (
    <div
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-12 px-6"
    >
      <div className="mx-auto max-w-4xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "الإشعارات"
                : "Notifications"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "تابع آخر تحديثات مواعيدك."
                : "Keep track of your latest appointment updates."}
            </p>
          </div>

          {unreadCount >
            0 && (
            <button
              type="button"
              onClick={
                markAllAsRead
              }
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {isArabic
                ? "تحديد الكل كمقروء"
                : "Mark All as Read"}
            </button>
          )}

        </div>

        {/* Error */}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Unread Count */}

        {unreadCount >
          0 && (
          <div className="mb-6 rounded-xl bg-teal-50 dark:bg-teal-950/30 p-4 text-teal-700 dark:text-teal-300">
            {isArabic
              ? `لديك ${unreadCount} إشعار غير مقروء.`
              : `You have ${unreadCount} unread notification(s).`}
          </div>
        )}

        {/* Notifications */}

        <div className="space-y-4">

          {notifications.length ===
          0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-12 text-center shadow-sm">

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد إشعارات حتى الآن."
                  : "No notifications yet."}
              </p>

            </div>
          ) : (
            notifications.map(
              (
                notification
              ) => (
                <div
                  key={
                    notification.id
                  }
                  className={`rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm transition ${
                    !notification.is_read
                      ? "border-2 border-teal-500"
                      : "border border-slate-100 dark:border-slate-800"
                  }`}
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div className="flex-1">

                      <div className="flex items-center gap-3">

                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {
                            notification.title
                          }
                        </h2>

                        {!notification.is_read && (
                          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                            {isArabic
                              ? "جديد"
                              : "New"}
                          </span>
                        )}

                      </div>

                      <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                        {
                          notification.message
                        }
                      </p>

                      <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                        {formatDateTime(
                          notification.created_at
                        )}
                      </p>

                    </div>

                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() =>
                          markAsRead(
                            notification.id
                          )
                        }
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {isArabic
                          ? "تحديد كمقروء"
                          : "Mark as Read"}
                      </button>
                    )}

                  </div>

                </div>
              )
            )
          )}

        </div>

      </div>
    </div>
  );
};

export default PatientNotifications;



