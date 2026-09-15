import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type RecentAppointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patients?: {
    name: string;
  } | null;
};

const DoctorDashboard = () => {
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [clinicName, setClinicName] = useState("");

  const [patientsCount, setPatientsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctorData = async () => {
      setLoading(true);

      // =========================
      // Get Logged-in Doctor
      // =========================
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      // =========================
      // Get Doctor Profile + Clinic
      // =========================
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          name,
          email,
          clinic_id,
          clinics (
            name
          )
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading doctor:", error);
        setLoading(false);
        return;
      }

      setDoctorName(profile.name || "");
      setDoctorEmail(profile.email || user.email || "");

      // =========================
      // Get Clinic Name
      // =========================
      if (profile.clinics) {
        const clinic = Array.isArray(profile.clinics)
          ? profile.clinics[0]
          : profile.clinics;

        setClinicName(clinic?.name || "");
      }

      const clinicId = profile.clinic_id;

      if (!clinicId) {
        setLoading(false);
        return;
      }

      // =========================
      // Patients Count
      // =========================
      const {
        count: patientsCount,
        error: patientsError,
      } = await supabase
        .from("patients")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (patientsError) {
        console.error(
          "Patients count error:",
          patientsError
        );
      } else {
        setPatientsCount(patientsCount || 0);
      }

      // =========================
      // Appointments Count
      // =========================
      const {
        count: appointmentsCount,
        error: appointmentsError,
      } = await supabase
        .from("appointments")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (appointmentsError) {
        console.error(
          "Appointments count error:",
          appointmentsError
        );
      } else {
        setAppointmentsCount(appointmentsCount || 0);
      }

      // =========================
      // Services Count
      // =========================
      const {
        count: servicesCount,
        error: servicesError,
      } = await supabase
        .from("services")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (servicesError) {
        console.error(
          "Services count error:",
          servicesError
        );
      } else {
        setServicesCount(servicesCount || 0);
      }

      // =========================
      // Reviews Count
      // =========================
      const {
        count: reviewsCount,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (reviewsError) {
        console.error(
          "Reviews count error:",
          reviewsError
        );
      } else {
        setReviewsCount(reviewsCount || 0);
      }

      // =========================
      // Recent Appointments
      // =========================
      const {
        data: recentData,
        error: recentError,
      } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          patients (
            name
          )
        `)
        .eq("clinic_id", clinicId)
        .order("appointment_date", {
          ascending: true,
        })
        .order("appointment_time", {
          ascending: true,
        })
        .limit(5);

      if (recentError) {
        console.error(
          "Recent appointments error:",
          recentError
        );
      } else {
        const formattedAppointments: RecentAppointment[] = (
          recentData || []
        ).map((item: any) => ({
          id: item.id,
          appointment_date: item.appointment_date,
          appointment_time: item.appointment_time,
          status: item.status,
          patients: item.patients
            ? {
                name: item.patients.name,
              }
            : null,
        }));

        setRecentAppointments(formattedAppointments);
      }

      setLoading(false);
    };

    loadDoctorData();
  }, []);

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-32">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            Header
        ========================== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, Dr. {doctorName}
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your dental clinic from one place.
          </p>
        </div>

        {/* =========================
            Doctor & Clinic
        ========================== */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">

          {/* Doctor */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Doctor
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              Dr. {doctorName}
            </p>

            <p className="mt-1 text-slate-500">
              {doctorEmail}
            </p>
          </div>

          {/* Clinic */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Clinic
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {clinicName || "No clinic found"}
            </p>
          </div>

        </div>

        {/* =========================
            Statistics
        ========================== */}
        <div className="mb-8">

          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Statistics
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {/* Patients */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Patients
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {patientsCount}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Total patients
              </p>
            </div>

            {/* Appointments */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Appointments
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {appointmentsCount}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Total appointments
              </p>
            </div>

            {/* Services */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Services
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {servicesCount}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Clinic services
              </p>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Reviews
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reviewsCount}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Patient reviews
              </p>
            </div>

          </div>
        </div>

        {/* =========================
            Recent Appointments
        ========================== */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Recent Appointments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your upcoming appointments
              </p>
            </div>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/appointments";
              }}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              View All
            </button>

          </div>

          {recentAppointments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">

              <p className="text-slate-500">
                No appointments yet.
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    "/doctor/appointments";
                }}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
              >
                Add Appointment
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>
                  <tr className="border-b border-slate-200 text-left">

                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                      Patient
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                      Time
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {recentAppointments.map(
                    (appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-b border-slate-100 last:border-0"
                      >

                        <td className="px-4 py-4 font-medium text-slate-900">
                          {appointment.patients?.name ||
                            "Unknown patient"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {appointment.appointment_date}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {appointment.appointment_time}
                        </td>

                        <td className="px-4 py-4">

                          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                            {appointment.status}
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* =========================
            Dashboard Sections
        ========================== */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Clinic Profile */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-slate-900">
              Clinic Profile
            </h2>

            <p className="mt-2 text-slate-600">
              Update your clinic name, address, phone,
              WhatsApp and working hours.
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/clinic-profile";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              Manage Clinic
            </button>

          </div>

          {/* Appointments */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-slate-900">
              Appointments
            </h2>

            <p className="mt-2 text-slate-600">
              View and manage your upcoming patient
              appointments.
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/appointments";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              View Appointments
            </button>

          </div>

          {/* Patients */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-slate-900">
              Patients
            </h2>

            <p className="mt-2 text-slate-600">
              Manage your patient information and
              records.
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/patients";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              View Patients
            </button>

          </div>

          {/* Services */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-slate-900">
              Services
            </h2>

            <p className="mt-2 text-slate-600">
              Add and manage the dental services
              offered by your clinic.
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/services";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              Manage Services
            </button>

          </div>

          {/* Reviews */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-slate-900">
              Reviews
            </h2>

            <p className="mt-2 text-slate-600">
              See what patients are saying about your
              clinic.
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/reviews";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              View Reviews
            </button>

          </div>

          {/* Subscription */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-slate-900">
              Subscription
            </h2>

            <p className="mt-2 text-slate-600">
              Manage your plan and subscription.
            </p>

            <button
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              Manage Plan
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;


