import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Clock,
  Globe,
  Moon,
  Pencil,
  Pill,
  Plus,
  Printer,
  Sun,
  Trash2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseAnonKey } from "./supabase";
import { translations, type Language } from "./i18n";
import XrayGallery from "./XrayGallery";

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
  user_id: string | null;
  login_email: string | null;
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
  group_id: string | null;
  item_order: number | null;
};

// روشتة واحدة = مجموعة أدوية
type PrescriptionGroup = {
  key: string;
  date: string;
  items: Prescription[];
};

type DurationUnit = "days" | "weeks" | "months";

// دواء داخل فورم الروشتة
type MedicineItem = {
  key: string;
  id?: string;
  medicine_name: string;
  dosage: string;
  // عدد المرات في اليوم (رقم)
  timesPerDay: string;
  // لو الدواء قديم وعدد المرات مكتوب كنص حر
  customFrequency: string;
  // عدد الأيام (رقم) + الوحدة
  days: string;
  durationUnit: DurationUnit;
  // لو الدواء قديم والمدة مكتوبة كنص حر
  customDuration: string;
  instructions: string;
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

const generateRandomPassword = (length = 8) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values)
    .map((value) => chars[value % chars.length])
    .join("");
};

const normalizeEgyptianPhone = (value: string) => {
  const cleaned = value.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+20")) return cleaned;
  if (cleaned.startsWith("20")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+20${cleaned.substring(1)}`;
  return cleaned;
};

const generateInternalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const emptyMedicine = (): MedicineItem => ({
  key: generateInternalId(),
  medicine_name: "",
  dosage: "",
  timesPerDay: "",
  customFrequency: "",
  days: "",
  durationUnit: "days",
  customDuration: "",
  instructions: "",
});

// ============================================
// أدوات الروشتة: تحويل (عدد المرات / عدد الأيام) إلى نص والعكس
// الداتابيز لسه بتخزن frequency و duration كنص، فمفيش تغيير في الـ SQL
// ============================================

const TIMES_OPTIONS = [1, 2, 3, 4];
const DAYS_OPTIONS = [3, 5, 7, 10, 14];

const INSTRUCTION_CHIPS_AR = [
  "بعد الأكل",
  "قبل الأكل",
  "مع الأكل",
  "على معدة فاضية",
  "قبل النوم",
];

const INSTRUCTION_CHIPS_EN = [
  "After meals",
  "Before meals",
  "With meals",
  "On an empty stomach",
  "Before bed",
];

const toPositiveNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

const buildFrequencyText = (item: MedicineItem, isArabic: boolean) => {
  const n = toPositiveNumber(item.timesPerDay);

  if (n > 0) {
    if (isArabic) {
      if (n === 1) return "مرة واحدة يوميًا";
      if (n === 2) return "مرتين يوميًا";
      if (n <= 10) return `${n} مرات يوميًا`;
      return `${n} مرة يوميًا`;
    }

    if (n === 1) return "Once daily";
    if (n === 2) return "Twice daily";
    return `${n} times daily`;
  }

  return item.customFrequency.trim();
};

const buildDurationText = (item: MedicineItem, isArabic: boolean) => {
  const n = toPositiveNumber(item.days);

  if (n > 0) {
    if (isArabic) {
      if (item.durationUnit === "weeks") {
        if (n === 1) return "أسبوع";
        if (n === 2) return "أسبوعين";
        if (n <= 10) return `${n} أسابيع`;
        return `${n} أسبوعًا`;
      }

      if (item.durationUnit === "months") {
        if (n === 1) return "شهر";
        if (n === 2) return "شهرين";
        if (n <= 10) return `${n} شهور`;
        return `${n} شهرًا`;
      }

      if (n === 1) return "يوم واحد";
      if (n === 2) return "يومين";
      if (n <= 10) return `${n} أيام`;
      return `${n} يومًا`;
    }

    const unitWord =
      item.durationUnit === "weeks"
        ? "week"
        : item.durationUnit === "months"
        ? "month"
        : "day";

    return `${n} ${unitWord}${n === 1 ? "" : "s"}`;
  }

  return item.customDuration.trim();
};

// بيقرأ النص القديم (عربي أو إنجليزي) ويرجّع الرقم لو لقاه
const parseFrequencyText = (text: string | null) => {
  const value = (text || "").trim();

  if (!value) return { times: "", custom: "" };

  const digits = value.match(/\d+/);
  if (digits) return { times: digits[0], custom: "" };

  const lower = value.toLowerCase();

  if (value.includes("مرتين") || lower.includes("twice")) {
    return { times: "2", custom: "" };
  }

  if (value.includes("مرة") || lower.includes("once")) {
    return { times: "1", custom: "" };
  }

  return { times: "", custom: value };
};

const parseDurationText = (
  text: string | null
): { days: string; unit: DurationUnit; custom: string } => {
  const value = (text || "").trim();

  if (!value) return { days: "", unit: "days", custom: "" };

  const lower = value.toLowerCase();

  let unit: DurationUnit = "days";

  if (value.includes("أسبوع") || value.includes("اسبوع") || lower.includes("week")) {
    unit = "weeks";
  } else if (value.includes("شهر") || value.includes("شهور") || lower.includes("month")) {
    unit = "months";
  }

  const digits = value.match(/\d+/);
  if (digits) return { days: digits[0], unit, custom: "" };

  if (value.includes("أسبوعين") || value.includes("اسبوعين") || value.includes("شهرين") || value.includes("يومين")) {
    return { days: "2", unit, custom: "" };
  }

  if (
    value.includes("يوم") ||
    value.includes("أسبوع") ||
    value.includes("اسبوع") ||
    value.includes("شهر")
  ) {
    return { days: "1", unit, custom: "" };
  }

  return { days: "", unit: "days", custom: value };
};

const medicineHasAnyDetails = (item: MedicineItem) =>
  Boolean(
    item.dosage.trim() ||
      item.timesPerDay.trim() ||
      item.customFrequency.trim() ||
      item.days.trim() ||
      item.customDuration.trim() ||
      item.instructions.trim()
  );

const rxLabel =
  "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400";

const rxInput =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500";

const chipBase =
  "rounded-lg border px-3.5 py-2 text-sm font-bold transition";

const chipOn =
  "border-teal-600 bg-teal-600 text-white shadow-sm";

const chipOff =
  "border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-teal-950/30";

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
      {value}
    </p>
  </div>
);

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
  const [editingGroupKey, setEditingGroupKey] =
    useState<string | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
    emptyMedicine(),
  ]);
  // خطأ الروشتة بيظهر جوه الفورم نفسه (عشان مايضيعش فوق في الصفحة)
  const [prescriptionError, setPrescriptionError] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  // حساب دخول المريض
  const [accountPassword, setAccountPassword] = useState("");
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // عرض كلمة السر المحفوظة للدكتور
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordUnavailable, setPasswordUnavailable] = useState(false);
  const [revealedCopied, setRevealedCopied] = useState(false);

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

  // إشعار للمريض لما الدكتور يضيف حاجة (لو فشل مبيوقفش العملية)
  const notifyPatient = async (title: string, message: string) => {
    if (!clinicId || !id || !patient?.user_id) return;

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert({
        clinic_id: clinicId,
        patient_id: id,
        recipient_type: "patient",
        title,
        message,
        is_read: false,
      });

    if (notifyError) {
      console.error("Notification error:", notifyError);
    }
  };

  // رسالة خطأ مفهومة لأخطاء قاعدة البيانات
  const describeDbError = (dbError: {
    message?: string;
    code?: string;
  }) => {
    const message = dbError.message || "";
    const lower = message.toLowerCase();

    let hint = "";

    if (
      dbError.code === "42P01" ||
      dbError.code === "PGRST205" ||
      lower.includes("schema cache") ||
      lower.includes("does not exist")
    ) {
      hint = isArabic
        ? "الجدول أو العمود المطلوب مش موجود في Supabase. شغّل ملف SQL الجديد."
        : "A required table or column is missing in Supabase. Run the new SQL file.";
    } else if (
      dbError.code === "42501" ||
      lower.includes("row-level security")
    ) {
      hint = isArabic
        ? "مفيش صلاحية للإضافة (RLS) في Supabase. شغّل ملف SQL الجديد."
        : "No permission to insert (RLS) in Supabase. Run the new SQL file.";
    } else if (dbError.code === "23502" || lower.includes("null value")) {
      hint = isArabic
        ? "فيه بيان إجباري ناقص."
        : "A required field is missing.";
    }

    return `${hint}${hint ? " " : ""}(${message})`;
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
          "id, prescription_date, medicine_name, dosage, frequency, duration, instructions, doctor_notes, group_id, item_order"
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

  // إنشاء حساب دخول للمريض خاص بالعيادة دي فقط
  // كل عيادة مستقلة: نفس الرقم ممكن يتسجل في أكتر من عيادة بحساب وباسورد منفصلين
  const handleCreatePatientAccount = async () => {
    if (!id || !clinicId || !patient) return;

    if (patient.user_id) {
      setError(
        isArabic
          ? "هذا المريض لديه حساب بالفعل."
          : "This patient already has an account."
      );
      return;
    }

    if (!patient.phone) {
      setError(
        isArabic
          ? "أضف رقم تليفون للمريض أولًا لأنه سيسجل الدخول به."
          : "Add a phone number for this patient first, since it is used to log in."
      );
      return;
    }

    const normalizedPhone = normalizeEgyptianPhone(patient.phone);

    if (!/^\+201[0125]\d{8}$/.test(normalizedPhone)) {
      setError(
        isArabic
          ? "رقم التليفون غير صحيح. يجب أن يكون رقمًا مصريًا من 11 رقمًا مثل 01012345678."
          : "Invalid phone number. It must be an Egyptian mobile number like 01012345678."
      );
      return;
    }

    const passwordValue = accountPassword.trim();

    if (passwordValue.length < 6) {
      setError(
        isArabic
          ? "كلمة السر يجب ألا تقل عن 6 أحرف."
          : "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setCreatingAccount(true);
      setError("");
      setAccountCreated(false);

      // الرقم لازم يكون مش مكرر جوه نفس العيادة بس
      const { data: duplicatePhone, error: duplicateError } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", normalizedPhone)
        .eq("clinic_id", clinicId)
        .neq("id", id)
        .limit(1);

      if (duplicateError) throw new Error(duplicateError.message);

      if (duplicatePhone && duplicatePhone.length > 0) {
        throw new Error(
          isArabic
            ? "رقم التليفون هذا مسجل بالفعل لمريض آخر في هذه العيادة."
            : "This phone number is already registered for another patient in this clinic."
        );
      }

      // client مؤقت علشان جلسة الدكتور متتأثرش
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      // إيميل داخلي فريد لكل (مريض + عيادة)، فمفيش تعارض حتى لو نفس الرقم في عيادة تانية
      const internalEmail = `patient_${generateInternalId()}@dentalcare.local`;

      const { data: signUpData, error: signUpError } =
        await tempClient.auth.signUp({
          email: internalEmail,
          password: passwordValue,
        });

      if (signUpError) throw new Error(signUpError.message);

      if (!signUpData.user) {
        throw new Error(
          isArabic ? "تعذر إنشاء الحساب." : "Could not create the account."
        );
      }

      // ربط الحساب بصف المريض
      const { error: linkError } = await supabase
        .from("patients")
        .update({
          user_id: signUpData.user.id,
          login_email: internalEmail,
          phone: normalizedPhone,
        })
        .eq("id", id)
        .eq("clinic_id", clinicId);

      if (linkError) {
        if (linkError.code === "23505") {
          throw new Error(
            isArabic
              ? "رقم التليفون هذا مسجل بالفعل لمريض آخر في هذه العيادة."
              : "This phone number is already registered for another patient in this clinic."
          );
        }

        throw new Error(linkError.message);
      }

      setPatient((prev) =>
        prev
          ? {
              ...prev,
              user_id: signUpData.user!.id,
              login_email: internalEmail,
              phone: normalizedPhone,
            }
          : prev
      );

      // حفظ كلمة السر علشان دكتور العيادة دي يشوفها لو المريض نسيها
      const { error: credentialsError } = await supabase
        .from("patient_credentials")
        .upsert({
          patient_id: id,
          clinic_id: clinicId,
          password: passwordValue,
        });

      if (credentialsError) {
        console.error(credentialsError);
        setError(
          isArabic
            ? `تم إنشاء الحساب، لكن تعذر حفظ كلمة السر للرجوع إليها لاحقًا: ${credentialsError.message}`
            : `Account created, but the password could not be saved for later viewing: ${credentialsError.message}`
        );
      }

      setRevealedPassword(null);
      setPasswordUnavailable(false);

      setAccountCreated(true);
      setAccountPassword("");
      setShowAccountPassword(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isArabic
          ? "تعذر إنشاء حساب المريض."
          : "Could not create the patient account."
      );
    } finally {
      setCreatingAccount(false);
    }
  };

  // عرض/إخفاء كلمة السر المحفوظة (بتتجاب فقط عند الضغط على الزر)
  const handleRevealPassword = async () => {
    if (!id || !clinicId) return;

    if (revealedPassword !== null) {
      setRevealedPassword(null);
      setRevealedCopied(false);
      return;
    }

    try {
      setLoadingPassword(true);
      setError("");
      setPasswordUnavailable(false);

      const { data, error: credentialsError } = await supabase
        .from("patient_credentials")
        .select("password")
        .eq("patient_id", id)
        .eq("clinic_id", clinicId)
        .maybeSingle();

      if (credentialsError) throw new Error(credentialsError.message);

      if (!data?.password) {
        setPasswordUnavailable(true);
        return;
      }

      setRevealedPassword(data.password);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isArabic
          ? "تعذر جلب كلمة السر."
          : "Could not load the password."
      );
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleCopyRevealedPassword = async () => {
    if (!revealedPassword) return;

    try {
      await navigator.clipboard.writeText(revealedPassword);
      setRevealedCopied(true);
      setTimeout(() => setRevealedCopied(false), 2000);
    } catch (err) {
      console.error(err);
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

      await notifyPatient(
        "دفعة جديدة",
        `تم تسجيل دفعة بمبلغ ${amountValue.toFixed(2)} ج.م`
      );

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

      await notifyPatient(
        "موعد متابعة جديد",
        `تم تحديد موعد متابعة يوم ${followUpDate} الساعة ${followUpTime}`
      );

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

      const today = new Date().toISOString().split("T")[0];

      const { error: deleteAppointmentsError } = await supabase
        .from("appointments")
        .delete()
        .eq("patient_id", id)
        .eq("clinic_id", clinicId)
        .gte("appointment_date", today);

      if (deleteAppointmentsError) {
        throw new Error(deleteAppointmentsError.message);
      }

      setPatient((previousPatient) =>
        previousPatient
          ? {
              ...previousPatient,
              case_status: "completed",
            }
          : previousPatient
      );

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

      await notifyPatient(
        "سجل طبي جديد",
        "تمت إضافة سجل طبي جديد إلى ملفك."
      );
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
    setMedicineItems([emptyMedicine()]);
    setPrescriptionError("");
    setEditingGroupKey(null);
    setShowPrescriptionForm(false);
  };

  const openNewPrescriptionForm = () => {
    setEditingGroupKey(null);
    setPrescriptionDate(new Date().toISOString().split("T")[0]);
    setMedicineItems([emptyMedicine()]);
    setPrescriptionError("");
    setShowPrescriptionForm(true);

    setTimeout(() => {
      document
        .getElementById("prescription-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // تحديث أي حقل في دواء معيّن
  const patchMedicineItem = (
    key: string,
    patch: Partial<MedicineItem>
  ) => {
    setMedicineItems((previous) =>
      previous.map((item) =>
        item.key === key ? { ...item, ...patch } : item
      )
    );
  };

  // إضافة/إزالة تعليمة سريعة (مثل: بعد الأكل) من خانة التعليمات
  const toggleInstructionChip = (key: string, chip: string) => {
    setMedicineItems((previous) =>
      previous.map((item) => {
        if (item.key !== key) return item;

        const current = item.instructions.trim();

        if (current.includes(chip)) {
          const cleaned = current
            .split(/[،,]\s*/)
            .filter((part) => part.trim() && part.trim() !== chip)
            .join("، ");

          return { ...item, instructions: cleaned };
        }

        return {
          ...item,
          instructions: current ? `${current}، ${chip}` : chip,
        };
      })
    );
  };

  const addMedicineItem = () => {
    setMedicineItems((previous) => [...previous, emptyMedicine()]);

    setTimeout(() => {
      const cards = document.querySelectorAll("[data-medicine-card]");
      cards[cards.length - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  };

  const removeMedicineItem = (key: string) => {
    setMedicineItems((previous) =>
      previous.length <= 1
        ? previous
        : previous.filter((item) => item.key !== key)
    );
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !id) {
      setPrescriptionError(
        isArabic
          ? "بيانات العيادة أو المريض غير موجودة."
          : "Clinic or patient information is missing."
      );
      return;
    }

    const filled = medicineItems.filter((item) =>
      item.medicine_name.trim()
    );

    if (filled.length === 0) {
      setPrescriptionError(
        isArabic
          ? "اكتب اسم دواء واحد على الأقل."
          : "Enter at least one medicine name."
      );
      return;
    }

    const hasDetailsWithoutName = medicineItems.some(
      (item) =>
        !item.medicine_name.trim() && medicineHasAnyDetails(item)
    );

    if (hasDetailsWithoutName) {
      setPrescriptionError(
        isArabic
          ? "فيه دواء مكتوب له بيانات بدون اسم. اكتب الاسم أو احذف الدواء."
          : "A medicine has details but no name. Add the name or remove it."
      );
      return;
    }

    setPrescriptionError("");
    setError("");
    setSavingPrescription(true);

    try {
      const groupId = editingGroupKey || generateInternalId();
      const date =
        prescriptionDate || new Date().toISOString().split("T")[0];

      const buildRow = (item: MedicineItem, index: number) => ({
        clinic_id: clinicId,
        patient_id: id,
        prescription_date: date,
        medicine_name: item.medicine_name.trim(),
        dosage: item.dosage.trim() || null,
        frequency: buildFrequencyText(item, isArabic) || null,
        duration: buildDurationText(item, isArabic) || null,
        instructions: item.instructions.trim() || null,
        group_id: groupId,
        item_order: index,
      });

      if (editingGroupKey) {
        const existingIds = prescriptions
          .filter((p) => (p.group_id || p.id) === editingGroupKey)
          .map((p) => p.id);

        const keptIds = filled
          .filter((item) => item.id)
          .map((item) => item.id as string);

        const removedIds = existingIds.filter(
          (existingId) => !keptIds.includes(existingId)
        );

        for (let index = 0; index < filled.length; index++) {
          const item = filled[index];
          const row = buildRow(item, index);

          if (item.id) {
            const { error: updateError } = await supabase
              .from("prescriptions")
              .update(row)
              .eq("id", item.id)
              .eq("clinic_id", clinicId);

            if (updateError) {
              setPrescriptionError(describeDbError(updateError));
              return;
            }
          } else {
            const { error: insertError } = await supabase
              .from("prescriptions")
              .insert(row);

            if (insertError) {
              setPrescriptionError(describeDbError(insertError));
              return;
            }
          }
        }

        if (removedIds.length > 0) {
          const { error: deleteError } = await supabase
            .from("prescriptions")
            .delete()
            .in("id", removedIds)
            .eq("clinic_id", clinicId);

          if (deleteError) {
            setPrescriptionError(describeDbError(deleteError));
            return;
          }
        }
      } else {
        const { error: insertError } = await supabase
          .from("prescriptions")
          .insert(filled.map((item, index) => buildRow(item, index)));

        if (insertError) {
          setPrescriptionError(describeDbError(insertError));
          return;
        }

        await notifyPatient(
          "روشتة جديدة",
          filled.length === 1
            ? `تمت إضافة روشتة جديدة: ${filled[0].medicine_name.trim()}`
            : `تمت إضافة روشتة جديدة تحتوي على ${filled.length} أدوية`
        );
      }

      resetPrescriptionForm();
      await loadPatientDetails();
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleEditPrescriptionGroup = (group: PrescriptionGroup) => {
    setEditingGroupKey(group.key);
    setPrescriptionDate(
      group.date || new Date().toISOString().split("T")[0]
    );
    setMedicineItems(
      group.items.map((p) => {
        const freq = parseFrequencyText(p.frequency);
        const dur = parseDurationText(p.duration);

        return {
          key: p.id,
          id: p.id,
          medicine_name: p.medicine_name || "",
          dosage: p.dosage || "",
          timesPerDay: freq.times,
          customFrequency: freq.custom,
          days: dur.days,
          durationUnit: dur.unit,
          customDuration: dur.custom,
          instructions: p.instructions || "",
        };
      })
    );
    setPrescriptionError("");
    setShowPrescriptionForm(true);

    setTimeout(() => {
      document
        .getElementById("prescription-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleDeletePrescriptionGroup = async (
    group: PrescriptionGroup
  ) => {
    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد من حذف هذه الروشتة بكل أدويتها؟"
        : "Are you sure you want to delete this prescription with all its medicines?"
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("prescriptions")
      .delete()
      .in(
        "id",
        group.items.map((p) => p.id)
      )
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

  const prescriptionGroups: PrescriptionGroup[] = (() => {
    const map = new Map<string, PrescriptionGroup>();

    prescriptions.forEach((p) => {
      const key = p.group_id || p.id;

      if (!map.has(key)) {
        map.set(key, {
          key,
          date: p.prescription_date || "",
          items: [],
        });
      }

      map.get(key)!.items.push(p);
    });

    const groups = Array.from(map.values());

    groups.forEach((group) =>
      group.items.sort(
        (a, b) => (a.item_order ?? 0) - (b.item_order ?? 0)
      )
    );

    return groups;
  })();

  const pastAppointments = appointments.filter(
    (appointment) =>
      appointment.appointment_date < today
  );

  const instructionChips = isArabic
    ? INSTRUCTION_CHIPS_AR
    : INSTRUCTION_CHIPS_EN;

  const filledMedicinesCount = medicineItems.filter((m) =>
    m.medicine_name.trim()
  ).length;

  const unitLabels: Record<DurationUnit, string> = {
    days: isArabic ? "أيام" : "Days",
    weeks: isArabic ? "أسابيع" : "Weeks",
    months: isArabic ? "شهور" : "Months",
  };

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

        {/* Patient Information (مصغّر) */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">

          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            {isArabic ? "معلومات المريض" : "Patient Information"}
          </h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <InfoField
              label={isArabic ? "الاسم بالكامل" : "Full Name"}
              value={patient.name}
            />
            <InfoField label={t.common.phone} value={patient.phone || "-"} />
            <InfoField
              label={isArabic ? "العمر" : "Age"}
              value={patient.age ?? "-"}
            />
            <InfoField
              label={isArabic ? "النوع" : "Gender"}
              value={patient.gender || "-"}
            />
            <InfoField
              label={t.common.address}
              value={patient.address || "-"}
            />
            <InfoField
              label={isArabic ? "تاريخ التسجيل" : "Patient Since"}
              value={new Date(patient.created_at).toLocaleDateString(
                isArabic ? "ar-EG" : "en-US"
              )}
            />
          </div>

          {/* حساب دخول المريض */}
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {isArabic ? "حساب دخول المريض" : "Patient Login Account"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "يسجل المريض الدخول من صفحة العيادة برقم التليفون وكلمة السر."
                    : "The patient logs in from the clinic page with their phone number and password."}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  patient.user_id
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                }`}
              >
                {patient.user_id
                  ? isArabic ? "الحساب مفعّل" : "Account active"
                  : isArabic ? "لا يوجد حساب" : "No account yet"}
              </span>
            </div>

            {!patient.user_id && (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isArabic ? "اسم المستخدم (رقم التليفون)" : "Username (Phone Number)"}
                    </label>
                    <input
                      type="text"
                      value={patient.phone || ""}
                      readOnly
                      dir="ltr"
                      placeholder="-"
                      className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isArabic ? "كلمة السر" : "Password"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={showAccountPassword ? "text" : "password"}
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        dir="ltr"
                        autoComplete="new-password"
                        placeholder={isArabic ? "6 أحرف على الأقل" : "At least 6 characters"}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountPassword((prev) => !prev)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {showAccountPassword
                          ? isArabic ? "إخفاء" : "Hide"
                          : isArabic ? "إظهار" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountPassword(generateRandomPassword(8));
                      setShowAccountPassword(true);
                    }}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {isArabic ? "🎲 توليد كلمة سر" : "🎲 Generate Password"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCreatePatientAccount}
                    disabled={creatingAccount || accountPassword.trim().length < 6}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingAccount
                      ? isArabic ? "جاري إنشاء الحساب..." : "Creating account..."
                      : isArabic ? "إنشاء حساب المريض" : "Create Patient Account"}
                  </button>
                </div>
              </>
            )}

            {patient.user_id && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-2.5 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isArabic ? "اسم المستخدم (رقم التليفون)" : "Username (Phone)"}
                    </p>
                    <p dir="ltr" className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {patient.phone
                        ? patient.phone.startsWith("+20")
                          ? `0${patient.phone.slice(3)}`
                          : patient.phone
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isArabic ? "كلمة السر" : "Password"}
                    </p>
                    <p dir="ltr" className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {revealedPassword ?? "••••••••"}
                    </p>
                  </div>
                </div>

                {passwordUnavailable && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    {isArabic
                      ? "كلمة السر غير محفوظة لهذا الحساب (تم إنشاؤه قبل تفعيل هذه الميزة أو من صفحة التسجيل)."
                      : "No saved password for this account (it was created before this feature or via the sign-up page)."}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRevealPassword}
                    disabled={loadingPassword}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    {loadingPassword
                      ? isArabic ? "جاري التحميل..." : "Loading..."
                      : revealedPassword !== null
                      ? isArabic ? "إخفاء كلمة السر" : "Hide password"
                      : isArabic ? "عرض كلمة السر" : "Show password"}
                  </button>

                  {revealedPassword && (
                    <button
                      type="button"
                      onClick={handleCopyRevealedPassword}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      {revealedCopied
                        ? isArabic ? "✓ تم النسخ" : "✓ Copied"
                        : isArabic ? "نسخ كلمة السر" : "Copy password"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {accountCreated && (
              <p className="mt-3 text-sm font-semibold text-green-700 dark:text-green-400">
                {isArabic
                  ? "✓ تم إنشاء الحساب للمريض"
                  : "✓ Account created for the patient"}
              </p>
            )}
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

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                <Pill className="h-6 w-6" />
              </span>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {isArabic ? "الروشتات" : "Prescriptions"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "الأدوية الموصوفة لهذا المريض"
                    : "Medicines prescribed for this patient"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showPrescriptionForm) {
                  resetPrescriptionForm();
                } else {
                  openNewPrescriptionForm();
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {!showPrescriptionForm && <Plus className="h-5 w-5" />}

              {showPrescriptionForm
                ? isArabic
                  ? "إلغاء"
                  : "Cancel"
                : isArabic
                ? "إضافة روشتة"
                : "Add Prescription"}
            </button>

          </div>

          {showPrescriptionForm && (
            <div
              id="prescription-form"
              className="border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-6"
            >

              <form
                onSubmit={handleSavePrescription}
                className="mx-auto max-w-4xl space-y-5"
              >

                {/* رأس الروشتة */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-4 text-white shadow-sm sm:p-5">

                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                      <Pill className="h-6 w-6" />
                    </span>

                    <div>
                      <h3 className="text-lg font-bold">
                        {editingGroupKey
                          ? isArabic
                            ? "تعديل الروشتة"
                            : "Edit Prescription"
                          : isArabic
                          ? "روشتة جديدة"
                          : "New Prescription"}
                      </h3>

                      <p className="mt-0.5 text-xs text-white/80">
                        {isArabic
                          ? "أضف أكتر من دواء، ولكل دواء عدد مرات في اليوم وعدد أيام مختلف."
                          : "Add as many medicines as you need, each with its own daily doses and number of days."}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    <label className="mb-1 block text-xs font-semibold text-white/80">
                      {isArabic ? "تاريخ الروشتة" : "Prescription date"}
                    </label>

                    <input
                      type="date"
                      value={prescriptionDate}
                      onChange={(e) =>
                        setPrescriptionDate(e.target.value)
                      }
                      className="w-full rounded-xl border border-white/30 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none sm:w-auto"
                    />
                  </div>

                </div>

                {/* قائمة الأدوية */}
                {medicineItems.map((item, index) => {
                  const frequencyPreview = buildFrequencyText(
                    item,
                    isArabic
                  );
                  const durationPreview = buildDurationText(
                    item,
                    isArabic
                  );

                  return (
                    <div
                      key={item.key}
                      data-medicine-card
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >

                      {/* رأس الدواء */}
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50 sm:px-5">

                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                            {index + 1}
                          </span>

                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {item.medicine_name.trim() ||
                              (isArabic
                                ? `الدواء ${index + 1}`
                                : `Medicine ${index + 1}`)}
                          </span>
                        </div>

                        {medicineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMedicineItem(item.key)
                            }
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                            {isArabic ? "حذف الدواء" : "Remove"}
                          </button>
                        )}

                      </div>

                      <div className="space-y-5 p-4 sm:p-5">

                        {/* الاسم والجرعة */}
                        <div className="grid gap-3 sm:grid-cols-3">

                          <div className="sm:col-span-2">
                            <label className={rxLabel}>
                              {isArabic ? "اسم الدواء" : "Medicine name"}
                            </label>

                            <input
                              type="text"
                              value={item.medicine_name}
                              onChange={(e) =>
                                patchMedicineItem(item.key, {
                                  medicine_name: e.target.value,
                                })
                              }
                              required={index === 0}
                              placeholder={
                                isArabic
                                  ? "مثال: Augmentin"
                                  : "e.g. Augmentin"
                              }
                              className={`${rxInput} font-semibold`}
                            />
                          </div>

                          <div>
                            <label className={rxLabel}>
                              {isArabic ? "الجرعة" : "Dosage"}
                            </label>

                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) =>
                                patchMedicineItem(item.key, {
                                  dosage: e.target.value,
                                })
                              }
                              placeholder={
                                isArabic
                                  ? "مثال: 1 جم / قرص"
                                  : "e.g. 1 g / 1 tablet"
                              }
                              className={rxInput}
                            />
                          </div>

                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">

                          {/* عدد المرات في اليوم */}
                          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/10">

                            <div className="mb-2.5 flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-300">
                              <Clock className="h-4 w-4" />
                              {isArabic
                                ? "كام مرة في اليوم؟"
                                : "Times per day"}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">

                              {TIMES_OPTIONS.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() =>
                                    patchMedicineItem(item.key, {
                                      timesPerDay:
                                        item.timesPerDay === String(n)
                                          ? ""
                                          : String(n),
                                      customFrequency: "",
                                    })
                                  }
                                  className={`${chipBase} min-w-[44px] ${
                                    item.timesPerDay === String(n)
                                      ? chipOn
                                      : chipOff
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}

                              <input
                                type="number"
                                min="1"
                                max="24"
                                value={item.timesPerDay}
                                onChange={(e) =>
                                  patchMedicineItem(item.key, {
                                    timesPerDay: e.target.value,
                                    customFrequency: "",
                                  })
                                }
                                placeholder={isArabic ? "رقم آخر" : "Other"}
                                className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />

                            </div>

                            {!item.timesPerDay && item.customFrequency && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {isArabic ? "القيمة الحالية: " : "Current value: "}
                                <span className="font-semibold">
                                  {item.customFrequency}
                                </span>
                              </p>
                            )}

                          </div>

                          {/* عدد الأيام */}
                          <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/10">

                            <div className="mb-2.5 flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-300">
                              <CalendarDays className="h-4 w-4" />
                              {isArabic
                                ? "لمدة كام يوم؟"
                                : "For how long"}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">

                              {DAYS_OPTIONS.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() =>
                                    patchMedicineItem(item.key, {
                                      days:
                                        item.days === String(n) &&
                                        item.durationUnit === "days"
                                          ? ""
                                          : String(n),
                                      durationUnit: "days",
                                      customDuration: "",
                                    })
                                  }
                                  className={`${chipBase} min-w-[44px] ${
                                    item.days === String(n) &&
                                    item.durationUnit === "days"
                                      ? chipOn
                                      : chipOff
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}

                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">

                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={item.days}
                                onChange={(e) =>
                                  patchMedicineItem(item.key, {
                                    days: e.target.value,
                                    customDuration: "",
                                  })
                                }
                                placeholder={isArabic ? "عدد" : "Number"}
                                className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />

                              <div className="flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
                                {(["days", "weeks", "months"] as DurationUnit[]).map(
                                  (unit) => (
                                    <button
                                      key={unit}
                                      type="button"
                                      onClick={() =>
                                        patchMedicineItem(item.key, {
                                          durationUnit: unit,
                                        })
                                      }
                                      className={`px-3 py-2 text-sm font-semibold transition ${
                                        item.durationUnit === unit
                                          ? "bg-orange-500 text-white"
                                          : "bg-white text-slate-600 hover:bg-orange-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-orange-950/30"
                                      }`}
                                    >
                                      {unitLabels[unit]}
                                    </button>
                                  )
                                )}
                              </div>

                            </div>

                            {!item.days && item.customDuration && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {isArabic ? "القيمة الحالية: " : "Current value: "}
                                <span className="font-semibold">
                                  {item.customDuration}
                                </span>
                              </p>
                            )}

                          </div>

                        </div>

                        {/* التعليمات */}
                        <div>

                          <label className={rxLabel}>
                            {isArabic
                              ? "تعليمات هذا الدواء"
                              : "Instructions for this medicine"}
                          </label>

                          <div className="mb-2 flex flex-wrap gap-2">
                            {instructionChips.map((chip) => {
                              const active =
                                item.instructions.includes(chip);

                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() =>
                                    toggleInstructionChip(item.key, chip)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                    active
                                      ? "border-teal-600 bg-teal-600 text-white"
                                      : "border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-teal-950/30"
                                  }`}
                                >
                                  {chip}
                                </button>
                              );
                            })}
                          </div>

                          <textarea
                            value={item.instructions}
                            onChange={(e) =>
                              patchMedicineItem(item.key, {
                                instructions: e.target.value,
                              })
                            }
                            placeholder={
                              isArabic
                                ? "مثال: بعد الأكل مباشرة، ويُحفظ بعيدًا عن الحرارة"
                                : "e.g. Take right after meals"
                            }
                            className={`${rxInput} min-h-20`}
                          />

                        </div>

                        {/* ملخص الدواء */}
                        {item.medicine_name.trim() && (
                          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm dark:bg-teal-950/20">

                            <Pill className="h-4 w-4 text-teal-600 dark:text-teal-400" />

                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.medicine_name.trim()}
                            </span>

                            {item.dosage.trim() && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                {item.dosage.trim()}
                              </span>
                            )}

                            {frequencyPreview && (
                              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                {frequencyPreview}
                              </span>
                            )}

                            {durationPreview && (
                              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                                {isArabic
                                  ? `لمدة ${durationPreview}`
                                  : `for ${durationPreview}`}
                              </span>
                            )}

                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addMedicineItem}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/50 px-4 py-3.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-800 dark:bg-teal-950/20 dark:text-teal-300 dark:hover:bg-teal-950/40"
                >
                  <Plus className="h-5 w-5" />
                  {isArabic ? "إضافة دواء آخر" : "Add another medicine"}
                </button>

                {prescriptionError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                    {prescriptionError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? `عدد الأدوية: ${filledMedicinesCount}`
                      : `Medicines: ${filledMedicinesCount}`}
                  </p>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={resetPrescriptionForm}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex-none"
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </button>

                    <button
                      type="submit"
                      disabled={savingPrescription}
                      className="flex-1 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                    >
                      {savingPrescription
                        ? isArabic
                          ? "جاري الحفظ..."
                          : "Saving..."
                        : editingGroupKey
                        ? isArabic
                          ? "حفظ التعديلات"
                          : "Save changes"
                        : isArabic
                        ? "حفظ الروشتة"
                        : "Save Prescription"}
                    </button>

                  </div>

                </div>

              </form>

            </div>
          )}

          {prescriptionGroups.length === 0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                <Pill className="h-6 w-6" />
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
            <div className="space-y-4 p-4 sm:p-6">

              {prescriptionGroups.map((group) => (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"
                >

                  {/* رأس الكارت */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60 sm:px-5">

                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
                        <Pill className="h-5 w-5" />
                      </span>

                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {group.date
                            ? new Date(group.date).toLocaleDateString(
                                isArabic ? "ar-EG" : "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isArabic
                            ? `${group.items.length} ${
                                group.items.length === 1
                                  ? "دواء"
                                  : "أدوية"
                              }`
                            : `${group.items.length} ${
                                group.items.length === 1
                                  ? "medicine"
                                  : "medicines"
                              }`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">

                      <Link
                        to={`/doctor/prescriptions/${
                          group.items[0].id
                        }/print?group=${encodeURIComponent(group.key)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-400 dark:hover:bg-teal-950/50"
                      >
                        <Printer className="h-4 w-4" />
                        {isArabic ? "طباعة" : "Print"}
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleEditPrescriptionGroup(group)
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                        {isArabic ? "تعديل" : "Edit"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePrescriptionGroup(group)
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isArabic ? "حذف" : "Delete"}
                      </button>

                    </div>

                  </div>

                  {/* الأدوية */}
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">

                    {group.items.map((item, index) => (
                      <li
                        key={item.id}
                        className="flex gap-3 px-4 py-4 sm:px-5"
                      >

                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">

                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {item.medicine_name}
                          </p>

                          {(item.dosage ||
                            item.frequency ||
                            item.duration) && (
                            <div className="mt-2 flex flex-wrap gap-2">

                              {item.dosage && (
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                  {isArabic ? "الجرعة: " : "Dose: "}
                                  {item.dosage}
                                </span>
                              )}

                              {item.frequency && (
                                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                  {isArabic ? "المرات: " : "Times: "}
                                  {item.frequency}
                                </span>
                              )}

                              {item.duration && (
                                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                                  {isArabic ? "المدة: " : "For: "}
                                  {item.duration}
                                </span>
                              )}

                            </div>
                          )}

                          {item.instructions && (
                            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                              {item.instructions}
                            </p>
                          )}

                        </div>

                      </li>
                    ))}

                  </ul>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* X-Rays */}
        <div className="mb-8">
          <XrayGallery
            mode="doctor"
            isArabic={isArabic}
            clinicId={clinicId}
            patientId={id}
            onUploaded={() => {
              notifyPatient(
                "أشعة جديدة",
                "تمت إضافة أشعة جديدة إلى ملفك الطبي."
              );
            }}
          />
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





