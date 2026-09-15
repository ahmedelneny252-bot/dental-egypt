import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./supabase";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
};

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
};

type MedicalRecord = {
  id: string;
  treatment_date: string;
  tooth_number: string | null;
  diagnosis: string | null;
  treatment_type: string | null;
  treatment_details: string | null;
  cost: number | null;
  doctor_notes: string | null;
};

type Prescription = {
  id: string;
  prescription_date: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  doctor_notes: string | null;
};

const PatientDetails = () => {
  const { id } = useParams();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [clinicId, setClinicId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Medical record form
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecordId, setEditingRecordId] =
    useState<string | null>(null);

  const [treatmentDate, setTreatmentDate] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentType, setTreatmentType] = useState("");
  const [treatmentDetails, setTreatmentDetails] = useState("");
  const [cost, setCost] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");

  // Prescription form
  const [showPrescriptionForm, setShowPrescriptionForm] =
    useState(false);

  const [editingPrescriptionId, setEditingPrescriptionId] =
    useState<string | null>(null);

  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prescriptionDoctorNotes, setPrescriptionDoctorNotes] =
    useState("");

  useEffect(() => {
    if (!id) {
      setError("Patient ID is missing.");
      setLoading(false);
      return;
    }

    loadPatientDetails();
  }, [id]);

  const loadPatientDetails = async () => {
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

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("clinic_id")
          .eq("id", user.id)
          .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profile?.clinic_id) {
        throw new Error(
          "No clinic is connected to this doctor."
        );
      }

      setClinicId(profile.clinic_id);

      // Patient
      const { data: patientData, error: patientError } =
        await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .eq("clinic_id", profile.clinic_id)
          .single();

      if (patientError) {
        throw new Error(patientError.message);
      }

      setPatient(patientData);

      // Appointments
      const {
        data: appointmentsData,
        error: appointmentsError,
      } = await supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, status, notes"
        )
        .eq("patient_id", id)
        .eq("clinic_id", profile.clinic_id)
        .order("appointment_date", { ascending: false });

      if (appointmentsError) {
        throw new Error(appointmentsError.message);
      }

      setAppointments(appointmentsData || []);

      // Medical Records
      const { data: recordsData, error: recordsError } =
        await supabase
          .from("medical_records")
          .select(
            "id, treatment_date, tooth_number, diagnosis, treatment_type, treatment_details, cost, doctor_notes"
          )
          .eq("patient_id", id)
          .eq("clinic_id", profile.clinic_id)
          .order("treatment_date", { ascending: false });

      if (recordsError) {
        throw new Error(recordsError.message);
      }

      setMedicalRecords(recordsData || []);

      // Prescriptions
      const {
        data: prescriptionsData,
        error: prescriptionsError,
      } = await supabase
        .from("prescriptions")
        .select(
          "id, prescription_date, medicine_name, dosage, frequency, duration, instructions, doctor_notes"
        )
        .eq("patient_id", id)
        .eq("clinic_id", profile.clinic_id)
        .order("prescription_date", { ascending: false });

      if (prescriptionsError) {
        throw new Error(prescriptionsError.message);
      }

      setPrescriptions(prescriptionsData || []);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not load patient details.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // MEDICAL RECORDS
  // =========================

  const resetRecordForm = () => {
    setTreatmentDate("");
    setToothNumber("");
    setDiagnosis("");
    setTreatmentType("");
    setTreatmentDetails("");
    setCost("");
    setDoctorNotes("");
    setEditingRecordId(null);
    setShowRecordForm(false);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError("Clinic or patient information is missing.");
      return;
    }

    setError("");

    const recordData = {
      clinic_id: clinicId,
      patient_id: id,
      treatment_date: treatmentDate || null,
      tooth_number: toothNumber || null,
      diagnosis: diagnosis || null,
      treatment_type: treatmentType || null,
      treatment_details: treatmentDetails || null,
      cost: cost ? Number(cost) : 0,
      doctor_notes: doctorNotes || null,
    };

    if (editingRecordId) {
      const { error: updateError } = await supabase
        .from("medical_records")
        .update(recordData)
        .eq("id", editingRecordId)
        .eq("patient_id", id)
        .eq("clinic_id", clinicId);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("medical_records")
        .insert(recordData);

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    resetRecordForm();
    await loadPatientDetails();
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecordId(record.id);
    setTreatmentDate(record.treatment_date || "");
    setToothNumber(record.tooth_number || "");
    setDiagnosis(record.diagnosis || "");
    setTreatmentType(record.treatment_type || "");
    setTreatmentDetails(record.treatment_details || "");
    setCost(record.cost?.toString() || "");
    setDoctorNotes(record.doctor_notes || "");
    setShowRecordForm(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medical record?"
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", recordId)
      .eq("patient_id", id)
      .eq("clinic_id", clinicId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadPatientDetails();
  };

  // =========================
  // PRESCRIPTIONS
  // =========================

  const resetPrescriptionForm = () => {
    setPrescriptionDate("");
    setMedicineName("");
    setDosage("");
    setFrequency("");
    setDuration("");
    setInstructions("");
    setPrescriptionDoctorNotes("");
    setEditingPrescriptionId(null);
    setShowPrescriptionForm(false);
  };

  const handleSavePrescription = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError("Clinic or patient information is missing.");
      return;
    }

    if (!medicineName.trim()) {
      setError("Medicine name is required.");
      return;
    }

    setError("");

    const prescriptionData = {
      clinic_id: clinicId,
      patient_id: id,
      prescription_date: prescriptionDate || null,
      medicine_name: medicineName.trim(),
      dosage: dosage || null,
      frequency: frequency || null,
      duration: duration || null,
      instructions: instructions || null,
      doctor_notes: prescriptionDoctorNotes || null,
    };

    if (editingPrescriptionId) {
      const { error: updateError } = await supabase
        .from("prescriptions")
        .update(prescriptionData)
        .eq("id", editingPrescriptionId)
        .eq("patient_id", id)
        .eq("clinic_id", clinicId);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("prescriptions")
        .insert(prescriptionData);

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    resetPrescriptionForm();
    await loadPatientDetails();
  };

  const handleEditPrescription = (
    prescription: Prescription
  ) => {
    setEditingPrescriptionId(prescription.id);
    setPrescriptionDate(prescription.prescription_date || "");
    setMedicineName(prescription.medicine_name);
    setDosage(prescription.dosage || "");
    setFrequency(prescription.frequency || "");
    setDuration(prescription.duration || "");
    setInstructions(prescription.instructions || "");
    setPrescriptionDoctorNotes(
      prescription.doctor_notes || ""
    );
    setShowPrescriptionForm(true);
  };

  const handleDeletePrescription = async (
    prescriptionId: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this prescription?"
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("prescriptions")
      .delete()
      .eq("id", prescriptionId)
      .eq("patient_id", id)
      .eq("clinic_id", clinicId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadPatientDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 text-lg">
          Loading patient details...
        </p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-red-600">
              {error || "Patient not found."}
            </p>

            <Link
              to="/doctor/patients"
              className="mt-5 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              Back to Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-12 px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/doctor/patients"
              className="text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              ← Back to Patients
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {patient.name}
            </h1>

            <p className="mt-2 text-slate-600">
              Patient medical profile
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Patient Information */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">
            Patient Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-sm text-slate-500">
                Full Name
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Phone
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Age
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.age ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Gender
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.gender || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Address
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Patient Since
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {new Date(
                  patient.created_at
                ).toLocaleDateString()}
              </p>
            </div>

          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              General Medical Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-slate-700">
              {patient.medical_notes ||
                "No general medical notes."}
            </p>
          </div>
        </div>

        {/* Medical Records */}
        <div className="mb-8 rounded-2xl bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Medical Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Treatment history and clinical records
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRecordId(null);
                setTreatmentDate("");
                setToothNumber("");
                setDiagnosis("");
                setTreatmentType("");
                setTreatmentDetails("");
                setCost("");
                setDoctorNotes("");
                setShowRecordForm(!showRecordForm);
              }}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {showRecordForm
                ? "Cancel"
                : "+ Add Record"}
            </button>
          </div>

          {showRecordForm && (
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-5 text-lg font-semibold text-slate-900">
                {editingRecordId
                  ? "Edit Medical Record"
                  : "Add Medical Record"}
              </h3>

              <form
                onSubmit={handleSaveRecord}
                className="grid gap-4 md:grid-cols-2"
              >
                <input
                  type="date"
                  value={treatmentDate}
                  onChange={(e) =>
                    setTreatmentDate(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Tooth Number"
                  value={toothNumber}
                  onChange={(e) =>
                    setToothNumber(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Diagnosis"
                  value={diagnosis}
                  onChange={(e) =>
                    setDiagnosis(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Treatment Type"
                  value={treatmentType}
                  onChange={(e) =>
                    setTreatmentType(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <textarea
                  placeholder="Treatment Details"
                  value={treatmentDetails}
                  onChange={(e) =>
                    setTreatmentDetails(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 md:col-span-2"
                />

                <input
                  type="number"
                  placeholder="Cost"
                  value={cost}
                  onChange={(e) =>
                    setCost(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <textarea
                  placeholder="Doctor Notes"
                  value={doctorNotes}
                  onChange={(e) =>
                    setDoctorNotes(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 md:col-span-2"
                >
                  {editingRecordId
                    ? "Update Record"
                    : "Save Record"}
                </button>
              </form>
            </div>
          )}

          {medicalRecords.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500">
                No medical records yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Tooth
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Diagnosis
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Treatment
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Cost
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {medicalRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {record.treatment_date || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        {record.tooth_number || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {record.diagnosis || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {record.treatment_type || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {record.cost ?? 0}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              handleEditRecord(record)
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteRecord(record.id)
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div className="mb-8 rounded-2xl bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Prescriptions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Medicines prescribed for this patient
              </p>
            </div>

            <button
              onClick={() => {
                if (showPrescriptionForm) {
                  resetPrescriptionForm();
                } else {
                  setEditingPrescriptionId(null);
                  setPrescriptionDate("");
                  setMedicineName("");
                  setDosage("");
                  setFrequency("");
                  setDuration("");
                  setInstructions("");
                  setPrescriptionDoctorNotes("");
                  setShowPrescriptionForm(true);
                }
              }}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {showPrescriptionForm
                ? "Cancel"
                : "+ Add Prescription"}
            </button>
          </div>

          {showPrescriptionForm && (
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-5 text-lg font-semibold text-slate-900">
                {editingPrescriptionId
                  ? "Edit Prescription"
                  : "Add Prescription"}
              </h3>

              <form
                onSubmit={handleSavePrescription}
                className="grid gap-4 md:grid-cols-2"
              >
                <input
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) =>
                    setPrescriptionDate(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Medicine Name"
                  value={medicineName}
                  onChange={(e) =>
                    setMedicineName(e.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Dosage - e.g. 500 mg"
                  value={dosage}
                  onChange={(e) =>
                    setDosage(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Frequency - e.g. 3 times/day"
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <input
                  type="text"
                  placeholder="Duration - e.g. 5 days"
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <textarea
                  placeholder="Instructions"
                  value={instructions}
                  onChange={(e) =>
                    setInstructions(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                />

                <textarea
                  placeholder="Doctor Notes"
                  value={prescriptionDoctorNotes}
                  onChange={(e) =>
                    setPrescriptionDoctorNotes(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500 md:col-span-2"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 md:col-span-2"
                >
                  {editingPrescriptionId
                    ? "Update Prescription"
                    : "Save Prescription"}
                </button>
              </form>
            </div>
          )}

          {prescriptions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-2xl">
                💊
              </div>

              <p className="font-medium text-slate-600">
                No prescriptions yet.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Add the first prescription for this patient.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Medicine
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Dosage
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Frequency
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Duration
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Instructions
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {prescriptions.map((prescription) => (
                    <tr
                      key={prescription.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {prescription.prescription_date ||
                          "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-lg">
                            💊
                          </div>

                          <span className="font-semibold text-slate-900">
                            {prescription.medicine_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {prescription.dosage || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {prescription.frequency || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {prescription.duration || "-"}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                        <p className="line-clamp-2">
                          {prescription.instructions ||
                            "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          {/* Print */}
                          <Link
                            to={`/doctor/prescriptions/${prescription.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                          >
                            🖨 Print
                          </Link>

                          {/* Edit */}
                          <button
                            onClick={() =>
                              handleEditPrescription(
                                prescription
                              )
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() =>
                              handleDeletePrescription(
                                prescription.id
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Appointment History */}
        <div className="rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Appointment History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Previous and upcoming appointments
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500">
                No appointments yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
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
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {appointment.appointment_date}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {appointment.appointment_time}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            appointment.status ===
                            "confirmed"
                              ? "bg-green-100 text-green-700"
                              : appointment.status ===
                                "cancelled"
                              ? "bg-red-100 text-red-700"
                              : appointment.status ===
                                "completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
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

export default PatientDetails;
