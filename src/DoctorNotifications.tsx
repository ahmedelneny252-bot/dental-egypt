import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Calendar, User } from "lucide-react";
import { supabase } from "./supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment_id: string | null;
  patient_id: string | null;
};

const DoctorNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("");

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

      console.log("Current user ID:", user.id);
      console.log("Current user email:", user.email);

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, name, email, clinic_id")
        .eq("id", user.id)
        .maybeSingle();

      console.log("Profile data:", profile);
      console.log("Profile error:", profileError);

      if (profileError) {
        setError(
          `Could not load doctor profile: ${profileError.message}`
        );
        return;
      }

      if (!profile) {
        setError(
          `Profile not found. Logged-in user ID: ${user.id}, email: ${user.email}`
        );
        return;
      }

      if (!profile.clinic_id) {
        setError(
          "This doctor profile does not have a clinic connected."
        );
        return;
      }

      const currentClinicId = profile.clinic_id;

      setClinicId(currentClinicId);

      console.log("Doctor clinic ID:", currentClinicId);

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
          `Could not load notifications: ${notificationError.message}`
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
        "Something went wrong while loading notifications."
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

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28">
        <p className="text-slate-600">
          Loading notifications...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-12">
      <div className="mx-auto max-w-4xl px-6">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                <Bell className="h-6 w-6 text-teal-600" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Notifications
                </h1>

                <p className="mt-1 text-slate-600">
                  Clinic appointment notifications
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
              Mark All as Read
            </button>
          )}

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {notifications.length === 0 && !error ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-8 w-8 text-slate-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-800">
              No notifications
            </h2>

            <p className="mt-2 text-slate-500">
              Your clinic has no notifications yet.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  notification.is_read
                    ? "border-slate-200 bg-white"
                    : "border-teal-200 bg-teal-50/40"
                }`}
              >

                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      notification.is_read
                        ? "bg-slate-100"
                        : "bg-teal-100"
                    }`}
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        notification.is_read
                          ? "text-slate-500"
                          : "text-teal-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {notification.title}
                        </h3>

                        <p className="mt-1 text-slate-600">
                          {notification.message}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <span className="w-fit rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                          New
                        </span>
                      )}

                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">

                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(
                          notification.created_at
                        )}
                      </span>

                      {notification.patient_id && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          Patient request
                        </span>
                      )}

                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">

                      {notification.appointment_id && (
                        <Link
                          to="/doctor/appointments"
                          className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                        >
                          View Appointment
                        </Link>
                      )}

                      {!notification.is_read && (
                        <button
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Check className="h-4 w-4" />
                          Mark as Read
                        </button>
                      )}

                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorNotifications;


