import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  FileText,
  Languages,
  Moon,
  Pill,
  Sun,
  User,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { supabase } from "./supabase";

type Language = "ar" | "en";

type Patient = {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  medical_notes: string | null;
  case_status: string | null;
  clinic_id: string | null;
  created_at: string;
};

type MedicalRecord = {
  id: string;
  treatment_date: string | null;
  diagnosis: string | null;
  cost: number | null;
  doctor_notes: string | null;
};

type Prescription = {
  id: string;
  prescription_date: string | null;
  medicine_name: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  doctor_notes: string | null;
};

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem("dentalcare-language");
  return saved === "en" ? "en" : "ar";
};

const getInitialTheme = () => {
  return localStorage.getItem("dentalcare-theme") === "dark";
};

export default function PatientMedicalFile() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState("");

  const isArabic = language === "ar";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);

    localStorage.setItem(
      "dentalcare-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = isArabic ? "ar" : "en";

    localStorage.setItem("dentalcare-language", language);
  }, [isArabic, language]);

  const toggleLanguage = () => {
    setLanguage((current) => (current === "ar" ? "en" : "ar"));
  };

  const toggleTheme = () => {
    setIsDarkMode((current) => !current);
  };

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/patient/login");
          return;
        }

        const { data, error: patientsError } = await supabase
          .from("patients")
          .select(
            "id, name, age, gender, medical_notes, case_status, clinic_id, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (patientsError) {
          throw patientsError;
        }

        const patientList = (data || []) as Patient[];

        setPatients(patientList);

        if (patientList.length === 0) {
          setSelectedPatientId("");
          return;
        }

        const savedClinicId = localStorage.getItem(
          "dentalcare-selected-clinic"
        );

        const savedPatient =
          savedClinicId &&
          patientList.find(
            (patient) => patient.clinic_id === savedClinicId
          );

        setSelectedPatientId(
          savedPatient?.id || patientList[0].id
        );
      } catch (err) {
        console.error("Error loading patients:", err);

        setError(
          isArabic
            ? "حدث خطأ أثناء تحميل الملف الطبي."
            : "An error occurred while loading the medical file."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [navigate, isArabic]);

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => patient.id === selectedPatientId
      ) || null,
    [patients, selectedPatientId]
  );

  useEffect(() => {
    const loadMedicalData = async () => {
      if (!selectedPatientId) {
        setMedicalRecords([]);
        setPrescriptions([]);
        return;
      }

      setRecordsLoading(true);
      setError("");

      try {
        const [recordsResult, prescriptionsResult] =
          await Promise.all([
            supabase
              .from("medical_records")
              .select(
                "id, treatment_date, diagnosis, cost, doctor_notes"
              )
              .eq("patient_id", selectedPatientId)
              .order("treatment_date", { ascending: false }),

            supabase
              .from("prescriptions")
              .select(
                "id, prescription_date, medicine_name, dosage, frequency, duration, instructions, doctor_notes"
              )
              .eq("patient_id", selectedPatientId)
              .order("prescription_date", { ascending: false }),
          ]);

        if (recordsResult.error) {
          throw recordsResult.error;
        }

        if (prescriptionsResult.error) {
          throw prescriptionsResult.error;
        }

        setMedicalRecords(
          (recordsResult.data || []) as MedicalRecord[]
        );

        setPrescriptions(
          (prescriptionsResult.data || []) as Prescription[]
        );
      } catch (err) {
        console.error("Error loading medical data:", err);

        setError(
          isArabic
            ? "حدث خطأ أثناء تحميل بيانات الملف الطبي."
            : "An error occurred while loading medical data."
        );
      } finally {
        setRecordsLoading(false);
      }
    };

    loadMedicalData();
  }, [selectedPatientId, isArabic]);

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    try {
      return new Intl.DateTimeFormat(
        isArabic ? "ar-EG" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ).format(new Date(date));
    } catch {
      return date;
    }
  };

  const getCaseStatusLabel = (status: string | null) => {
    if (!status) {
      return isArabic ? "غير محدد" : "Not specified";
    }

    const normalized = status.toLowerCase();

    if (
      normalized === "active" ||
      normalized === "open" ||
      normalized === "مفتوح"
    ) {
      return isArabic ? "الحالة مستمرة" : "Active";
    }

    if (
      normalized === "completed" ||
      normalized === "closed" ||
      normalized === "مكتمل"
    ) {
      return isArabic ? "تم الانتهاء" : "Completed";
    }

    if (
      normalized === "follow_up" ||
      normalized === "follow-up" ||
      normalized === "متابعة"
    ) {
      return isArabic ? "تحتاج متابعة" : "Follow-up";
    }

    return status;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={isArabic ? "رجوع" : "Go back"}
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
              onClick={toggleLanguage}
              aria-label={
                isArabic
                  ? "تغيير اللغة"
                  : "Change language"
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Languages className="h-4 w-4" />

              <span className="hidden sm:inline">
                {isArabic ? "English" : "العربية"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
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

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-400" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        ) : patients.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <User className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "لا يوجد ملف طبي"
                : "No medical file found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {isArabic
                ? "لم يتم العثور على سجل مريض مرتبط بحسابك."
                : "No patient record is currently linked to your account."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {patients.length > 1 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic
                    ? "اختر الملف الطبي"
                    : "Select medical file"}
                </label>

                <select
                  value={selectedPatientId}
                  onChange={(event) =>
                    setSelectedPatientId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-900"
                >
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPatient && (
              <>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      <User className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {isArabic
                          ? "بيانات المريض"
                          : "Patient Information"}
                      </h2>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedPatient.name}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isArabic ? "الاسم" : "Name"}
                      </p>

                      <p className="font-semibold text-slate-900 dark:text-white">
                        {selectedPatient.name || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isArabic ? "العمر" : "Age"}
                      </p>

                      <p className="font-semibold text-slate-900 dark:text-white">
                        {selectedPatient.age
                          ? `${selectedPatient.age} ${
                              isArabic ? "سنة" : "years"
                            }`
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isArabic ? "النوع" : "Gender"}
                      </p>

                      <p className="font-semibold text-slate-900 dark:text-white">
                        {selectedPatient.gender || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "حالة الحالة"
                          : "Case Status"}
                      </p>

                      <p className="font-semibold text-teal-700 dark:text-teal-300">
                        {getCaseStatusLabel(
                          selectedPatient.case_status
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedPatient.medical_notes && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <div className="flex items-start gap-3">
                        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

                        <div>
                          <p className="mb-1 text-sm font-bold text-amber-800 dark:text-amber-300">
                            {isArabic
                              ? "ملاحظات طبية"
                              : "Medical Notes"}
                          </p>

                          <p className="text-sm leading-6 text-amber-700 dark:text-amber-400">
                            {selectedPatient.medical_notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <Stethoscope className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {isArabic
                          ? "السجلات الطبية"
                          : "Medical Records"}
                      </h2>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "سجل الزيارات والعلاجات المسجلة."
                          : "Your recorded visits and treatments."}
                      </p>
                    </div>
                  </div>

                  {recordsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-400" />
                    </div>
                  ) : medicalRecords.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800/60">
                      <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-400" />

                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "لا توجد سجلات طبية حتى الآن."
                          : "No medical records yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {medicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <CalendarDays className="h-4 w-4 text-teal-600 dark:text-teal-400" />

                              {formatDate(record.treatment_date)}
                            </div>

                            {record.cost !== null && (
                              <div className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                                {record.cost}{" "}
                                {isArabic ? "جنيه" : "EGP"}
                              </div>
                            )}
                          </div>

                          {record.diagnosis && (
                            <div className="mb-3">
                              <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {isArabic
                                  ? "التشخيص"
                                  : "Diagnosis"}
                              </p>

                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {record.diagnosis}
                              </p>
                            </div>
                          )}

                          {record.doctor_notes && (
                            <div>
                              <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {isArabic
                                  ? "ملاحظات الطبيب"
                                  : "Doctor Notes"}
                              </p>

                              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {record.doctor_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <Pill className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {isArabic
                          ? "الوصفات الطبية"
                          : "Prescriptions"}
                      </h2>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "الأدوية والتعليمات المسجلة بواسطة الطبيب."
                          : "Medicines and instructions prescribed by your doctor."}
                      </p>
                    </div>
                  </div>

                  {recordsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-400" />
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800/60">
                      <Pill className="mx-auto mb-3 h-8 w-8 text-slate-400" />

                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "لا توجد وصفات طبية حتى الآن."
                          : "No prescriptions yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {prescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-bold text-slate-900 dark:text-white">
                                {prescription.medicine_name ||
                                  "—"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {formatDate(
                                  prescription.prescription_date
                                )}
                              </p>
                            </div>

                            <Pill className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
                          </div>

                          <div className="space-y-3">
                            {prescription.dosage && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {isArabic
                                    ? "الجرعة"
                                    : "Dosage"}
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                  {prescription.dosage}
                                </p>
                              </div>
                            )}

                            {prescription.frequency && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {isArabic
                                    ? "عدد المرات"
                                    : "Frequency"}
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                  {prescription.frequency}
                                </p>
                              </div>
                            )}

                            {prescription.duration && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {isArabic
                                    ? "مدة العلاج"
                                    : "Duration"}
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                  {prescription.duration}
                                </p>
                              </div>
                            )}

                            {prescription.instructions && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {isArabic
                                    ? "التعليمات"
                                    : "Instructions"}
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  {prescription.instructions}
                                </p>
                              </div>
                            )}

                            {prescription.doctor_notes && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {isArabic
                                    ? "ملاحظات الطبيب"
                                    : "Doctor Notes"}
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  {prescription.doctor_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {isArabic
                          ? "الأشعة والصور"
                          : "X-Rays & Images"}
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "سيتم عرض الأشعة والصور الطبية هنا عند إضافتها إلى ملفك من خلال العيادة."
                          : "X-rays and medical images will appear here when added to your file by the clinic."}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}