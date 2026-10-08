import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Patient = {
  id: string;
  name: string;
};

type MedicalRecord = {
  id: string;
  patient_id: string;
  cost: number | null;
};

type Payment = {
  id: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string | null;
  created_at: string;
};

const Payments = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [clinicId, setClinicId] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // Language
  // =========================

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  // =========================
  // Theme
  // =========================

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");

    return savedTheme === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";
  const isDark = theme === "dark";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const t = translations[language];

  // =========================
  // Language + Theme Effects
  // =========================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");

      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener("dentalcare-language-change", handleLanguageChange);
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
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = language;

    localStorage.setItem("dentalcare-language", language);
  }, [language, isArabic]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);

    localStorage.setItem("theme", theme);
  }, [theme, isDark]);

  // =========================
  // Get Clinic
  // =========================

  const getClinic = async () => {
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
      console.error(profileError);

      setError(
        isArabic
          ? "تعذر تحميل معلومات العيادة."
          : "Could not load clinic information."
      );

      setLoading(false);
      return;
    }

    if (!profile?.clinic_id) {
      setError(
        isArabic
          ? "لا توجد عيادة مرتبطة بهذا الطبيب."
          : "No clinic is connected to this doctor."
      );

      setLoading(false);
      return;
    }

    setClinicId(profile.clinic_id);

    await Promise.all([
      loadPatients(profile.clinic_id),
      loadMedicalRecords(profile.clinic_id),
      loadPayments(profile.clinic_id),
    ]);

    setLoading(false);
  };

  // =========================
  // Load Patients
  // =========================

  const loadPatients = async (clinicIdValue: string) => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name")
      .eq("clinic_id", clinicIdValue)
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setPatients(data || []);
  };

  // =========================
  // Load Medical Records
  // =========================

  const loadMedicalRecords = async (clinicIdValue: string) => {
    const { data, error } = await supabase
      .from("medical_records")
      .select("id, patient_id, cost")
      .eq("clinic_id", clinicIdValue);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    const formattedRecords: MedicalRecord[] = (data || []).map((record) => ({
      id: record.id,
      patient_id: record.patient_id,
      cost: Number(record.cost || 0),
    }));

    setMedicalRecords(formattedRecords);
  };

  // =========================
  // Load Payments
  // =========================

  const loadPayments = async (clinicIdValue: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, patient_id, amount, payment_method, payment_date, description, created_at"
      )
      .eq("clinic_id", clinicIdValue)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    const formattedPayments: Payment[] = (data || []).map((payment) => ({
      id: payment.id,
      patient_id: payment.patient_id,
      amount: Number(payment.amount || 0),
      payment_method: payment.payment_method || "Cash",
      payment_date: payment.payment_date,
      description: payment.description,
      created_at: payment.created_at,
    }));

    setPayments(formattedPayments);
  };

  useEffect(() => {
    getClinic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Helpers
  // =========================

  const getPatientName = (patientIdValue: string) => {
    const patient = patients.find((item) => item.id === patientIdValue);

    return patient?.name || "-";
  };

  const getPatientTotalCost = (patientIdValue: string) => {
    return medicalRecords
      .filter((record) => record.patient_id === patientIdValue)
      .reduce((total, record) => total + Number(record.cost || 0), 0);
  };

  const getPatientPaidAmount = (patientIdValue: string) => {
    return payments
      .filter((payment) => payment.patient_id === patientIdValue)
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  };

  const getPatientRemainingAmount = (patientIdValue: string) => {
    return Math.max(
      getPatientTotalCost(patientIdValue) - getPatientPaidAmount(patientIdValue),
      0
    );
  };

  const resetForm = () => {
    setPatientId("");
    setAmount("");
    setPaymentMethod("Cash");
    setPaymentDate("");
    setDescription("");
  };

  const handlePatientChange = (value: string) => {
    setPatientId(value);
    setAmount("");
    setError("");
  };

  // =========================
  // Add Payment
  // =========================

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!clinicId) {
      setError(isArabic ? "لم يتم العثور على العيادة." : "Clinic not found.");
      return;
    }

    if (!patientId) {
      setError(isArabic ? "يرجى اختيار مريض." : "Please select a patient.");
      return;
    }

    const amountValue = Number(amount);
    const remainingValue = getPatientRemainingAmount(patientId);

    if (!amount || amountValue <= 0) {
      setError(
        isArabic ? "يرجى إدخال مبلغ صحيح." : "Please enter a valid amount."
      );
      return;
    }

    if (remainingValue <= 0) {
      setError(
        isArabic
          ? "لا يوجد مبلغ متبقي على هذا المريض."
          : "This patient has no remaining balance."
      );
      return;
    }

    if (amountValue > remainingValue) {
      setError(
        isArabic
          ? `لا يمكن أن يكون الدفع أكبر من المبلغ المتبقي (${remainingValue.toFixed(
              2
            )}).`
          : `Payment cannot be greater than the remaining amount (${remainingValue.toFixed(
              2
            )}).`
      );
      return;
    }

    const { error: insertError } = await supabase.from("payments").insert({
      clinic_id: clinicId,
      patient_id: patientId,
      amount: amountValue,
      payment_method: paymentMethod,
      payment_date:
        paymentDate || new Date().toISOString().split("T")[0],
      description: description || null,
    });

    if (insertError) {
      console.error(insertError);

      setError(insertError.message);
      return;
    }

    setSuccess(
      isArabic ? "تمت إضافة الدفع بنجاح." : "Payment added successfully."
    );

    resetForm();
    setShowForm(false);

    await loadPayments(clinicId);
  };

  // =========================
  // Statistics
  // =========================

  const totalPayments = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const totalTreatmentCost = medicalRecords.reduce(
    (total, record) => total + Number(record.cost || 0),
    0
  );

  const totalRemaining = Math.max(totalTreatmentCost - totalPayments, 0);

  const cashTotal = payments
    .filter((payment) => payment.payment_method === "Cash")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const cardTotal = payments
    .filter((payment) => payment.payment_method === "Card")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const getMethodLabel = (method: string) => {
    if (method === "Cash") return isArabic ? "نقدي" : "Cash";
    if (method === "Card") return isArabic ? "بطاقة" : "Card";
    if (method === "Other") return isArabic ? "أخرى" : "Other";
    return method || "-";
  };

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic ? "جاري تحميل المدفوعات..." : "Loading payments..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      {/* =========================
          Top Bar
      ========================= */}

      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Back */}

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isArabic ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}

            {isArabic ? "رجوع" : "Back"}
          </button>

          {/* Language + Theme */}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextLanguage = isArabic ? "en" : "ar";

                setLanguage(nextLanguage);

                localStorage.setItem("dentalcare-language", nextLanguage);

                window.dispatchEvent(new Event("dentalcare-language-change"));
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Globe className="h-4 w-4" />
              {isArabic ? "EN" : "AR"}
            </button>

            <button
              onClick={() => {
                const nextTheme = isDark ? "light" : "dark";

                setTheme(nextTheme);

                localStorage.setItem("theme", nextTheme);
              }}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          Main Content
      ========================= */}

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isArabic ? "المدفوعات" : "Payments"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "إدارة مدفوعات المرضى وإيرادات العيادة."
                : "Manage patient payments and clinic revenue."}
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");

              if (showForm) {
                resetForm();
              }
            }}
            className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            {showForm
              ? isArabic
                ? "إلغاء"
                : "Cancel"
              : isArabic
              ? "+ إضافة دفعة"
              : "+ Add Payment"}
          </button>
        </div>

        {/* Messages */}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-600 dark:bg-green-950/30 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Statistics */}

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic ? "قيمة العلاجات" : "Treatment Value"}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalTreatmentCost.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic ? "إجمالي المدفوع" : "Total Paid"}
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {totalPayments.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic ? "إجمالي المتبقي" : "Total Remaining"}
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600">
              {totalRemaining.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic ? "نقدي" : "Cash"}
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {cashTotal.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic ? "بطاقة" : "Card"}
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {cardTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add Payment Form */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">
              {isArabic ? "إضافة دفعة جديدة" : "Add New Payment"}
            </h2>

            <form
              onSubmit={handleAddPayment}
              className="grid gap-4 md:grid-cols-2"
            >
              {/* Patient */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "المريض" : "Patient"}
                </label>

                <select
                  value={patientId}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">
                    {isArabic ? "اختر المريض" : "Select Patient"}
                  </option>

                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Summary */}

              {patientId && (
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:col-span-2">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isArabic ? "إجمالي التكلفة" : "Total Cost"}
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {getPatientTotalCost(patientId).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isArabic ? "المدفوع بالفعل" : "Already Paid"}
                      </p>

                      <p className="mt-1 text-lg font-bold text-green-600">
                        {getPatientPaidAmount(patientId).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isArabic ? "المتبقي" : "Remaining"}
                      </p>

                      <p className="mt-1 text-lg font-bold text-orange-600">
                        {getPatientRemainingAmount(patientId).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "مبلغ الدفع" : "Payment Amount"}
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={
                    patientId
                      ? getPatientRemainingAmount(patientId)
                      : undefined
                  }
                  placeholder={isArabic ? "المبلغ" : "Amount"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>

              {/* Method */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "طريقة الدفع" : "Payment Method"}
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Cash">{isArabic ? "نقدي" : "Cash"}</option>

                  <option value="Card">{isArabic ? "بطاقة" : "Card"}</option>

                  <option value="Vodafone Cash">Vodafone Cash</option>

                  <option value="Instapay">Instapay</option>

                  <option value="Other">{isArabic ? "أخرى" : "Other"}</option>
                </select>
              </div>

              {/* Date */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "تاريخ الدفع" : "Payment Date"}
                </label>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "الوصف" : "Description"}
                </label>

                <input
                  type="text"
                  placeholder={
                    isArabic ? "مثال: القسط الأول" : "Example: First installment"
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 md:col-span-2"
              >
                {isArabic ? "إضافة الدفعة" : "Add Payment"}
              </button>
            </form>
          </div>
        )}

        {/* Payment History */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-6 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isArabic ? "سجل المدفوعات" : "Payment History"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "جميع المدفوعات التي استلمتها العيادة."
                : "All payments received by the clinic."}
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد مدفوعات حتى الآن."
                  : "No payments yet."}
              </p>

              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {isArabic
                  ? 'اضغط على "إضافة دفعة" لتسجيل أول دفعة.'
                  : 'Click "Add Payment" to record the first payment.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] table-auto">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-5 py-4 text-start text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic ? "المريض" : "Patient"}
                    </th>

                    <th className="px-5 py-4 text-start text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic ? "المبلغ" : "Amount"}
                    </th>

                    <th className="px-5 py-4 text-start text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic ? "طريقة الدفع" : "Method"}
                    </th>

                    <th className="px-5 py-4 text-start text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic ? "التاريخ" : "Date"}
                    </th>

                    <th className="px-5 py-4 text-start text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic ? "الوصف" : "Description"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4 text-start font-medium text-slate-900 dark:text-white">
                        {getPatientName(payment.patient_id)}
                      </td>

                      <td className="px-5 py-4 text-start font-semibold text-green-600">
                        {payment.amount.toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-start text-slate-600 dark:text-slate-300">
                        {getMethodLabel(payment.payment_method)}
                      </td>

                      <td className="px-5 py-4 text-start text-slate-600 dark:text-slate-300">
                        {payment.payment_date || "-"}
                      </td>

                      <td className="px-5 py-4 text-start text-slate-600 dark:text-slate-300">
                        {payment.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Payments;


