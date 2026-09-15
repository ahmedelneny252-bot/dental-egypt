import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { supabase } from "../supabase";

type Clinic = {
  id: string;
  name: string;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
};

const BookAppointment = () => {
  const { id } = useParams<{ id: string }>();

  const [clinic, setClinic] = useState<Clinic | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadClinic = async () => {
      if (!id) {
        setError("Clinic not found.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("clinics")
        .select("id, name")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Clinic error:", error);
        setError("Clinic not found.");
      } else {
        setClinic(data);
      }

      setLoading(false);
    };

    loadClinic();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!id) {
      setError("Clinic not found.");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setError("Please choose the appointment date and time.");
      return;
    }

    setBooking(true);

    try {
      // Check if patient already exists
      const { data: existingPatient, error: patientSearchError } =
        await supabase
          .from("patients")
          .select("id, name, phone")
          .eq("clinic_id", id)
          .eq("phone", phone.trim())
          .maybeSingle();

      if (patientSearchError) {
        throw patientSearchError;
      }

      let patient: Patient;

      if (existingPatient) {
        patient = existingPatient;
      } else {
        // Create patient
        const { data: newPatient, error: patientInsertError } =
          await supabase
            .from("patients")
            .insert({
              clinic_id: id,
              name: name.trim(),
              phone: phone.trim(),
              medical_notes: null,
            })
            .select("id, name, phone")
            .single();

        if (patientInsertError) {
          throw patientInsertError;
        }

        patient = newPatient;
      }

      // Create appointment
      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          clinic_id: id,
          patient_id: patient.id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: "pending",
          notes: notes.trim() || null,
        });

      if (appointmentError) {
        throw appointmentError;
      }

      setSuccess(
        "Your appointment request has been sent successfully!"
      );

      setName("");
      setPhone("");
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");

    } catch (err: any) {
      console.error("Booking error:", err);

      setError(
        err?.message ||
          "Something went wrong while booking the appointment."
      );
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-24">
        <p className="text-slate-600">
          Loading...
        </p>
      </div>
    );
  }

  if (error && !clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 pt-24">
        <div className="text-center">

          <h2 className="text-2xl font-bold text-slate-800">
            Clinic not found
          </h2>

          <Link
            to="/clinics"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Clinics
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24">

      <div className="mx-auto max-w-3xl px-6 py-10">

        <Link
          to={`/clinics/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clinic
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-slate-900">
              Book an Appointment
            </h1>

            <p className="mt-2 text-slate-600">
              {clinic?.name}
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-700">

              <p className="font-semibold">
                Appointment Request Sent
              </p>

              <p className="mt-1 text-sm">
                The clinic will review your request and confirm
                your appointment.
              </p>

            </div>
          )}

          <form
            onSubmit={handleBooking}
            className="space-y-5"
          >

            {/* Name */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Your Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

            </div>

            {/* Phone */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

            </div>

            {/* Date + Time */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment Date
                </label>

                <div className="relative">

                  <Calendar className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={appointmentDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setAppointmentDate(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none focus:border-teal-500"
                  />

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment Time
                </label>

                <div className="relative">

                  <Clock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) =>
                      setAppointmentTime(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none focus:border-teal-500"
                  />

                </div>

              </div>

            </div>

            {/* Notes */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={booking}
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {booking
                ? "Sending Request..."
                : "Request Appointment"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};

export default BookAppointment;



