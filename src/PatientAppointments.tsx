import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

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

const PatientAppointments = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatientAppointments = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/patient/login";
      return;
    }

    const { data: patientData, error: patientError } =
      await supabase
        .from("patients")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle();

    if (patientError) {
      console.error(patientError);
      setError(patientError.message);
      setLoading(false);
      return;
    }

    if (!patientData) {
      setError(
        "Your patient account is not connected to a patient record."
      );
      setLoading(false);
      return;
    }

    setPatient(patientData);

    const { data: appointmentData, error: appointmentError } =
      await supabase
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
        .eq("patient_id", patientData.id)
        .order("appointment_date", {
          ascending: false,
        })
        .order("appointment_time", {
          ascending: false,
        });

    if (appointmentError) {
      console.error(appointmentError);
      setError(appointmentError.message);
      setLoading(false);
      return;
    }

    const formattedAppointments: Appointment[] =
      (appointmentData || []).map((appointment: any) => ({
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        status: appointment.status,
        notes: appointment.notes,
        clinics: Array.isArray(appointment.clinics)
          ? appointment.clinics[0] || null
          : appointment.clinics || null,
      }));

    setAppointments(formattedAppointments);
    setLoading(false);
  };

  useEffect(() => {
    loadPatientAppointments();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/patient/login";
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <p className="text-slate-600">
          Loading your appointments...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6">

      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Patient Information */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
                Patient Portal
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                My Appointments
              </h1>

              {patient && (
                <p className="mt-2 text-lg text-slate-600">
                  Welcome,{" "}
                  <span className="font-semibold text-slate-900">
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
                🔔 Notifications
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Logout
              </button>

            </div>

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Appointments Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-semibold text-slate-900">
              Your Appointments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View the status and details of your appointments.
            </p>

          </div>

          {appointments.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <span className="text-2xl">
                  📅
                </span>
              </div>

              <h3 className="font-semibold text-slate-800">
                No appointments yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                You don't have any appointments yet.
              </p>

              <Link
                to="/clinics"
                className="mt-5 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
              >
                Find a Clinic
              </Link>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Clinic
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
                      Notes
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {appointments.map((appointment) => (

                    <tr
                      key={appointment.id}
                      className="border-t border-slate-100"
                    >

                      <td className="px-6 py-5 font-semibold text-slate-900">
                        {appointment.clinics?.name || "Clinic"}
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {appointment.appointment_date}
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {appointment.appointment_time}
                      </td>

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

                      <td className="px-6 py-5 text-slate-600">
                        {appointment.notes || "-"}
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

export default PatientAppointments;



