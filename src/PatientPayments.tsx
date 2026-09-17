import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

type MedicalRecord = {
  id: string;
  treatment_date: string;
  tooth_number: string | null;
  diagnosis: string | null;
  treatment_type: string | null;
  treatment_details: string | null;
  cost: number | null;
};

type Payment = {
  id: string;
  medical_record_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string | null;
  notes: string | null;
  created_at: string;
};

type Patient = {
  id: string;
  name: string;
  clinic_id: string;
};

export default function PatientPayments() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<
    MedicalRecord[]
  >([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<"ar" | "en">("en");

  const isArabic = language === "ar";

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("dentalcare-language") === "ar"
        ? "ar"
        : "en";

    setLanguage(savedLanguage);

    const handleLanguageChange = () => {
      const currentLanguage =
        localStorage.getItem("dentalcare-language") === "ar"
          ? "ar"
          : "en";

      setLanguage(currentLanguage);
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
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          isArabic
            ? "يجب تسجيل الدخول أولاً."
            : "You must be logged in."
        );
      }

      // Get all patient records connected to this account
      const {
        data: patientsData,
        error: patientsError,
      } = await supabase
        .from("patients")
        .select("id, name, clinic_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (patientsError) {
        throw patientsError;
      }

      if (!patientsData || patientsData.length === 0) {
        throw new Error(
          isArabic
            ? "حسابك غير مرتبط بسجل مريض."
            : "Your account is not connected to a patient record."
        );
      }

      const patientIds = patientsData.map(
        (patient) => patient.id
      );

      setPatient(patientsData[0]);

      // Get all treatment sessions
      const {
        data: medicalRecordsData,
        error: medicalRecordsError,
      } = await supabase
        .from("medical_records")
        .select(
          `
            id,
            treatment_date,
            tooth_number,
            diagnosis,
            treatment_type,
            treatment_details,
            cost
          `
        )
        .in("patient_id", patientIds)
        .order("treatment_date", {
          ascending: false,
        });

      if (medicalRecordsError) {
        throw medicalRecordsError;
      }

      // Get all payments entered by the doctor
      const {
        data: paymentsData,
        error: paymentsError,
      } = await supabase
        .from("payments")
        .select(
          `
            id,
            medical_record_id,
            amount,
            payment_method,
            payment_date,
            description,
            notes,
            created_at
          `
        )
        .in("patient_id", patientIds)
        .order("payment_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (paymentsError) {
        throw paymentsError;
      }

      setMedicalRecords(
        (medicalRecordsData || []).map((record) => ({
          id: record.id,
          treatment_date: record.treatment_date,
          tooth_number: record.tooth_number,
          diagnosis: record.diagnosis,
          treatment_type: record.treatment_type,
          treatment_details: record.treatment_details,
          cost: Number(record.cost || 0),
        }))
      );

      setPayments(
        (paymentsData || []).map((payment) => ({
          id: payment.id,
          medical_record_id: payment.medical_record_id,
          amount: Number(payment.amount || 0),
          payment_method:
            payment.payment_method || "Cash",
          payment_date: payment.payment_date,
          description: payment.description || null,
          notes: payment.notes || null,
          created_at: payment.created_at,
        }))
      );
    } catch (err: any) {
      console.error(
        "Error loading patient payments:",
        err
      );

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء تحميل المدفوعات."
            : "Failed to load payments.")
      );
    } finally {
      setLoading(false);
    }
  };

  const getRecordPayments = (recordId: string) => {
    return payments.filter(
      (payment) =>
        payment.medical_record_id === recordId
    );
  };

  const getRecordPaidAmount = (recordId: string) => {
    return getRecordPayments(recordId).reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );
  };

  const getRecordRemainingAmount = (
    record: MedicalRecord
  ) => {
    const cost = Number(record.cost || 0);
    const paid = getRecordPaidAmount(record.id);

    return Math.max(cost - paid, 0);
  };

  const totalCost = useMemo(() => {
    return medicalRecords.reduce(
      (total, record) =>
        total + Number(record.cost || 0),
      0
    );
  }, [medicalRecords]);

  const totalPaid = useMemo(() => {
    return payments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );
  }, [payments]);

  const totalRemaining = Math.max(
    totalCost - totalPaid,
    0
  );

  const formatMoney = (amount: number) => {
    return `${amount.toFixed(2)} EGP`;
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      isArabic ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const getTreatmentName = (
    recordId: string | null
  ) => {
    if (!recordId) {
      return isArabic
        ? "دفعة عامة"
        : "General Payment";
    }

    const record = medicalRecords.find(
      (item) => item.id === recordId
    );

    if (!record) {
      return isArabic
        ? "جلسة علاج"
        : "Treatment Session";
    }

    return (
      record.treatment_type ||
      record.diagnosis ||
      (isArabic
        ? "جلسة علاج"
        : "Treatment Session")
    );
  };

  const getPaymentMethodLabel = (
    method: string
  ) => {
    switch (method) {
      case "Cash":
        return isArabic ? "كاش" : "Cash";

      case "Card":
        return isArabic ? "بطاقة" : "Card";

      case "Vodafone Cash":
        return isArabic
          ? "فودافون كاش"
          : "Vodafone Cash";

      case "Instapay":
        return "Instapay";

      case "Other":
        return isArabic ? "أخرى" : "Other";

      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600 dark:text-gray-300">
            {isArabic
              ? "جاري تحميل المدفوعات..."
              : "Loading payments..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
              {isArabic
                ? "حدث خطأ"
                : "Something went wrong"}
            </h2>

            <p className="text-red-600 dark:text-red-300">
              {error}
            </p>

            <button
              onClick={loadPayments}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {isArabic
                ? "إعادة المحاولة"
                : "Try Again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isArabic
              ? "المدفوعات"
              : "Payments"}
          </h1>

          {patient?.name && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {patient.name}
            </p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* Total Cost */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic
                    ? "إجمالي التكلفة"
                    : "Total Cost"}
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatMoney(totalCost)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>

          {/* Total Paid */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic
                    ? "إجمالي المدفوع"
                    : "Total Paid"}
                </p>

                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatMoney(totalPaid)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic
                    ? "المتبقي"
                    : "Remaining"}
                </p>

                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {formatMoney(totalRemaining)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl">
                ⏳
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">

          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isArabic
                ? "الجلسات والعلاجات"
                : "Treatment Sessions"}
            </h2>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {isArabic
                ? "لا توجد جلسات علاج مسجلة حتى الآن."
                : "No treatment sessions found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "التاريخ"
                        : "Date"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "العلاج"
                        : "Treatment"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "التكلفة"
                        : "Cost"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "المدفوع"
                        : "Paid"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "المتبقي"
                        : "Remaining"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {medicalRecords.map((record) => {
                    const paid =
                      getRecordPaidAmount(record.id);

                    const remaining =
                      getRecordRemainingAmount(
                        record
                      );

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(
                            record.treatment_date
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {record.treatment_type ||
                              record.diagnosis ||
                              (isArabic
                                ? "جلسة علاج"
                                : "Treatment Session")}
                          </div>

                          {record.tooth_number && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {isArabic
                                ? `السن: ${record.tooth_number}`
                                : `Tooth: ${record.tooth_number}`}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                          {formatMoney(
                            Number(record.cost || 0)
                          )}
                        </td>

                        <td className="px-4 py-4 font-medium text-green-600 dark:text-green-400">
                          {formatMoney(paid)}
                        </td>

                        <td className="px-4 py-4 font-medium text-orange-600 dark:text-orange-400">
                          {formatMoney(remaining)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isArabic
                ? "سجل المدفوعات"
                : "Payment History"}
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isArabic
                ? "جميع الدفعات التي قام الطبيب بتسجيلها"
                : "All payments recorded by your doctor"}
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {isArabic
                ? "لا توجد مدفوعات مسجلة حتى الآن."
                : "No payments recorded yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm">
                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "التاريخ"
                        : "Date"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "الجلسة"
                        : "Session"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "المبلغ"
                        : "Amount"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "طريقة الدفع"
                        : "Payment Method"}
                    </th>

                    <th className="px-4 py-3 text-start">
                      {isArabic
                        ? "التفاصيل"
                        : "Details"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(
                          payment.payment_date
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {getTreatmentName(
                          payment.medical_record_id
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-green-600 dark:text-green-400">
                        {formatMoney(
                          payment.amount
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {getPaymentMethodLabel(
                            payment.payment_method
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {payment.description ||
                          payment.notes ||
                          "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {isArabic
              ? "ملاحظة: يتم تحديث بيانات المدفوعات من خلال الطبيب أو العيادة. لا يمكنك تعديل بيانات الدفع من هذه الصفحة."
              : "Note: Payment information is managed by your doctor or clinic. You cannot edit payment information from this page."}
          </p>
        </div>
      </div>
    </div>
  );
}