import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment_id: string | null;
};

const PatientNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/patient/login";
      return;
    }

    const { data: patient, error: patientError } =
      await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (patientError) {
      console.error(patientError);
      setError(patientError.message);
      setLoading(false);
      return;
    }

    if (!patient) {
      setError(
        "Your patient account is not connected to a patient record."
      );
      setLoading(false);
      return;
    }

    const { data, error: notificationError } =
      await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          is_read,
          created_at,
          appointment_id
        `)
        .eq("patient_id", patient.id)
        .order("created_at", {
          ascending: false,
        });

    if (notificationError) {
      console.error(notificationError);
      setError(notificationError.message);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notificationId);

    if (error) {
      console.error(error);
      setError(error.message);
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
    const unreadNotifications = notifications.filter(
      (notification) => !notification.is_read
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    const ids = unreadNotifications.map(
      (notification) => notification.id
    );

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", ids);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              Loading notifications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6">

      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
                Patient Portal
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Notifications
              </h1>

              <p className="mt-2 text-slate-600">

                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${
                      unreadCount > 1 ? "s" : ""
                    }.`
                  : "You have no unread notifications."}

              </p>

            </div>

            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Mark All as Read
            </button>

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Notifications */}
        <div className="space-y-4">

          {notifications.length === 0 ? (

            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <span className="text-2xl">
                  🔔
                </span>
              </div>

              <h2 className="text-xl font-semibold text-slate-900">
                No notifications
              </h2>

              <p className="mt-2 text-slate-500">
                You don't have any notifications yet.
              </p>

              <Link
                to="/patient/appointments"
                className="mt-6 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
              >
                My Appointments
              </Link>

            </div>

          ) : (

            notifications.map((notification) => (

              <div
                key={notification.id}
                className={`rounded-2xl border p-6 shadow-sm transition ${
                  notification.is_read
                    ? "border-slate-200 bg-white"
                    : "border-teal-200 bg-teal-50"
                }`}
              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="flex gap-4">

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                        notification.is_read
                          ? "bg-slate-100"
                          : "bg-teal-100"
                      }`}
                    >
                      <span className="text-xl">
                        🔔
                      </span>
                    </div>

                    <div>

                      <h2 className="font-semibold text-slate-900">
                        {notification.title}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        {notification.message}
                      </p>

                      <p className="mt-3 text-sm text-slate-400">
                        {formatDate(
                          notification.created_at
                        )}
                      </p>

                    </div>

                  </div>

                  {!notification.is_read && (

                    <button
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                      className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      Mark as Read
                    </button>

                  )}

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
};

export default PatientNotifications;


