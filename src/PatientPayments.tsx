import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Languages,
  Moon,
  Sun,
  Activity,
} from "lucide-react";
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
  const navigate = useNavigate();

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [medicalRecords, setMedicalRecords] =
    useState<MedicalRecord[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [language, setLanguage] =
    useState<"ar" | "en">(() => {
      const savedLanguage =
        localStorage.getItem(
          "dentalcare-language"
        );

      return savedLanguage === "ar"
        ? "ar"
        : "en";
    });

  const [isDarkMode, setIsDarkMode] =
    useState(() => {
      const savedTheme =
        localStorage.getItem(
          "dentalcare-theme"
        );

      if (savedTheme === "dark") {
        return true;
      }

      if (savedTheme === "light") {
        return false;
      }

      return document.documentElement.classList.contains(
        "dark"
      );
    });

  const isArabic =
    language === "ar";

  // =========================
  // Language & Theme
  // =========================

  useEffect(() => {
    const handleLanguageChange = () => {
      const currentLanguage =
        localStorage.getItem(
          "dentalcare-language"
        ) === "ar"
          ? "ar"
          : "en";

      setLanguage(
        currentLanguage
      );
    };

    const handleThemeChange = () => {
      const savedTheme =
        localStorage.getItem(
          "dentalcare-theme"
        );

      setIsDarkMode(
        savedTheme === "dark" ||
          document.documentElement.classList.contains(
            "dark"
          )
      );
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleLanguageChange
    );

    window.addEventListener(
      "dentalcare-theme-change",
      handleThemeChange
    );

    window.addEventListener(
      "storage",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );

      window.removeEventListener(
        "dentalcare-theme-change",
        handleThemeChange
      );

      window.removeEventListener(
        "storage",
        handleThemeChange
      );
    };
  }, []);

  const toggleLanguage = () => {
    const nextLanguage =
      language === "ar"
        ? "en"
        : "ar";

    setLanguage(nextLanguage);

    localStorage.setItem(
      "dentalcare-language",
      nextLanguage
    );

    window.dispatchEvent(
      new Event(
        "dentalcare-language-change"
      )
    );
  };

  const toggleTheme = () => {
    const nextDarkMode =
      !isDarkMode;

    setIsDarkMode(nextDarkMode);

    localStorage.setItem(
      "dentalcare-theme",
      nextDarkMode
        ? "dark"
        : "light"
    );

    document.documentElement.classList.toggle(
      "dark",
      nextDarkMode
    );

    window.dispatchEvent(
      new Event(
        "dentalcare-theme-change"
      )
    );
  };

  // =========================
  // Load patient records + payments (كل ملفات المريض)
  // =========================

  const loadData = async () => {
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
        navigate("/patient/login", {
          replace: true,
        });

        return;
      }

      const {
        data: patientsData,
        error: patientsError,
      } = await supabase
        .from("patients")
        .select(
          "id, name, clinic_id"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (patientsError) {
        throw patientsError;
      }

      if (
        !patientsData ||
        patientsData.length === 0
      ) {
        throw new Error(
          isArabic
            ? "حسابك غير مرتبط بسجل مريض."
            : "Your account is not connected to a patient record."
        );
      }

      const patientList =
        patientsData as Patient[];

      const savedClinicId =
        localStorage.getItem(
          "dentalcare-selected-clinic"
        );

      setPatient(
        (savedClinicId &&
          patientList.find(
            (item) =>
              item.clinic_id ===
              savedClinicId
          )) ||
          patientList[0]
      );

      const patientIds =
        patientList.map(
          (item) => item.id
        );

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
        .in(
          "patient_id",
          patientIds
        )
        .order(
          "treatment_date",
          {
            ascending: false,
          }
        );

      if (medicalRecordsError) {
        throw medicalRecordsError;
      }

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
        .in(
          "patient_id",
          patientIds
        )
        .order(
          "payment_date",
          {
            ascending: false,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (paymentsError) {
        throw paymentsError;
      }

      setMedicalRecords(
        (medicalRecordsData || []).map(
          (record) => ({
            id: record.id,
            treatment_date:
              record.treatment_date,
            tooth_number:
              record.tooth_number,
            diagnosis:
              record.diagnosis,
            treatment_type:
              record.treatment_type,
            treatment_details:
              record.treatment_details,
            cost: Number(
              record.cost || 0
            ),
          })
        )
      );

      setPayments(
        (paymentsData || []).map(
          (payment) => ({
            id: payment.id,
            medical_record_id:
              payment.medical_record_id,
            amount: Number(
              payment.amount || 0
            ),
            payment_method:
              payment.payment_method ||
              "Cash",
            payment_date:
              payment.payment_date,
            description:
              payment.description ||
              null,
            notes:
              payment.notes ||
              null,
            created_at:
              payment.created_at,
          })
        )
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

  // =========================
  // Initial load
  // =========================

  useEffect(() => {
    loadData();
  }, []);

  const getRecordPayments = (
    recordId: string
  ) => {
    return payments.filter(
      (payment) =>
        payment.medical_record_id ===
        recordId
    );
  };

  const getRecordPaidAmount = (
    recordId: string
  ) => {
    return getRecordPayments(
      recordId
    ).reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );
  };

  const getRecordRemainingAmount = (
    record: MedicalRecord
  ) => {
    const cost = Number(
      record.cost || 0
    );

    const paid =
      getRecordPaidAmount(
        record.id
      );

    return Math.max(
      cost - paid,
      0
    );
  };

  const totalCost = useMemo(() => {
    return medicalRecords.reduce(
      (total, record) =>
        total +
        Number(
          record.cost || 0
        ),
      0
    );
  }, [medicalRecords]);

  const totalPaid = useMemo(() => {
    return payments.reduce(
      (total, payment) =>
        total +
        Number(
          payment.amount || 0
        ),
      0
    );
  }, [payments]);

  const totalRemaining =
    Math.max(
      totalCost - totalPaid,
      0
    );

  const formatMoney = (
    amount: number
  ) => {
    return `${amount.toFixed(
      2
    )} EGP`;
  };

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(
        `${date}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      isArabic
        ? "ar-EG"
        : "en-US",
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

    const record =
      medicalRecords.find(
        (item) =>
          item.id === recordId
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
        return isArabic
          ? "كاش"
          : "Cash";

      case "Card":
        return isArabic
          ? "بطاقة"
          : "Card";

      case "Vodafone Cash":
        return isArabic
          ? "فودافون كاش"
          : "Vodafone Cash";

      case "Instapay":
        return "Instapay";

      case "Other":
        return isArabic
          ? "أخرى"
          : "Other";

      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل المدفوعات..."
            : "Loading payments..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12"
      >
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                aria-label={
                  isArabic
                    ? "رجوع"
                    : "Go back"
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isArabic ? (
                  <ArrowRight className="h-5 w-5" />
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                  <Activity className="h-5 w-5" />
                </div>

                <div className="leading-tight">
                  <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    DentalCare
                  </p>

                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? "رعاية أسنانك"
                      : "Dental Care Platform"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  toggleLanguage
                }
                aria-label={
                  isArabic
                    ? "تغيير اللغة"
                    : "Change language"
                }
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Languages className="h-4 w-4" />

                <span className="hidden sm:inline">
                  {isArabic
                    ? "English"
                    : "العربية"}
                </span>
              </button>

              <button
                type="button"
                onClick={
                  toggleTheme
                }
                aria-label={
                  isDarkMode
                    ? isArabic
                      ? "الوضع الفاتح"
                      : "Light mode"
                    : isArabic
                    ? "الوضع الداكن"
                    : "Dark mode"
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
              <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
                {isArabic
                  ? "حدث خطأ"
                  : "Something went wrong"}
              </h2>

              <p className="text-red-600 dark:text-red-300">
                {error}
              </p>

              <button
                onClick={loadData}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                {isArabic
                  ? "إعادة المحاولة"
                  : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-gray-50 pb-6 dark:bg-gray-900"
    >
      {/* Header */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              aria-label={
                isArabic
                  ? "رجوع"
                  : "Go back"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isArabic ? (
                <ArrowRight className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Activity className="h-5 w-5" />
              </div>

              <div className="leading-tight">
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  DentalCare
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "رعاية أسنانك"
                    : "Dental Care Platform"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={
                toggleLanguage
              }
              aria-label={
                isArabic
                  ? "تغيير اللغة"
                  : "Change language"
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Languages className="h-4 w-4" />

              <span className="hidden sm:inline">
                {isArabic
                  ? "English"
                  : "العربية"}
              </span>
            </button>

            <button
              type="button"
              onClick={
                toggleTheme
              }
              aria-label={
                isDarkMode
                  ? isArabic
                    ? "الوضع الفاتح"
                    : "Light mode"
                  : isArabic
                  ? "الوضع الداكن"
                  : "Dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 md:px-6">
        <div className="mx-auto max-w-7xl">

          {/* Header */}

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {isArabic
                ? "المدفوعات"
                : "Payments"}
            </h1>

            {patient?.name && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {patient.name}
              </p>
            )}
          </div>

          {/* Summary Cards */}

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Total Cost */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isArabic
                      ? "إجمالي التكلفة"
                      : "Total Cost"}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatMoney(
                      totalCost
                    )}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/30">
                  💰
                </div>
              </div>
            </div>

            {/* Total Paid */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isArabic
                      ? "إجمالي المدفوع"
                      : "Total Paid"}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatMoney(
                      totalPaid
                    )}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl dark:bg-green-900/30">
                  ✓
                </div>
              </div>
            </div>

            {/* Remaining */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isArabic
                      ? "المتبقي"
                      : "Remaining"}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatMoney(
                      totalRemaining
                    )}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl dark:bg-orange-900/30">
                  ⏳
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Sessions */}

          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-5 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isArabic
                  ? "الجلسات والعلاجات"
                  : "Treatment Sessions"}
              </h2>
            </div>

            {medicalRecords.length ===
            0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {isArabic
                  ? "لا توجد جلسات علاج مسجلة حتى الآن."
                  : "No treatment sessions found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
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
                    {medicalRecords.map(
                      (record) => {
                        const paid =
                          getRecordPaidAmount(
                            record.id
                          );

                        const remaining =
                          getRecordRemainingAmount(
                            record
                          );

                        return (
                          <tr
                            key={
                              record.id
                            }
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
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {isArabic
                                    ? `السن: ${record.tooth_number}`
                                    : `Tooth: ${record.tooth_number}`}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                              {formatMoney(
                                Number(
                                  record.cost ||
                                    0
                                )
                              )}
                            </td>

                            <td className="px-4 py-4 font-medium text-green-600 dark:text-green-400">
                              {formatMoney(
                                paid
                              )}
                            </td>

                            <td className="px-4 py-4 font-medium text-orange-600 dark:text-orange-400">
                              {formatMoney(
                                remaining
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment History */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-5 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isArabic
                  ? "سجل المدفوعات"
                  : "Payment History"}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isArabic
                  ? "جميع الدفعات التي قام الطبيب بتسجيلها"
                  : "All payments recorded by your doctor"}
              </p>
            </div>

            {payments.length ===
            0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {isArabic
                  ? "لا توجد مدفوعات مسجلة حتى الآن."
                  : "No payments recorded yet."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
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
                    {payments.map(
                      (payment) => (
                        <tr
                          key={
                            payment.id
                          }
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
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Information */}

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isArabic
                ? "ملاحظة: يتم تحديث بيانات المدفوعات من خلال الطبيب أو العيادة. لا يمكنك تعديل بيانات الدفع من هذه الصفحة."
                : "Note: Payment information is managed by your doctor or clinic. You cannot edit payment information from this page."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
