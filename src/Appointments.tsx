import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Appointment = {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  patients?: {
    name: string;
    phone: string | null;
  } | null;
};

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get doctor's clinic ID
  const getClinicId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/doctor/login";
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile error:", error);
      setError("Could not load clinic information.");
      return null;
    }

    if (!profile?.clinic_id) {
      setError("No clinic is connected to this doctor.");
      return null;
    }

    return profile.clinic_id;
  };

  // Load appointments
  const loadAppointments = async () => {
    setLoading(true);
    setError("");

    const clinicId = await getClinicId();

    if (!clinicId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        appointment_date,
        appointment_time,
        status,
        notes,
        patients (
          name,
          phone
        )
      `)
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("Appointments error:", error);
      setError(error.message);
    } else {
      setAppointments(
        (data || []).map((appointment: any) => ({
          id: appointment.id,
          patient_id: appointment.patient_id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          notes: appointment.notes,
          patients: Array.isArray(appointment.patients)
            ? appointment.patients[0] || null
            : appointment.patients || null,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Confirm / Cancel appointment
  const updateStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    setUpdatingId(appointmentId);
    setError("");
    setSuccess("");

    // Update appointment status
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: newStatus,
      })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Update status error:", updateError);
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    // Find appointment
    const appointment = appointments.find(
      (item) => item.id === appointmentId
    );

    // Create notification when doctor confirms
    if (newStatus === "confirmed" && appointment) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          title: "Appointment Confirmed",
          message: `Your appointment on ${appointment.appointment_date} at ${appointment.appointment_time} has been confirmed by the doctor.`,
          is_read: false,
        });

      if (notificationError) {
        console.error(
          "Notification error:",
          notificationError
        );

        setError(
          "Appointment confirmed, but notification could not be created."
        );

        setUpdatingId(null);
        return;
      }
    }

    // Success message
    if (newStatus === "confirmed") {
      setSuccess(
        "Appointment confirmed and patient notification created successfully."
      );
    } else if (newStatus === "cancelled") {
      setSuccess(
        "Appointment cancelled successfully."
      );
    }

    // Update appointment on screen
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              status: newStatus,
            }
          : appointment
      )
    );

    setUpdatingId(null);
  };

  // Status colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "confirmed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "completed":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Status text
  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";

      case "confirmed":
        return "Confirmed";

      case "cancelled":
        return "Cancelled";

      case "completed":
        return "Completed";

      default:
        return status;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28">
        <p className="text-slate-600">
          Loading appointments...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-12 px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Appointments
            </h1>

            <p className="mt-2 text-slate-600">
              Manage your clinic appointments.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/doctor/dashboard";
            }}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {/* Appointments */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Section Header */}
          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-semibold text-slate-900">
              Patient Appointments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage appointment requests.
            </p>

          </div>

          {/* No appointments */}
          {appointments.length === 0 ? (

            <div className="p-10 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <span className="text-2xl">
                  📅
                </span>
              </div>

              <p className="font-semibold text-slate-700">
                No appointments yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Patient booking requests will appear here.
              </p>

            </div>

          ) : (

            /* Appointments Table */
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Phone
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Time
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {appointments.map((appointment) => (

                    <tr
                      key={appointment.id}
                      className="border-t border-slate-100"
                    >

                      {/* Patient */}
                      <td className="px-6 py-5">

                        <p className="font-semibold text-slate-900">
                          {appointment.patients?.name ||
                            "Unknown Patient"}
                        </p>

                        {appointment.notes && (
                          <p className="mt-1 max-w-xs text-sm text-slate-500">
                            {appointment.notes}
                          </p>
                        )}

                      </td>

                      {/* Phone */}
                      <td className="px-6 py-5 text-slate-600">
                        {appointment.patients?.phone || "-"}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5 text-slate-600">
                        {appointment.appointment_date}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-5 text-slate-600">
                        {appointment.appointment_time}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                            appointment.status
                          )}`}
                        >
                          {formatStatus(
                            appointment.status
                          )}
                        </span>

                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">

                        {appointment.status === "pending" ? (

                          <div className="flex flex-wrap gap-2">

                            {/* Confirm */}
                            <button
                              onClick={() =>
                                updateStatus(
                                  appointment.id,
                                  "confirmed"
                                )
                              }
                              disabled={
                                updatingId === appointment.id
                              }
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingId === appointment.id
                                ? "Updating..."
                                : "Confirm"}
                            </button>

                            {/* Cancel */}
                            <button
                              onClick={() =>
                                updateStatus(
                                  appointment.id,
                                  "cancelled"
                                )
                              }
                              disabled={
                                updatingId === appointment.id
                              }
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>

                          </div>

                        ) : appointment.status === "confirmed" ? (

                          /* Cancel confirmed appointment */
                          <button
                            onClick={() =>
                              updateStatus(
                                appointment.id,
                                "cancelled"
                              )
                            }
                            disabled={
                              updatingId === appointment.id
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>

                        ) : (

                          <span className="text-sm text-slate-400">
                            No actions
                          </span>

                        )}

                      </td>

                    </tr>

                  ))}

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





