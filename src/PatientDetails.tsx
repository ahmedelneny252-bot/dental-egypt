
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bell, Globe, Moon, Sun } from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
  case_status: string | null;
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
  diagnosis: string | null;
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

type Payment = {
  id: string;
  medical_record_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string | null;
  notes: string | null;
};

const PatientDetails = () => {
  const { id } = useParams();

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("dentalcare-theme") === "dark";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [updatingCaseStatus, setUpdatingCaseStatus] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [treatmentDate, setTreatmentDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [cost, setCost] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentRecordId, setSelectedPaymentRecordId] =
    useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] =
    useState<string | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prescriptionDoctorNotes, setPrescriptionDoctorNotes] = useState("");

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");
      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(
      "dentalcare-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const handleLanguageToggle = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem("dentalcare-language", nextLanguage);
    window.dispatchEvent(new Event("dentalcare-language-change"));
  };

  useEffect(() => {
    if (!id) {
      setError(
        isArabic
          ? "معرف المريض غير موجود."
          : "Patient ID is missing."
      );
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profile?.clinic_id) {
        throw new Error(
          isArabic
            ? "لا توجد عيادة مرتبطة بهذا الطبيب."
            : "No clinic is connected to this doctor."
        );
      }

      setClinicId(profile.clinic_id);

      const { data: patientData, error: patientError } = await supabase
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

      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select(
          "id, treatment_date, diagnosis, cost, doctor_notes"
        )
        .eq("patient_id", id)
        .eq("clinic_id", profile.clinic_id)
        .order("treatment_date", { ascending: false });

      if (recordsError) {
        throw new Error(recordsError.message);
      }

      const formattedRecords: MedicalRecord[] = (recordsData || []).map(
        (record) => ({
          ...record,
          cost: Number(record.cost || 0),
        })
      );

      setMedicalRecords(formattedRecords);

      const { data: paymentsData, error: paymentsError } = await supabase
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

      const formattedPayments: Payment[] = (paymentsData || []).map(
        (payment) => ({
          id: payment.id,
          medical_record_id: payment.medical_record_id,
          amount: Number(payment.amount || 0),
          payment_method: payment.payment_method || "Cash",
          payment_date: payment.payment_date,
          description: payment.description || null,
          notes: payment.notes || null,
        })
      );

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
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          isArabic
            ? "تعذر تحميل بيانات المريض."
            : "Could not load patient details."
        );
      }
    } finally {
      setLoading(false);
    }
  };

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

  const getRecordRemainingAmount = (record: MedicalRecord) => {
    const costValue = Number(record.cost || 0);
    const paidValue = getRecordPaidAmount(record.id);

    return Math.max(costValue - paidValue, 0);
  };

  const getTotalRemainingAmount = () => {
    return medicalRecords.reduce(
      (total, record) =>
        total + getRecordRemainingAmount(record),
      0
    );
  };

  const openPaymentForm = (record: MedicalRecord) => {
    const remaining = getRecordRemainingAmount(record);

    if (remaining <= 0) {
      setError(
        isArabic
          ? "تم دفع تكلفة هذا العلاج بالكامل بالفعل."
          : "This treatment has already been fully paid."
      );
      return;
    }

    setSelectedPaymentRecordId(record.id);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
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

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError(
        isArabic
          ? "بيانات العيادة أو المريض غير موجودة."
          : "Clinic or patient information is missing."
      );
      return;
    }

    if (!selectedPaymentRecordId) {
      setError(
        isArabic
          ? "من فضلك اختر العلاج."
          : "Please select a treatment."
      );
      return;
    }

    const record = medicalRecords.find(
      (item) => item.id === selectedPaymentRecordId
    );

    if (!record) {
      setError(
        isArabic
          ? "لم يتم العثور على سجل العلاج."
          : "Treatment record not found."
      );
      return;
    }

    const amountValue = Number(paymentAmount);
    const remainingValue = getRecordRemainingAmount(record);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError(
        isArabic
          ? "من فضلك أدخل مبلغ دفع صحيح."
          : "Please enter a valid payment amount."
      );
      return;
    }

    if (amountValue > remainingValue) {
      setError(
        isArabic
          ? `لا يمكن أن يكون مبلغ الدفع أكبر من المبلغ المتبقي (${remainingValue.toFixed(
              2
            )}).`
          : `Payment cannot be greater than the remaining amount (${remainingValue.toFixed(
              2
            )}).`
      );
      return;
    }

    try {
      setSavingPayment(true);
      setError("");

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          clinic_id: clinicId,
          patient_id: id,
          medical_record_id: selectedPaymentRecordId,
          payment_date:
            paymentDate ||
            new Date().toISOString().split("T")[0],
          description: paymentDescription.trim() || null,
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
        setError(
          isArabic
            ? "تعذر حفظ الدفعة."
            : "Could not save payment."
        );
      }
    } finally {
      setSavingPayment(false);
    }
  };

  const resetFollowUpForm = () => {
    setFollowUpDate("");
    setFollowUpTime("");
    setFollowUpNotes("");
    setShowFollowUpForm(false);
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError(
        isArabic
          ? "بيانات العيادة أو المريض غير موجودة."
          : "Clinic or patient information is missing."
      );
      return;
    }

    if (!followUpDate || !followUpTime) {
      setError(
        isArabic
          ? "من فضلك اختر تاريخ ووقت موعد المتابعة."
          : "Please select a follow-up date and time."
      );
      return;
    }

    try {
      setSavingFollowUp(true);
      setError("");

      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinicId,
          patient_id: id,
          appointment_date: followUpDate,
          appointment_time: followUpTime,
          status: "confirmed",
          notes: followUpNotes.trim() || null,
        });

      if (appointmentError) {
        throw new Error(appointmentError.message);
      }

      resetFollowUpForm();
      await loadPatientDetails();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          isArabic
            ? "تعذر إضافة موعد المتابعة."
            : "Could not add the follow-up appointment."
        );
      }
    } finally {
      setSavingFollowUp(false);
    }
  };

  // إكمال حالة المريض + حذف المواعيد القادمة فقط
  const handleCompleteCase = async () => {
    if (!clinicId || !id) {
      setError(
        isArabic
          ? "بيانات العيادة أو المريض غير موجودة."
          : "Clinic or patient information is missing."
      );
      return;
    }

    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد أن حالة المريض اكتملت؟ سيتم حذف جميع المواعيد القادمة."
        : "Are you sure this patient's case is complete? All upcoming appointments will be removed."
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingCaseStatus(true);
      setError("");

      // تحديث حالة المريض
      const { error: updateError } = await supabase
        .from("patients")
        .update({
          case_status: "completed",
        })
        .eq("id", id)
        .eq("clinic_id", clinicId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // تاريخ اليوم
      const today = new Date().toISOString().split("T")[0];

      // حذف المواعيد القادمة فقط
      const { error: deleteAppointmentsError } = await supabase
        .from("appointments")
        .delete()
        .eq("patient_id", id)
        .eq("clinic_id", clinicId)
        .gte("appointment_date", today);

      if (deleteAppointmentsError) {
        throw new Error(deleteAppointmentsError.message);
      }

      // تحديث حالة المريض في الواجهة
      setPatient((previousPatient) =>
        previousPatient
          ? {
              ...previousPatient,
              case_status: "completed",
            }
          : previousPatient
      );

      // الاحتفاظ بالمواعيد السابقة فقط
      setAppointments((previousAppointments) =>
        previousAppointments.filter(
          (appointment) =>
            appointment.appointment_date < today
        )
      );

      setShowFollowUpForm(false);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          isArabic
            ? "تعذر إكمال حالة المريض."
            : "Could not complete the patient's case."
        );
      }
    } finally {
      setUpdatingCaseStatus(false);
    }
  };

  const resetRecordForm = () => {
    setTreatmentDate("");
    setDiagnosis("");
    setCost("");
    setDoctorNotes("");
    setEditingRecordId(null);
    setShowRecordForm(false);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError(
        isArabic
          ? "بيانات العيادة أو المريض غير موجودة."
          : "Clinic or patient information is missing."
      );
      return;
    }

    const costValue = Number(cost || 0);

    if (!Number.isFinite(costValue) || costValue < 0) {
      setError(
        isArabic
          ? "من فضلك أدخل تكلفة علاج صحيحة."
          : "Please enter a valid treatment cost."
      );
      return;
    }

    setError("");

    const recordData = {
      clinic_id: clinicId,
      patient_id: id,
      treatment_date: treatmentDate || null,
      diagnosis: diagnosis || null,
      cost: costValue,
      doctor_notes: doctorNotes || null,
    };

    if (editingRecordId) {
      const paidAmount = getRecordPaidAmount(editingRecordId);

      if (costValue < paidAmount) {
        setError(
          isArabic
            ? `لا يمكن أن تكون تكلفة العلاج أقل من المبلغ المدفوع بالفعل (${paidAmount.toFixed(
                2
              )}).`
            : `Treatment cost cannot be less than the amount already paid (${paidAmount.toFixed(
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
    setDiagnosis(record.diagnosis || "");
    setCost(record.cost?.toString() || "");
    setDoctorNotes(record.doctor_notes || "");
    setShowRecordForm(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    const recordPayments = getRecordPayments(recordId);

    if (recordPayments.length > 0) {
      setError(
        isArabic
          ? "لا يمكن حذف هذا العلاج لأنه يحتوي على دفعات. احذف الدفعات أولًا."
          : "This treatment cannot be deleted because it has payments. Delete the payments first."
      );
      return;
    }

    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد من حذف هذا السجل الطبي؟"
        : "Are you sure you want to delete this medical record?"
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

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setError(
        isArabic
          ? "بيانات العيادة أو المريض غير موجودة."
          : "Clinic or patient information is missing."
      );
      return;
    }

    if (!medicineName.trim()) {
      setError(
        isArabic
          ? "اسم الدواء مطلوب."
          : "Medicine name is required."
      );
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
      isArabic
        ? "هل أنت متأكد من حذف هذه الروشتة؟"
        : "Are you sure you want to delete this prescription?"
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
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      >
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {isArabic
            ? "جاري تحميل بيانات المريض..."
            : "Loading patient details..."}
        </p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 px-6 pt-24 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-red-600 dark:text-red-400">
              {error ||
                (isArabic
                  ? "لم يتم العثور على المريض."
                  : "Patient not found.")}
            </p>

            <Link
              to="/doctor/patients"
              className="mt-5 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {isArabic
                ? "العودة إلى المرضى"
                : "Back to Patients"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPaymentRecord = medicalRecords.find(
    (record) => record.id === selectedPaymentRecordId
  );

  const totalRemainingAmount = getTotalRemainingAmount();

  const isCaseCompleted = patient.case_status === "completed";

  const today = new Date().toISOString().split("T")[0];

  const upcomingAppointments = appointments.filter(
    (appointment) =>
      appointment.appointment_date >= today
  );

  const pastAppointments = appointments.filter(
    (appointment) =>
      appointment.appointment_date < today
  );

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-6 pb-12 pt-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="mx-auto max-w-7xl">

        {/* الشريط العلوي */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div>
            <Link
              to="/doctor/patients"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {isArabic
                ? "→ العودة إلى المرضى"
                : "← Back to Patients"}
            </Link>

            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {patient.name}
            </h1>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {isArabic
                ? "الملف الطبي للمريض"
                : "Patient medical profile"}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                handleLanguageToggle(
                  isArabic ? "en" : "ar"
                )
              }
              title={
                isArabic
                  ? "تغيير اللغة"
                  : "Change language"
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Globe className="h-4 w-4" />
              <span>{isArabic ? "EN" : "عربي"}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setDarkMode((previous) => !previous)
              }
              title={
                darkMode
                  ? isArabic
                    ? "الوضع النهاري"
                    : "Light mode"
                  : isArabic
                  ? "الوضع الليلي"
                  : "Dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              to="/doctor/notifications"
              title={
                isArabic
                  ? "إشعارات الدكتور"
                  : "Doctor notifications"
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Bell className="h-4 w-4" />
            </Link>

          </div>
        </div>

        {/* Patient Actions */}
        <div className="mb-5 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50/70 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">

          <div className="flex flex-col gap-3 border-b border-indigo-200 p-4 dark:border-indigo-900/50 md:flex-row md:items-center md:justify-between">

            <div className="flex flex-wrap items-center gap-2">

              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {isArabic
                  ? "حالة الحالة:"
                  : "Case Status:"}
              </span>

              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  isCaseCompleted
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                    : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                }`}
              >
                {isCaseCompleted
                  ? isArabic
                    ? "الحالة مكتملة"
                    : "Case Completed"
                  : isArabic
                  ? "الحالة نشطة"
                  : "Active Case"}
              </span>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() => {
                  if (isCaseCompleted) {
                    return;
                  }

                  setError("");
                  setShowFollowUpForm(
                    !showFollowUpForm
                  );
                }}
                disabled={isCaseCompleted}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showFollowUpForm
                  ? isArabic
                    ? "إلغاء المتابعة"
                    : "Cancel Follow-up"
                  : isArabic
                  ? "+ إضافة موعد متابعة"
                  : "+ Add Follow-up"}
              </button>

              <button
                type="button"
                onClick={handleCompleteCase}
                disabled={
                  isCaseCompleted || updatingCaseStatus
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingCaseStatus
                  ? isArabic
                    ? "جاري الإكمال..."
                    : "Completing..."
                  : isArabic
                  ? "✓ إكمال الحالة"
                  : "✓ Complete Case"}
              </button>

            </div>

          </div>

          <div className="grid gap-3 p-4 md:grid-cols-3">

            <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "إجمالي المستحق"
                  : "Outstanding Balance"}
              </p>

              <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
                {totalRemainingAmount.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "عدد السجلات الطبية"
                  : "Medical Records"}
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {medicalRecords.length}
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "المواعيد القادمة"
                  : "Upcoming Appointments"}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {isCaseCompleted
                  ? 0
                  : upcomingAppointments.length}
              </p>
            </div>

          </div>

          {showFollowUpForm && !isCaseCompleted && (
            <div className="border-t border-indigo-200 bg-white/50 p-5 dark:border-indigo-900/50 dark:bg-slate-900/30">

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isArabic
                    ? "إضافة موعد متابعة"
                    : "Add Follow-up Appointment"}
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "حدد موعد المتابعة القادم لهذا المريض."
                    : "Set the next follow-up appointment for this patient."}
                </p>
              </div>

              <form
                onSubmit={handleAddFollowUp}
                className="grid gap-4 md:grid-cols-2"
              >

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "تاريخ المتابعة"
                      : "Follow-up Date"}
                  </label>

                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) =>
                      setFollowUpDate(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "وقت المتابعة"
                      : "Follow-up Time"}
                  </label>

                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) =>
                      setFollowUpTime(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "ملاحظات المتابعة"
                      : "Follow-up Notes"}
                  </label>

                  <textarea
                    value={followUpNotes}
                    onChange={(e) =>
                      setFollowUpNotes(e.target.value)
                    }
                    placeholder={
                      isArabic
                        ? "مثال: متابعة بعد أسبوع لفحص الحشو"
                        : "Example: Follow-up after one week to check the filling"
                    }
                    className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">

                  <button
                    type="submit"
                    disabled={savingFollowUp}
                    className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingFollowUp
                      ? isArabic
                        ? "جاري إضافة الموعد..."
                        : "Adding Appointment..."
                      : isArabic
                      ? "حفظ موعد المتابعة"
                      : "Save Follow-up"}
                  </button>

                  <button
                    type="button"
                    onClick={resetFollowUpForm}
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>

                </div>

              </form>

            </div>
          )}

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Patient Information */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">

          <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
            {isArabic
              ? "معلومات المريض"
              : "Patient Information"}
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic ? "الاسم بالكامل" : "Full Name"}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {patient.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.common.phone}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {patient.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic ? "العمر" : "Age"}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {patient.age ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic ? "النوع" : "Gender"}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {patient.gender || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.common.address}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {patient.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "تاريخ التسجيل"
                  : "Patient Since"}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {new Date(
                  patient.created_at
                ).toLocaleDateString(
                  isArabic ? "ar-EG" : "en-US"
                )}
              </p>
            </div>

          </div>

          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "ملاحظات طبية عامة"
                : "General Medical Notes"}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {patient.medical_notes ||
                (isArabic
                  ? "لا توجد ملاحظات طبية عامة."
                  : "No general medical notes.")}
            </p>

          </div>

        </div>

        {/* Medical Records */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between dark:border-slate-800">

            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic ? "السجلات الطبية" : "Medical Records"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "تاريخ العلاج والسجلات الطبية والمدفوعات"
                  : "Treatment history, clinical records and payments"}
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRecordId(null);
                setTreatmentDate("");
                setDiagnosis("");
                setCost("");
                setDoctorNotes("");
                setShowRecordForm(!showRecordForm);
              }}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {showRecordForm
                ? isArabic
                  ? "إلغاء"
                  : "Cancel"
                : isArabic
                ? "+ إضافة سجل"
                : "+ Add Record"}
            </button>

          </div>

          {showRecordForm && (
            <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/50">

              <h3 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
                {editingRecordId
                  ? isArabic
                    ? "تعديل السجل الطبي"
                    : "Edit Medical Record"
                  : isArabic
                  ? "إضافة سجل طبي"
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder={
                    isArabic ? "التشخيص" : "Diagnosis"
                  }
                  value={diagnosis}
                  onChange={(e) =>
                    setDiagnosis(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={
                    isArabic
                      ? "تكلفة العلاج"
                      : "Treatment Cost"
                  }
                  value={cost}
                  onChange={(e) =>
                    setCost(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <textarea
                  placeholder={
                    isArabic
                      ? "ملاحظات الطبيب"
                      : "Doctor Notes"
                  }
                  value={doctorNotes}
                  onChange={(e) =>
                    setDoctorNotes(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 md:col-span-2"
                >
                  {editingRecordId
                    ? isArabic
                      ? "تحديث السجل"
                      : "Update Record"
                    : isArabic
                    ? "حفظ السجل"
                    : "Save Record"}
                </button>

              </form>

            </div>
          )}

          {medicalRecords.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد سجلات طبية حتى الآن."
                  : "No medical records yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1400px]">

                <thead className="bg-slate-50 dark:bg-slate-950/50">

                  <tr>

                    {[
                      isArabic ? "التاريخ" : "Date",
                      isArabic ? "التشخيص" : "Diagnosis",
                      isArabic ? "التكلفة" : "Cost",
                      isArabic ? "المدفوع" : "Paid",
                      isArabic ? "المتبقي" : "Remaining",
                      isArabic ? "الإجراءات" : "Actions",
                    ].map((header, index) => (
                      <th
                        key={header}
                        className={`px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 ${
                          index === 5
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {header}
                      </th>
                    ))}

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
                        className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >

                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {record.treatment_date || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {record.diagnosis || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                          {Number(record.cost || 0).toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                          {paidAmount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              remainingAmount === 0
                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
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
                                className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50"
                              >
                                +{" "}
                                {isArabic
                                  ? "دفعة"
                                  : "Payment"}
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleEditRecord(record)
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              {isArabic ? "تعديل" : "Edit"}
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteRecord(record.id)
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                            >
                              {isArabic ? "حذف" : "Delete"}
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

          {showPaymentForm && selectedPaymentRecord && (
            <div className="border-t border-slate-200 bg-green-50 p-6 dark:border-slate-800 dark:bg-green-950/20">

              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {isArabic
                      ? "إضافة دفعة"
                      : "Add Payment"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {isArabic
                      ? "السجل الطبي"
                      : "Medical Record"}{" "}
                    •{" "}
                    {selectedPaymentRecord.treatment_date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePaymentForm}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>

              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">

                <div className="rounded-xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? "تكلفة العلاج"
                      : "Treatment Cost"}
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {Number(
                      selectedPaymentRecord.cost || 0
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isArabic ? "المدفوع" : "Already Paid"}
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                    {getRecordPaidAmount(
                      selectedPaymentRecord.id
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isArabic ? "المتبقي" : "Remaining"}
                  </p>

                  <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
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
                  placeholder={
                    isArabic
                      ? "مبلغ الدفع"
                      : "Payment Amount"
                  }
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="Cash">
                    {isArabic ? "نقدي" : "Cash"}
                  </option>

                  <option value="Card">
                    {isArabic ? "بطاقة" : "Card"}
                  </option>

                  <option value="Vodafone Cash">
                    Vodafone Cash
                  </option>

                  <option value="Instapay">
                    Instapay
                  </option>

                  <option value="Other">
                    {isArabic ? "أخرى" : "Other"}
                  </option>
                </select>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) =>
                    setPaymentDate(e.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder={
                    isArabic
                      ? "وصف الدفع - مثال: الدفعة الأولى"
                      : "Payment Description - e.g. First Payment"
                  }
                  value={paymentDescription}
                  onChange={(e) =>
                    setPaymentDescription(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <textarea
                  placeholder={
                    isArabic
                      ? "ملاحظات الدفع"
                      : "Payment Notes"
                  }
                  value={paymentNotes}
                  onChange={(e) =>
                    setPaymentNotes(e.target.value)
                  }
                  className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white md:col-span-2"
                />

                <button
                  type="submit"
                  disabled={savingPayment}
                  className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                >
                  {savingPayment
                    ? isArabic
                      ? "جاري حفظ الدفعة..."
                      : "Saving Payment..."
                    : isArabic
                    ? "حفظ الدفعة"
                    : "Save Payment"}
                </button>

              </form>

            </div>
          )}

          {payments.length > 0 && (
            <div className="border-t border-slate-200 p-6 dark:border-slate-800">

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isArabic
                    ? "سجل المدفوعات"
                    : "Payment History"}
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "جميع المدفوعات التي قام بها هذا المريض."
                    : "All payments made by this patient."}
                </p>
              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-slate-50 dark:bg-slate-950/50">

                    <tr>

                      {[
                        isArabic ? "التاريخ" : "Date",
                        isArabic ? "الوصف" : "Description",
                        isArabic ? "المبلغ" : "Amount",
                        isArabic ? "الطريقة" : "Method",
                        isArabic ? "ملاحظات" : "Notes",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-5 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400"
                        >
                          {header}
                        </th>
                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >

                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {payment.payment_date}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {payment.description || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                          {payment.amount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {payment.payment_method}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {payment.notes || "-"}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

        </div>

        {/* Prescriptions */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between dark:border-slate-800">

            <div>

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic ? "الروشتات" : "Prescriptions"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "الأدوية الموصوفة لهذا المريض"
                  : "Medicines prescribed for this patient"}
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
                ? isArabic
                  ? "إلغاء"
                  : "Cancel"
                : isArabic
                ? "+ إضافة روشتة"
                : "+ Add Prescription"}
            </button>

          </div>

          {showPrescriptionForm && (
            <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/50">

              <h3 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
                {editingPrescriptionId
                  ? isArabic
                    ? "تعديل الروشتة"
                    : "Edit Prescription"
                  : isArabic
                  ? "إضافة روشتة"
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder={
                    isArabic ? "اسم الدواء" : "Medicine Name"
                  }
                  value={medicineName}
                  onChange={(e) =>
                    setMedicineName(e.target.value)
                  }
                  required
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder={
                    isArabic
                      ? "الجرعة - مثال: 500 mg"
                      : "Dosage - e.g. 500 mg"
                  }
                  value={dosage}
                  onChange={(e) =>
                    setDosage(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder={
                    isArabic
                      ? "التكرار - مثال: 3 مرات يوميًا"
                      : "Frequency - e.g. 3 times/day"
                  }
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="text"
                  placeholder={
                    isArabic
                      ? "المدة - مثال: 5 أيام"
                      : "Duration - e.g. 5 days"
                  }
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <textarea
                  placeholder={
                    isArabic
                      ? "التعليمات"
                      : "Instructions"
                  }
                  value={instructions}
                  onChange={(e) =>
                    setInstructions(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <textarea
                  placeholder={
                    isArabic
                      ? "ملاحظات الطبيب"
                      : "Doctor Notes"
                  }
                  value={prescriptionDoctorNotes}
                  onChange={(e) =>
                    setPrescriptionDoctorNotes(e.target.value)
                  }
                  className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white md:col-span-2"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 md:col-span-2"
                >
                  {editingPrescriptionId
                    ? isArabic
                      ? "تحديث الروشتة"
                      : "Update Prescription"
                    : isArabic
                    ? "حفظ الروشتة"
                    : "Save Prescription"}
                </button>

              </form>

            </div>
          )}

          {prescriptions.length === 0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-2xl dark:bg-teal-950/40">
                💊
              </div>

              <p className="font-medium text-slate-600 dark:text-slate-300">
                {isArabic
                  ? "لا توجد روشتات حتى الآن."
                  : "No prescriptions yet."}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {isArabic
                  ? "أضف أول روشتة لهذا المريض."
                  : "Add the first prescription for this patient."}
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">

                    {[
                      isArabic ? "التاريخ" : "Date",
                      isArabic ? "الدواء" : "Medicine",
                      isArabic ? "الجرعة" : "Dosage",
                      isArabic ? "التكرار" : "Frequency",
                      isArabic ? "المدة" : "Duration",
                      isArabic ? "التعليمات" : "Instructions",
                      isArabic ? "الإجراءات" : "Actions",
                    ].map((header, index) => (
                      <th
                        key={header}
                        className={`px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 ${
                          index === 6
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {header}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {prescriptions.map((prescription) => (
                    <tr
                      key={prescription.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {prescription.prescription_date || "-"}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-lg dark:bg-teal-950/40">
                            💊
                          </div>

                          <span className="font-semibold text-slate-900 dark:text-white">
                            {prescription.medicine_name}
                          </span>

                        </div>

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {prescription.dosage || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {prescription.frequency || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {prescription.duration || "-"}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600 dark:text-slate-400">

                        <p className="line-clamp-2">
                          {prescription.instructions || "-"}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <Link
                            to={`/doctor/prescriptions/${prescription.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-400 dark:hover:bg-teal-950/50"
                          >
                            🖨{" "}
                            {isArabic ? "طباعة" : "Print"}
                          </Link>

                          <button
                            onClick={() =>
                              handleEditPrescription(
                                prescription
                              )
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            {isArabic ? "تعديل" : "Edit"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeletePrescription(
                                prescription.id
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            {isArabic ? "حذف" : "Delete"}
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 p-6 dark:border-slate-800">

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isArabic
                ? "المواعيد القادمة"
                : "Upcoming Appointments"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "المواعيد القادمة للمريض"
                : "Upcoming appointments for this patient"}
            </p>

          </div>

          {isCaseCompleted ? (

            <div className="p-10 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-950/40 dark:text-green-400">
                ✓
              </div>

              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                {isArabic
                  ? "الحالة مكتملة"
                  : "Case Completed"}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد مواعيد قادمة لهذا المريض."
                  : "There are no upcoming appointments for this patient."}
              </p>

            </div>

          ) : upcomingAppointments.length === 0 ? (

            <div className="p-10 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                📅
              </div>

              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {isArabic
                  ? "لا توجد مواعيد قادمة"
                  : "No Upcoming Appointments"}
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "يمكنك إضافة موعد متابعة جديد من الأعلى."
                  : "You can add a new follow-up appointment from above."}
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 dark:bg-slate-950/50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "التاريخ" : "Date"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "الوقت" : "Time"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "الحالة" : "Status"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "ملاحظات" : "Notes"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {upcomingAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >

                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {appointment.appointment_date}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {appointment.appointment_time}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            appointment.status === "confirmed"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : appointment.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                              : appointment.status === "completed"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                          }`}
                        >
                          {appointment.status === "confirmed"
                            ? isArabic
                              ? "مؤكد"
                              : "Confirmed"
                            : appointment.status === "cancelled"
                            ? isArabic
                              ? "ملغي"
                              : "Cancelled"
                            : appointment.status === "completed"
                            ? isArabic
                              ? "مكتمل"
                              : "Completed"
                            : isArabic
                            ? "قيد الانتظار"
                            : "Pending"}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {appointment.notes || "-"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* Previous Appointments */}
        {pastAppointments.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-200 p-6 dark:border-slate-800">

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic
                  ? "سجل المواعيد السابقة"
                  : "Previous Appointments"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "المواعيد السابقة تظل محفوظة في سجل المريض."
                  : "Previous appointments remain saved in the patient's history."}
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 dark:bg-slate-950/50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "التاريخ" : "Date"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "الوقت" : "Time"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "الحالة" : "Status"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isArabic ? "ملاحظات" : "Notes"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {pastAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >

                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {appointment.appointment_date}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {appointment.appointment_time}
                      </td>

                      <td className="px-6 py-4">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {appointment.status === "confirmed"
                            ? isArabic
                              ? "مؤكد"
                              : "Confirmed"
                            : appointment.status === "completed"
                            ? isArabic
                              ? "مكتمل"
                              : "Completed"
                            : appointment.status === "cancelled"
                            ? isArabic
                              ? "ملغي"
                              : "Cancelled"
                            : isArabic
                            ? "قيد الانتظار"
                            : "Pending"}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {appointment.notes || "-"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDetails;





