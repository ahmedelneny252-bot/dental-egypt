import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./supabase";

type Prescription = {
  id: string;
  patient_id: string;
  prescription_date: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  doctor_notes: string | null;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
};

type Clinic = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  logo_url: string | null;
};

const PrescriptionPrint = () => {
  const { id } = useParams<{ id: string }>();

  const [prescription, setPrescription] =
    useState<Prescription | null>(null);

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [clinic, setClinic] =
    useState<Clinic | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPrescription = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/doctor/login";
          return;
        }

        // Get doctor profile
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("clinic_id")
            .eq("id", user.id)
            .single();

        if (profileError || !profile?.clinic_id) {
          throw new Error(
            "Could not find the doctor's clinic."
          );
        }

        const clinicId = profile.clinic_id;

        // Get clinic information
        const { data: clinicData, error: clinicError } =
          await supabase
            .from("clinics")
            .select(
              "id, name, phone, whatsapp, address, logo_url"
            )
            .eq("id", clinicId)
            .single();

        if (clinicError) {
          throw new Error(
            "Could not load clinic information."
          );
        }

        // Get prescription
        const { data: prescriptionData, error: prescriptionError } =
          await supabase
            .from("prescriptions")
            .select(
              "id, patient_id, prescription_date, medicine_name, dosage, frequency, duration, instructions, doctor_notes"
            )
            .eq("id", id)
            .eq("clinic_id", clinicId)
            .single();

        if (prescriptionError || !prescriptionData) {
          throw new Error(
            "Prescription not found."
          );
        }

        // Get patient
        const { data: patientData, error: patientError } =
          await supabase
            .from("patients")
            .select(
              "id, name, phone, age, gender"
            )
            .eq("id", prescriptionData.patient_id)
            .eq("clinic_id", clinicId)
            .single();

        if (patientError || !patientData) {
          throw new Error(
            "Patient not found."
          );
        }

        setClinic(clinicData);
        setPrescription(prescriptionData);
        setPatient(patientData);
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Something went wrong while loading the prescription."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPrescription();
    } else {
      setError("Prescription ID is missing.");
      setLoading(false);
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading prescription...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-red-600">
            Error
          </h1>

          <p className="mt-3 text-slate-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!prescription || !patient || !clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Prescription information is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">

        {/* Print Button */}
        <div className="mb-6 flex justify-end print:hidden">
          <button
            onClick={handlePrint}
            className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            🖨 Print Prescription
          </button>
        </div>

        {/* Prescription */}
        <div className="rounded-2xl bg-white p-8 shadow-sm print:rounded-none print:shadow-none print:p-10">

          {/* Clinic Header */}
          <div className="border-b-2 border-teal-600 pb-6">

            <div className="flex items-start justify-between gap-6">

              <div className="flex items-center gap-4">

                {clinic.logo_url ? (
                  <img
                    src={clinic.logo_url}
                    alt={clinic.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-teal-100 text-3xl font-bold text-teal-700">
                    D
                  </div>
                )}

                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {clinic.name}
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Dental Clinic
                  </p>
                </div>
              </div>

              <div className="text-right text-sm text-slate-600">
                {clinic.phone && (
                  <p>
                    Phone: {clinic.phone}
                  </p>
                )}

                {clinic.whatsapp && (
                  <p>
                    WhatsApp: {clinic.whatsapp}
                  </p>
                )}

                {clinic.address && (
                  <p className="max-w-xs">
                    {clinic.address}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Prescription Title */}
          <div className="py-6 text-center">
            <h2 className="text-4xl font-bold tracking-wide text-teal-700">
              PRESCRIPTION
            </h2>
          </div>

          {/* Patient Information */}
          <div className="rounded-xl bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Patient Name
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {patient.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Prescription Date
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {prescription.prescription_date}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Phone
                </p>

                <p className="mt-1 text-slate-700">
                  {patient.phone || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Age
                </p>

                <p className="mt-1 text-slate-700">
                  {patient.age ?? "-"}
                </p>
              </div>

            </div>
          </div>

          {/* Medicine */}
          <div className="mt-8">

            <h3 className="mb-4 text-xl font-bold text-slate-900">
              Medication
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200">

              <table className="w-full">

                <thead className="bg-teal-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Medicine
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Dosage
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Frequency
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Duration
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {prescription.medicine_name}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {prescription.dosage || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {prescription.frequency || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {prescription.duration || "-"}
                    </td>
                  </tr>
                </tbody>

              </table>

            </div>
          </div>

          {/* Instructions */}
          {prescription.instructions && (
            <div className="mt-8">

              <h3 className="mb-2 text-lg font-bold text-slate-900">
                Instructions
              </h3>

              <div className="rounded-xl border border-slate-200 p-5 text-slate-700">
                {prescription.instructions}
              </div>

            </div>
          )}

          {/* Doctor Notes */}
          {prescription.doctor_notes && (
            <div className="mt-6">

              <h3 className="mb-2 text-lg font-bold text-slate-900">
                Doctor Notes
              </h3>

              <div className="rounded-xl border border-slate-200 p-5 text-slate-700">
                {prescription.doctor_notes}
              </div>

            </div>
          )}

          {/* Signature */}
          <div className="mt-20 flex justify-end">

            <div className="w-56 text-center">

              <div className="mb-3 border-b border-slate-400"></div>

              <p className="font-semibold text-slate-800">
                Doctor Signature
              </p>

            </div>

          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
            <p>
              {clinic.name}
            </p>

            {clinic.phone && (
              <p>
                {clinic.phone}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrescriptionPrint;

