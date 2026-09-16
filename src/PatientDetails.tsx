
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

type DentalChartItem = {
  id: string;
  tooth_number: string;
  tooth_status: string;
  notes: string | null;
};

type Payment = {
  id: string;
  medical_record_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string | null;
  notes: string | null;
};

const toothNumbers = [
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "48", "47", "46", "45", "44", "43", "42", "41",
  "31", "32", "33", "34", "35", "36", "37", "38",
];

const toothStatuses = [
  "Healthy",
  "Cavity",
  "Filled",
  "Missing",
  "Root Canal",
  "Crown",
  "Extraction Needed",
];

const PatientDetails = () => {
  const { id } = useParams();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(
    []
  );
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [dentalChart, setDentalChart] = useState<DentalChartItem[]>([]);
  const [selectedTooth, setSelectedTooth] = useState("");
  const [toothStatus, setToothStatus] = useState("Healthy");
  const [toothNotes, setToothNotes] = useState("");
  const [savingTooth, setSavingTooth] = useState(false);

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

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentRecordId, setSelectedPaymentRecordId] =
    useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [savingPayment, setSavingPayment] = useState(false);

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

      const formattedRecords: MedicalRecord[] = (
        recordsData || []
      ).map((record) => ({
        ...record,
        cost: Number(record.cost || 0),
      }));

      setMedicalRecords(formattedRecords);

      const { data: paymentsData, error: paymentsError } =
        await supabase
          .from("payments")
          .select(
            "id, medical_record_id, amount, payment_method, payment_date, description, notes"
          )
          .eq("patient_id", id)
          .eq("clinic_id", profile.clinic_id)
          .order("payment_date", { ascending: false });

      if (paymentsError) {
        throw new Error(paymentsError.message);
      }

      const formattedPayments: Payment[] = (
        paymentsData || []
      ).map((payment) => ({
        id: payment.id,
        medical_record_id: payment.medical_record_id,
        amount: Number(payment.amount || 0),
        payment_method: payment.payment_method || "Cash",
        payment_date: payment.payment_date,
        description: payment.description || null,
        notes: payment.notes || null,
      }));

      setPayments(formattedPayments);

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

      const {
        data: dentalChartData,
        error: dentalChartError,
      } = await supabase
        .from("dental_chart")
        .select(
          "id, tooth_number, tooth_status, notes"
        )
        .eq("patient_id", id)
        .eq("clinic_id", profile.clinic_id)
        .order("tooth_number", { ascending: true });

      if (dentalChartError) {
        throw new Error(dentalChartError.message);
      }

      setDentalChart(dentalChartData || []);
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
  // PAYMENT HELPERS
  // =========================

  const getRecordPayments = (recordId: string) => {
    return payments.filter(
      (payment) => payment.medical_record_id === recordId
    );
  };

  const getRecordPaidAmount = (recordId: string) => {
    return getRecordPayments(recordId).reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );
  };

  const getRecordRemainingAmount = (
    record: MedicalRecord
  ) => {
    const costValue = Number(record.cost || 0);
    const paidValue = getRecordPaidAmount(record.id);

    return Math.max(costValue - paidValue, 0);
  };

  const openPaymentForm = (record: MedicalRecord) => {
    const remaining = getRecordRemainingAmount(record);

    if (remaining <= 0) {
      setError("This treatment has already been fully paid.");
      return;
    }

    setSelectedPaymentRecordId(record.id);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPaymentDate(
      new Date().toISOString().split("T")[0]
    );
    setPaymentDescription("");
    setPaymentNotes("");
    setShowPaymentForm(true);
    setError("");
  };

  const closePaymentForm = () => {
    setShowPaymentForm(false);
    setSelectedPaymentRecordId(null);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPaymentDate("");
    setPaymentDescription("");
    setPaymentNotes("");
  };

  const handleSavePayment = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError("Clinic or patient information is missing.");
      return;
    }

    if (!selectedPaymentRecordId) {
      setError("Please select a treatment.");
      return;
    }

    const record = medicalRecords.find(
      (item) => item.id === selectedPaymentRecordId
    );

    if (!record) {
      setError("Treatment record not found.");
      return;
    }

    const amountValue = Number(paymentAmount);
    const remainingValue =
      getRecordRemainingAmount(record);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (amountValue > remainingValue) {
      setError(
        `Payment cannot be greater than the remaining amount (${remainingValue.toFixed(
          2
        )}).`
      );
      return;
    }

    try {
      setSavingPayment(true);
      setError("");

      const { error: paymentError } =
        await supabase
          .from("payments")
          .insert({
            clinic_id: clinicId,
            patient_id: id,
            medical_record_id: selectedPaymentRecordId,
            payment_date:
              paymentDate ||
              new Date().toISOString().split("T")[0],
            description:
              paymentDescription.trim() || null,
            amount: amountValue,
            payment_method: paymentMethod,
            notes: paymentNotes.trim() || null,
          });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      closePaymentForm();

      await loadPatientDetails();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not save payment.");
      }
    } finally {
      setSavingPayment(false);
    }
  };

  // =========================
  // DENTAL CHART
  // =========================

  const getToothData = (toothNumberValue: string) => {
    return dentalChart.find(
      (item) => item.tooth_number === toothNumberValue
    );
  };

  const getToothStatusClass = (toothNumberValue: string) => {
    const tooth = getToothData(toothNumberValue);

    if (!tooth) {
      return "border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:bg-teal-50";
    }

    switch (tooth.tooth_status) {
      case "Cavity":
        return "border-red-300 bg-red-50 text-red-700";
      case "Filled":
        return "border-blue-300 bg-blue-50 text-blue-700";
      case "Missing":
        return "border-slate-400 bg-slate-200 text-slate-500";
      case "Root Canal":
        return "border-purple-300 bg-purple-50 text-purple-700";
      case "Crown":
        return "border-yellow-300 bg-yellow-50 text-yellow-700";
      case "Extraction Needed":
        return "border-orange-300 bg-orange-50 text-orange-700";
      default:
        return "border-green-300 bg-green-50 text-green-700";
    }
  };

  const handleSelectTooth = (toothNumberValue: string) => {
    setSelectedTooth(toothNumberValue);

    const existingTooth = getToothData(toothNumberValue);

    if (existingTooth) {
      setToothStatus(existingTooth.tooth_status);
      setToothNotes(existingTooth.notes || "");
    } else {
      setToothStatus("Healthy");
      setToothNotes("");
    }

    setError("");
  };

  const handleSaveTooth = async () => {
    if (!clinicId || !id) {
      setError("Clinic or patient information is missing.");
      return;
    }

    if (!selectedTooth) {
      setError("Please select a tooth first.");
      return;
    }

    try {
      setSavingTooth(true);
      setError("");

      const { error: saveError } = await supabase
        .from("dental_chart")
        .upsert(
          {
            clinic_id: clinicId,
            patient_id: id,
            tooth_number: selectedTooth,
            tooth_status: toothStatus,
            notes: toothNotes || null,
          },
          {
            onConflict: "patient_id,tooth_number",
          }
        );

      if (saveError) {
        throw new Error(saveError.message);
      }

      await loadPatientDetails();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not save tooth information.");
      }
    } finally {
      setSavingTooth(false);
    }
  };

  const handleDeleteTooth = async () => {
    if (!selectedTooth || !id || !clinicId) {
      return;
    }

    const confirmed = window.confirm(
      `Remove the dental chart information for tooth ${selectedTooth}?`
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("dental_chart")
      .delete()
      .eq("patient_id", id)
      .eq("clinic_id", clinicId)
      .eq("tooth_number", selectedTooth);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSelectedTooth("");
    setToothStatus("Healthy");
    setToothNotes("");

    await loadPatientDetails();
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

    const costValue = Number(cost || 0);

    if (!Number.isFinite(costValue) || costValue < 0) {
      setError("Please enter a valid treatment cost.");
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
      cost: costValue,
      doctor_notes: doctorNotes || null,
    };

    if (editingRecordId) {
      const paidAmount =
        getRecordPaidAmount(editingRecordId);

      if (costValue < paidAmount) {
        setError(
          `Treatment cost cannot be less than the amount already paid (${paidAmount.toFixed(
            2
          )}).`
        );
        return;
      }

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
    const recordPayments =
      getRecordPayments(recordId);

    if (recordPayments.length > 0) {
      setError(
        "This treatment cannot be deleted because it has payments. Delete the payments first."
      );
      return;
    }

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
    setPrescriptionDate(
      prescription.prescription_date || ""
    );
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

  const selectedPaymentRecord = medicalRecords.find(
    (record) => record.id === selectedPaymentRecordId
  );

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
              <p className="text-sm text-slate-500">Full Name</p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Age</p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.age ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Gender</p>
              <p className="mt-1 font-semibold text-slate-900">
                {patient.gender || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Address</p>
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

        {/* Dental Chart */}
        <div className="mb-8 rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Dental Chart
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a tooth to view or update its condition.
            </p>
          </div>

          <div className="p-6">

            <div className="mb-8">
              <div className="mb-3 text-center text-sm font-semibold text-slate-500">
                Upper Teeth
              </div>

              <div className="grid grid-cols-8 gap-2 md:gap-3">
                {toothNumbers.slice(0, 16).map((tooth) => (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => handleSelectTooth(tooth)}
                    className={`rounded-xl border-2 p-3 text-center transition ${getToothStatusClass(
                      tooth
                    )} ${
                      selectedTooth === tooth
                        ? "ring-2 ring-teal-500 ring-offset-2"
                        : ""
                    }`}
                  >
                    <div className="text-lg">🦷</div>

                    <div className="mt-1 text-sm font-bold">
                      {tooth}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-center text-sm font-semibold text-slate-500">
                Lower Teeth
              </div>

              <div className="grid grid-cols-8 gap-2 md:gap-3">
                {toothNumbers.slice(16, 32).map((tooth) => (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => handleSelectTooth(tooth)}
                    className={`rounded-xl border-2 p-3 text-center transition ${getToothStatusClass(
                      tooth
                    )} ${
                      selectedTooth === tooth
                        ? "ring-2 ring-teal-500 ring-offset-2"
                        : ""
                    }`}
                  >
                    <div className="text-lg">🦷</div>

                    <div className="mt-1 text-sm font-bold">
                      {tooth}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTooth && (
              <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50 p-6">

                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Tooth {selectedTooth}
                    </h3>

                    <p className="text-sm text-slate-500">
                      Update the condition and notes.
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700">
                    {getToothData(selectedTooth)
                      ? "Saved"
                      : "Not saved"}
                  </span>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tooth Status
                    </label>

                    <select
                      value={toothStatus}
                      onChange={(e) =>
                        setToothStatus(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                    >
                      {toothStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Notes
                    </label>

                    <input
                      type="text"
                      value={toothNotes}
                      onChange={(e) =>
                        setToothNotes(e.target.value)
                      }
                      placeholder="Example: Needs filling"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">

                    <button
                      type="button"
                      onClick={handleSaveTooth}
                      disabled={savingTooth}
                      className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingTooth
                        ? "Saving..."
                        : "Save Tooth"}
                    </button>

                    {getToothData(selectedTooth) && (
                      <button
                        type="button"
                        onClick={handleDeleteTooth}
                        className="rounded-xl bg-red-50 px-5 py-3 font-semibold text-red-600 hover:bg-red-100"
                      >
                        Remove Tooth Data
                      </button>
                    )}

                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6">

              <p className="mb-3 text-sm font-semibold text-slate-600">
                Status Legend
              </p>

              <div className="flex flex-wrap gap-3">

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Healthy
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  Cavity
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Filled
                </span>

                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Missing
                </span>

                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  Root Canal
                </span>

                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                  Crown
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  Extraction Needed
                </span>

              </div>
            </div>

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
                Treatment history, clinical records and payments
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
                  min="0"
                  step="0.01"
                  placeholder="Treatment Cost"
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

              <table className="w-full min-w-[1400px]">

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

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Paid
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Remaining
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-600">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {medicalRecords.map((record) => {
                    const paidAmount =
                      getRecordPaidAmount(record.id);

                    const remainingAmount =
                      getRecordRemainingAmount(record);

                    return (
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
                          {Number(record.cost || 0).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-green-600">
                          {paidAmount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              remainingAmount === 0
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {remainingAmount.toFixed(2)}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <div className="flex justify-end gap-2">

                            {remainingAmount > 0 && (
                              <button
                                onClick={() =>
                                  openPaymentForm(record)
                                }
                                className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                              >
                                + Payment
                              </button>
                            )}

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
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && selectedPaymentRecord && (
            <div className="border-t border-slate-200 bg-green-50 p-6">

              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Add Payment
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {selectedPaymentRecord.treatment_type ||
                      "Treatment"}{" "}
                    •{" "}
                    {selectedPaymentRecord.treatment_date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePaymentForm}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-500">
                    Treatment Cost
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {Number(
                      selectedPaymentRecord.cost || 0
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-500">
                    Already Paid
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-600">
                    {getRecordPaidAmount(
                      selectedPaymentRecord.id
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-500">
                    Remaining
                  </p>

                  <p className="mt-1 text-xl font-bold text-orange-600">
                    {getRecordRemainingAmount(
                      selectedPaymentRecord
                    ).toFixed(2)}
                  </p>
                </div>

              </div>

              <form
                onSubmit={handleSavePayment}
                className="grid gap-4 md:grid-cols-2"
              >

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={getRecordRemainingAmount(
                    selectedPaymentRecord
                  )}
                  placeholder="Payment Amount"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500"
                />

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Vodafone Cash">
                    Vodafone Cash
                  </option>
                  <option value="Instapay">
                    Instapay
                  </option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) =>
                    setPaymentDate(e.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500"
                />

                <input
                  type="text"
                  placeholder="Payment Description - e.g. First Payment"
                  value={paymentDescription}
                  onChange={(e) =>
                    setPaymentDescription(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500"
                />

                <textarea
                  placeholder="Payment Notes"
                  value={paymentNotes}
                  onChange={(e) =>
                    setPaymentNotes(e.target.value)
                  }
                  className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-500 md:col-span-2"
                />

                <button
                  type="submit"
                  disabled={savingPayment}
                  className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                >
                  {savingPayment
                    ? "Saving Payment..."
                    : "Save Payment"}
                </button>

              </form>

            </div>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="border-t border-slate-200 p-6">

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  Payment History
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  All payments made by this patient.
                </p>
              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-slate-50">
                    <tr>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                        Treatment
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                        Description
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                        Method
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                        Notes
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {payments.map((payment) => {

                      const relatedRecord =
                        medicalRecords.find(
                          (record) =>
                            record.id ===
                            payment.medical_record_id
                        );

                      return (
                        <tr
                          key={payment.id}
                          className="border-t border-slate-100"
                        >

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {payment.payment_date}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {relatedRecord?.treatment_type ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {payment.description || "-"}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-green-600">
                            {payment.amount.toFixed(2)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {payment.payment_method}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {payment.notes || "-"}
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
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

                          <Link
                            to={`/doctor/prescriptions/${prescription.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                          >
                            🖨 Print
                          </Link>

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
