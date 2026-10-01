
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Languages,
  Moon,
  MoreVertical,
  Phone,
  RefreshCcw,
  Sun,
  User,
  X,
  XCircle,
  Stethoscope,
  ScanLine,
} from "lucide-react";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

type AppointmentType = "new_checkup" | "xray" | "follow_up";

type CreatedBy = "patient" | "doctor";

type PatientInfo = {
  name: string;
  phone: string | null;
};

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  patient_id: string;
  clinic_id: string;
  appointment_type: AppointmentType;
  created_by: CreatedBy;
  updated_at: string | null;
  patient_age: number | null;
  is_paid: boolean;
  price: number | null;
  patient: PatientInfo | null;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
};

type DoctorProfile = {
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  checkup_price: number | null;
};

type PaymentAnswer = "" | "paid" | "unpaid";

type MedicalConditionsAnswer = "" | "no" | "yes";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date: string, isArabic: boolean) => {
  try {
    return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
};

const formatTime = (time: string) => {
  if (!time) return "";

  const [hourString, minute] = time.split(":");
  const hour = Number(hourString);

  if (Number.isNaN(hour)) {
    return time;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minute} ${suffix}`;
};

const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");

// يوحّد الحروف العربية عشان المقارنة تبقى دقيقة
const normalizeName = (name: string) =>
  cleanName(name)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

// ثلاثي على الأقل = 3 كلمات أو أكتر، وكل كلمة حرفين على الأقل
const isFullName = (name: string) => {
  const parts = cleanName(name).split(" ");
  return parts.length >= 3 && parts.every((part) => part.length >= 2);
};

// يحوّل الأرقام العربية (٠١٢...) لإنجليزي
const toEnglishDigits = (value: string) =>
  value.replace(/[٠-٩]/g, (d) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(d))
  );

// يوحّد الصيغة: +2010... أو 002010... أو 2010... => 010...
const normalizePhone = (phone: string) => {
  let p = toEnglishDigits(phone).replace(/[\s\-()]/g, "");

  if (p.startsWith("+20")) p = "0" + p.slice(3);
  else if (p.startsWith("0020")) p = "0" + p.slice(4);
  else if (p.startsWith("20") && p.length === 12) p = "0" + p.slice(2);

  return p;
};

// موبايل مصري صحيح: 11 رقم ويبدأ بـ 010 / 011 / 012 / 015
const isValidEgyptianPhone = (phone: string) =>
  /^01[0125][0-9]{8}$/.test(normalizePhone(phone));

function TodayAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ============================================================
  // Checkup / X-Ray Modal
  // ============================================================

  const [showCheckupModal, setShowCheckupModal] = useState(false);

  const [checkupPatientName, setCheckupPatientName] = useState("");

  const [checkupPhone, setCheckupPhone] = useState("");

  const [checkupType, setCheckupType] = useState<"new_checkup" | "xray">(
    "new_checkup"
  );

  const [checkupMedicalConditions, setCheckupMedicalConditions] =
    useState<MedicalConditionsAnswer>("");

  const [
    checkupMedicalConditionsDetails,
    setCheckupMedicalConditionsDetails,
  ] = useState("");

  const [checkupDate, setCheckupDate] = useState(getTodayDate());

  const [checkupTime, setCheckupTime] = useState("");

  const [checkupNotes, setCheckupNotes] = useState("");

  const [checkupLoading, setCheckupLoading] = useState(false);

  const [checkupAge, setCheckupAge] = useState("");

  const [checkupAddress, setCheckupAddress] = useState("");

  const [checkupPayment, setCheckupPayment] =
    useState<PaymentAnswer>("");

  // سعر الكشف الثابت للدكتور
  const [doctorPrice, setDoctorPrice] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);

  // ============================================================
  // Follow-up Modal
  // ============================================================

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const [followUpPatientId, setFollowUpPatientId] = useState("");

  const [followUpDate, setFollowUpDate] = useState(getTodayDate());

  const [followUpTime, setFollowUpTime] = useState("");

  const [followUpNotes, setFollowUpNotes] = useState("");

  const [followUpLoading, setFollowUpLoading] = useState(false);

  // ============================================================
  // Language / Theme
  // ============================================================

  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("dentalcare-language");

    return stored === "en" ? "en" : "ar";
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("dentalcare-theme");

    return stored === "dark" ? "dark" : "light";
  });

  const isArabic = language === "ar";
  const currency = isArabic ? "ج.م" : "EGP";
  const todayDate = getTodayDate();

  useEffect(() => {
    document.documentElement.dir = isArabic ? "rtl" : "ltr";

    localStorage.setItem("dentalcare-language", language);
  }, [language, isArabic]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");

    localStorage.setItem("dentalcare-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (showCheckupModal || showFollowUpModal) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [showCheckupModal, showFollowUpModal]);

  // ============================================================
  // Load Data
  // ============================================================

  const loadData = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          isArabic
            ? "يجب تسجيل الدخول أولًا."
            : "You must be logged in first."
        );
      }

      const userId = userData.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id, name, specialty, avatar_url, checkup_price")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.clinic_id) {
        throw new Error(
          isArabic
            ? "لم يتم ربط حساب الطبيب بعيادة."
            : "Your doctor account is not connected to a clinic."
        );
      }

      setClinicId(profile.clinic_id);

      setDoctorProfile({
        name: profile.name || "",
        specialty: profile.specialty || null,
        avatar_url: profile.avatar_url || null,
        checkup_price:
          profile.checkup_price !== null &&
          profile.checkup_price !== undefined
            ? Number(profile.checkup_price)
            : null,
      });

      setDoctorPrice(
        profile.checkup_price !== null &&
          profile.checkup_price !== undefined
          ? Number(profile.checkup_price)
          : null
      );

      const [clinicResult, appointmentsResult, patientsResult] =
        await Promise.all([
          supabase
            .from("clinics")
            .select("name, logo_url")
            .eq("id", profile.clinic_id)
            .single(),

          supabase
            .from("appointments")
            .select(
              `
            id,
            appointment_date,
            appointment_time,
            status,
            notes,
            patient_id,
            clinic_id,
            appointment_type,
            created_by,
            updated_at,
            patient_age,
            is_paid,
            price,
            patient:patients (
              name,
              phone
            )
          `
            )
            .eq("clinic_id", profile.clinic_id)
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true }),

          supabase
            .from("patients")
            .select("id, name, phone, address")
            .eq("clinic_id", profile.clinic_id)
            .order("name", { ascending: true }),
        ]);

      if (clinicResult.error) {
        throw clinicResult.error;
      }

      if (appointmentsResult.error) {
        throw appointmentsResult.error;
      }

      if (patientsResult.error) {
        throw patientsResult.error;
      }

      setClinicName(clinicResult.data?.name || "");

      setClinicLogo(clinicResult.data?.logo_url || null);

      const normalizedAppointments: Appointment[] = (
        appointmentsResult.data || []
      ).map((item: any) => {
        let appointmentType: AppointmentType;

        if (item.appointment_type === "follow_up") {
          appointmentType = "follow_up";
        } else if (item.appointment_type === "xray") {
          appointmentType = "xray";
        } else {
          appointmentType = "new_checkup";
        }

        return {
          id: item.id,
          appointment_date: item.appointment_date,
          appointment_time: item.appointment_time,
          status: item.status,
          notes: item.notes,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          appointment_type: appointmentType,
          created_by:
            item.created_by === "doctor" ? "doctor" : "patient",
          updated_at: item.updated_at,
          patient_age: item.patient_age ?? null,
          is_paid: Boolean(item.is_paid),
          price:
            item.price !== null && item.price !== undefined
              ? Number(item.price)
              : null,
          patient: Array.isArray(item.patient)
            ? item.patient[0] || null
            : item.patient || null,
        };
      });

      setAppointments(normalizedAppointments);

      setPatients(patientsResult.data || []);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء تحميل المواعيد."
            : "Failed to load appointments.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // Today's Appointments
  // ============================================================

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          appointment.appointment_date === todayDate
      )
      .sort((a, b) =>
        a.appointment_time.localeCompare(b.appointment_time)
      );
  }, [appointments, todayDate]);

  const selectedAppointment = useMemo(() => {
    return todayAppointments.find(
      (appointment) => appointment.id === selectedAppointmentId
    );
  }, [todayAppointments, selectedAppointmentId]);

  const waitingCount = todayAppointments.filter(
    (appointment) =>
      appointment.status === "pending" ||
      appointment.status === "confirmed"
  ).length;

  const confirmedCount = todayAppointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const completedCount = todayAppointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  // ============================================================
  // Labels
  // ============================================================

  const getStatusLabel = (status: AppointmentStatus) => {
    if (isArabic) {
      if (status === "pending") return "في الانتظار";

      if (status === "confirmed") return "مؤكد";

      if (status === "completed") return "مكتمل";

      return "ملغي";
    }

    if (status === "pending") return "Pending";

    if (status === "confirmed") return "Confirmed";

    if (status === "completed") return "Completed";

    return "Cancelled";
  };

  const getTypeLabel = (type: AppointmentType) => {
    if (type === "follow_up") {
      return isArabic ? "موعد متابعة" : "Follow-up";
    }

    if (type === "xray") {
      return isArabic ? "أشعة" : "X-ray";
    }

    return isArabic ? "كشف" : "Checkup";
  };

  const getStatusClasses = (status: AppointmentStatus) => {
    if (status === "pending") {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900";
    }

    if (status === "confirmed") {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900";
    }

    if (status === "completed") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";
    }

    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900";
  };

  // ============================================================
  // Open Checkup / X-Ray Modal
  // ============================================================

  const openCheckupModal = () => {
    setError("");
    setSuccess("");

    setCheckupPatientName("");
    setCheckupPhone("");
    setCheckupType("new_checkup");

    setCheckupMedicalConditions("");
    setCheckupMedicalConditionsDetails("");

    setCheckupDate(getTodayDate());
    setCheckupTime("");
    setCheckupNotes("");

    setCheckupAge("");
    setCheckupAddress("");

    setCheckupPayment("");

    setEditingPrice(false);

    setShowCheckupModal(true);
  };

  // ============================================================
  // Open Follow-up Modal
  // ============================================================

  const openFollowUpModal = () => {
    setError("");
    setSuccess("");

    setFollowUpPatientId("");
    setFollowUpDate(getTodayDate());
    setFollowUpTime("");
    setFollowUpNotes("");

    setShowFollowUpModal(true);
  };

  // ============================================================
  // Appointment Conflict
  // ============================================================

  const checkAppointmentConflict = async (
    date: string,
    time: string
  ) => {
    if (!clinicId) {
      return {
        error: null,
        conflict: false,
      };
    }

    const { data, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("appointment_date", date)
      .eq("appointment_time", time)
      .neq("status", "cancelled")
      .limit(1);

    if (conflictError) {
      console.error(
        "Conflict check error:",
        conflictError
      );

      return {
        error: conflictError,
        conflict: false,
      };
    }

    return {
      error: null,
      conflict: (data?.length ?? 0) > 0,
    };
  };

  // ============================================================
  // Save Doctor Checkup Price
  // ============================================================

  const handleSavePrice = async () => {
    const value = Number(priceInput);

    if (
      !priceInput.trim() ||
      Number.isNaN(value) ||
      value <= 0
    ) {
      setError(
        isArabic
          ? "من فضلك اكتب سعر كشف صحيح."
          : "Please enter a valid checkup price."
      );
      return;
    }

    setPriceSaving(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          isArabic
            ? "يجب تسجيل الدخول أولًا."
            : "You must be logged in first."
        );
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ checkup_price: value })
        .eq("id", userData.user.id);

      if (updateError) {
        throw updateError;
      }

      setDoctorPrice(value);
      setEditingPrice(false);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "تعذر حفظ سعر الكشف."
            : "Failed to save checkup price.")
      );
    } finally {
      setPriceSaving(false);
    }
  };

  // ============================================================
  // Create Checkup / X-Ray
  // ============================================================

  const handleCreateCheckup = async () => {
    if (!clinicId) return;

    const patientName = cleanName(checkupPatientName);

    if (!patientName || !checkupDate || !checkupTime) {
      setError(
        isArabic
          ? "من فضلك اكتب اسم المريض واختر التاريخ والوقت."
          : "Please enter the patient name, date and time."
      );
      return;
    }

    if (!isFullName(patientName)) {
      setError(
        isArabic
          ? "من فضلك اكتب اسم المريض ثلاثيًا على الأقل."
          : "Please enter the patient's full name (at least three names)."
      );
      return;
    }

    if (
      !checkupPhone.trim() ||
      !isValidEgyptianPhone(checkupPhone)
    ) {
      setError(
        isArabic
          ? "من فضلك اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)."
          : "Please enter a valid Egyptian mobile number (11 digits starting with 010, 011, 012 or 015)."
      );
      return;
    }

    const patientAge = Number(checkupAge);

    if (
      !checkupAge.trim() ||
      !Number.isInteger(patientAge) ||
      patientAge < 1 ||
      patientAge > 120
    ) {
      setError(
        isArabic
          ? "من فضلك اكتب عمر المريض بشكل صحيح (من 1 إلى 120)."
          : "Please enter a valid patient age (1 to 120)."
      );
      return;
    }

    if (!checkupMedicalConditions) {
      setError(
        isArabic
          ? "من فضلك حدد هل يعاني المريض من أي أمراض أم لا."
          : "Please specify whether the patient has any medical conditions."
      );
      return;
    }

    if (
      checkupMedicalConditions === "yes" &&
      !checkupMedicalConditionsDetails.trim()
    ) {
      setError(
        isArabic
          ? "من فضلك اذكر الأمراض التي يعاني منها المريض."
          : "Please describe the patient's medical conditions."
      );
      return;
    }

    if (checkupDate < getTodayDate()) {
      setError(
        isArabic
          ? "لا يمكن اختيار تاريخ قديم."
          : "You cannot select a past date."
      );
      return;
    }

    if (doctorPrice === null) {
      setError(
        isArabic
          ? "من فضلك حدد سعر الكشف أولًا."
          : "Please set the checkup price first."
      );
      return;
    }

    if (!checkupPayment) {
      setError(
        isArabic
          ? "من فضلك حدد هل تم دفع الكشف أم لا."
          : "Please specify whether the checkup is paid."
      );
      return;
    }

    setCheckupLoading(true);
    setError("");
    setSuccess("");

    try {
      // ============================================================
      // Check Conflict
      // ============================================================

      const { conflict, error: conflictError } =
        await checkAppointmentConflict(
          checkupDate,
          checkupTime
        );

      if (conflictError) {
        setError(
          isArabic
            ? "تعذر التحقق من توفر الموعد."
            : "Could not check appointment availability."
        );
        return;
      }

      if (conflict) {
        setError(
          isArabic
            ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
            : "This time is already booked. Please choose another time."
        );
        return;
      }

      // ============================================================
      // Medical Condition Text
      // ============================================================

      const medicalConditionText =
        checkupMedicalConditions === "yes"
          ? isArabic
            ? `الأمراض: ${checkupMedicalConditionsDetails.trim()}`
            : `Medical conditions: ${checkupMedicalConditionsDetails.trim()}`
          : isArabic
          ? "لا يعاني المريض من أي أمراض"
          : "No known medical conditions";

      const finalNotes = [
        medicalConditionText,
        checkupNotes.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      // ============================================================
      // Create Patient For The First Time
      // ============================================================

      const patientPhone = normalizePhone(checkupPhone);

      const { data: newPatient, error: patientInsertError } =
        await supabase
          .from("patients")
          .insert({
            clinic_id: clinicId,
            name: patientName,
            phone: patientPhone,
            age: patientAge,
            address: checkupAddress.trim() || null,
            medical_notes: finalNotes || null,
            user_id: null,
          })
          .select("id, name, phone")
          .single();

      if (patientInsertError || !newPatient) {
        throw (
          patientInsertError ||
          new Error(
            isArabic
              ? "تعذر إضافة المريض."
              : "Could not create the patient."
          )
        );
      }

      const patientId = newPatient.id;

      // ============================================================
      // Create Appointment
      // ============================================================

      const { data: newAppointment, error: insertError } =
        await supabase
          .from("appointments")
          .insert({
            clinic_id: clinicId,
            patient_id: patientId,
            appointment_date: checkupDate,
            appointment_time: checkupTime,
            status: "confirmed",
            notes: finalNotes || null,
            appointment_type: checkupType,
            patient_age: patientAge,
            is_paid: checkupPayment === "paid",
            price: doctorPrice,
            created_by: "doctor",
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

      if (insertError || !newAppointment) {
        throw (
          insertError ||
          new Error(
            isArabic
              ? "تعذر إنشاء الكشف."
              : "Could not create checkup."
          )
        );
      }

      // ============================================================
      // Add Payment
      // ============================================================

      let paymentFailed = false;
      let paymentErrorMessage = "";

      if (
        checkupPayment === "paid" &&
        doctorPrice !== null
      ) {
        const { error: paymentError } =
          await supabase.from("payments").insert({
            clinic_id: clinicId,
            patient_id: patientId,
            amount: doctorPrice,
            payment_method: "cash",
            payment_date: checkupDate,
            description:
              checkupType === "xray"
                ? isArabic
                  ? "أشعة"
                  : "X-ray"
                : isArabic
                ? "كشف"
                : "Checkup",
            notes: finalNotes || null,
          });

        if (paymentError) {
          console.error(
            "Payment error:",
            paymentError
          );

          paymentFailed = true;
          paymentErrorMessage =
            paymentError.message || "";
        }
      }

      // ============================================================
      // Notification
      // ============================================================

      const formattedDate = formatDate(
        checkupDate,
        isArabic
      );

      const isXray = checkupType === "xray";

      const appointmentLabel = isXray
        ? isArabic
          ? "أشعة"
          : "X-ray"
        : isArabic
        ? "كشف"
        : "Checkup";

      const { error: notificationError } =
        await supabase.from("notifications").insert({
          clinic_id: clinicId,
          patient_id: patientId,
          appointment_id: newAppointment.id,
          title: isArabic
            ? `تم تحديد موعد ${appointmentLabel}`
            : `${appointmentLabel} Appointment Scheduled`,
          message: isArabic
            ? `مرحبًا ${newPatient.name}، قام الطبيب بتحديد موعد ${appointmentLabel} لك يوم ${formattedDate} الساعة ${formatTime(
                checkupTime
              )}.`
            : `Hello ${newPatient.name}, your doctor scheduled a ${appointmentLabel} appointment for ${formattedDate} at ${formatTime(
                checkupTime
              )}.`,
          is_read: false,
          recipient_type: "patient",
          notification_type: "appointment_confirmed",
        });

      if (notificationError) {
        console.error(
          "Notification error:",
          notificationError
        );
      }

      setSuccess(
        isArabic
          ? `تم إضافة المريض وإنشاء ${appointmentLabel} بنجاح.`
          : `Patient added and ${appointmentLabel} created successfully.`
      );

      setShowCheckupModal(false);

      await loadData(true);

      if (paymentFailed) {
        setError(
          isArabic
            ? `تم إنشاء الكشف لكن تعذر تسجيل المبلغ في المدفوعات. (${paymentErrorMessage})`
            : `The checkup was created but the payment could not be recorded. (${paymentErrorMessage})`
        );
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء إنشاء الكشف."
            : "Failed to create checkup.")
      );
    } finally {
      setCheckupLoading(false);
    }
  };

  // ============================================================
  // Create Follow-up
  // ============================================================

  const handleCreateFollowUp = async () => {
    if (!clinicId) {
      return;
    }

    if (
      !followUpPatientId ||
      !followUpDate ||
      !followUpTime
    ) {
      setError(
        isArabic
          ? "من فضلك اختر المريض والتاريخ والوقت."
          : "Please select the patient, date and time."
      );
      return;
    }

    const today = getTodayDate();

    if (followUpDate < today) {
      setError(
        isArabic
          ? "لا يمكن اختيار تاريخ قديم."
          : "You cannot select a past date."
      );
      return;
    }

    setFollowUpLoading(true);
    setError("");
    setSuccess("");

    try {
      const { conflict, error: conflictError } =
        await checkAppointmentConflict(
          followUpDate,
          followUpTime
        );

      if (conflictError) {
        setError(
          isArabic
            ? "تعذر التحقق من توفر الموعد."
            : "Could not check appointment availability."
        );
        return;
      }

      if (conflict) {
        setError(
          isArabic
            ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
            : "This time is already booked. Please choose another time."
        );
        return;
      }

      const { data: newAppointment, error: insertError } =
        await supabase
          .from("appointments")
          .insert({
            clinic_id: clinicId,
            patient_id: followUpPatientId,
            appointment_date: followUpDate,
            appointment_time: followUpTime,
            status: "confirmed",
            notes: followUpNotes.trim() || null,
            appointment_type: "follow_up",
            created_by: "doctor",
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

      if (insertError || !newAppointment) {
        throw (
          insertError ||
          new Error(
            isArabic
              ? "تعذر إنشاء موعد المتابعة."
              : "Could not create follow-up appointment."
          )
        );
      }

      const selectedPatient = patients.find(
        (patient) =>
          patient.id === followUpPatientId
      );

      const patientName =
        selectedPatient?.name ||
        (isArabic ? "المريض" : "Patient");

      const formattedDate = formatDate(
        followUpDate,
        isArabic
      );

      const { error: notificationError } =
        await supabase.from("notifications").insert({
          clinic_id: clinicId,
          patient_id: followUpPatientId,
          appointment_id: newAppointment.id,
          title: isArabic
            ? "تم تحديد موعد متابعة جديد"
            : "New Follow-up Appointment Scheduled",
          message: isArabic
            ? `مرحبًا ${patientName}، قام الطبيب بتحديد موعد متابعة لك يوم ${formattedDate} الساعة ${formatTime(
                followUpTime
              )}.`
            : `Hello ${patientName}, your doctor scheduled a follow-up for ${formattedDate} at ${formatTime(
                followUpTime
              )}.`,
          is_read: false,
          recipient_type: "patient",
          notification_type: "follow_up_created",
        });

      if (notificationError) {
        console.error(
          "Notification error:",
          notificationError
        );
      }

      setSuccess(
        isArabic
          ? "تم إنشاء موعد المتابعة بنجاح."
          : "Follow-up appointment created successfully."
      );

      setShowFollowUpModal(false);

      await loadData(true);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء إنشاء موعد المتابعة."
            : "Failed to create follow-up appointment.")
      );
    } finally {
      setFollowUpLoading(false);
    }
  };

  // ============================================================
  // Confirm
  // ============================================================

  const handleConfirm = async (
    appointment: Appointment
  ) => {
    if (!clinicId) return;

    setActionLoading(appointment.id);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } =
        await supabase
          .from("appointments")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
          .eq("clinic_id", clinicId);

      if (updateError) {
        throw updateError;
      }

      await supabase.from("notifications").insert({
        clinic_id: clinicId,
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        title: isArabic
          ? "تم تأكيد موعدك"
          : "Your Appointment Is Confirmed",
        message: isArabic
          ? `تم تأكيد موعدك يوم ${formatDate(
              appointment.appointment_date,
              true
            )} الساعة ${formatTime(
              appointment.appointment_time
            )}.`
          : `Your appointment on ${formatDate(
              appointment.appointment_date,
              false
            )} at ${formatTime(
              appointment.appointment_time
            )} has been confirmed.`,
        is_read: false,
        recipient_type: "patient",
        notification_type: "appointment_confirmed",
      });

      await supabase
        .from("notifications")
        .update({
          is_read: true,
          notification_type: "appointment_confirmed",
        })
        .eq("appointment_id", appointment.id)
        .eq("clinic_id", clinicId)
        .eq("recipient_type", "doctor")
        .eq(
          "notification_type",
          "appointment_request"
        );

      setSuccess(
        isArabic
          ? "تم تأكيد الموعد بنجاح."
          : "Appointment confirmed successfully."
      );

      await loadData(true);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء تأكيد الموعد."
            : "Failed to confirm appointment.")
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // Reject
  // ============================================================

  const handleReject = async (
    appointment: Appointment
  ) => {
    if (!clinicId) return;

    setActionLoading(appointment.id);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } =
        await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
          .eq("clinic_id", clinicId);

      if (updateError) {
        throw updateError;
      }

      await supabase.from("notifications").insert({
        clinic_id: clinicId,
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        title: isArabic
          ? "تم رفض موعدك"
          : "Your Appointment Was Rejected",
        message: isArabic
          ? `تم رفض طلب حجز الموعد يوم ${formatDate(
              appointment.appointment_date,
              true
            )} الساعة ${formatTime(
              appointment.appointment_time
            )}.`
          : `Your appointment request for ${formatDate(
              appointment.appointment_date,
              false
            )} at ${formatTime(
              appointment.appointment_time
            )} was rejected.`,
        is_read: false,
        recipient_type: "patient",
        notification_type: "appointment_rejected",
      });

      await supabase
        .from("notifications")
        .update({
          is_read: true,
          notification_type: "appointment_rejected",
        })
        .eq("appointment_id", appointment.id)
        .eq("clinic_id", clinicId)
        .eq("recipient_type", "doctor")
        .eq(
          "notification_type",
          "appointment_request"
        );

      setSuccess(
        isArabic
          ? "تم رفض الموعد."
          : "Appointment rejected."
      );

      await loadData(true);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء رفض الموعد."
            : "Failed to reject appointment.")
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // Complete
  // ============================================================

  const handleComplete = async (
    appointment: Appointment
  ) => {
    if (!clinicId) return;

    setActionLoading(appointment.id);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } =
        await supabase
          .from("appointments")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
          .eq("clinic_id", clinicId);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        isArabic
          ? "تم تسجيل الموعد كمكتمل."
          : "Appointment marked as completed."
      );

      await loadData(true);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء تحديث الموعد."
            : "Failed to update appointment.")
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // Cancel Follow-up
  // ============================================================

  const handleCancelFollowUp = async (
    appointment: Appointment
  ) => {
    if (!clinicId) return;

    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد من إلغاء موعد المتابعة؟"
        : "Are you sure you want to cancel this follow-up?"
    );

    if (!confirmed) return;

    setActionLoading(appointment.id);

    setError("");
    setSuccess("");

    try {
      const { error: updateError } =
        await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
          .eq("clinic_id", clinicId)
          .eq("appointment_type", "follow_up");

      if (updateError) {
        throw updateError;
      }

      await supabase.from("notifications").insert({
        clinic_id: clinicId,
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        title: isArabic
          ? "تم إلغاء موعد المتابعة"
          : "Follow-up Appointment Cancelled",
        message: isArabic
          ? "تم إلغاء موعد المتابعة الخاص بك."
          : "Your follow-up appointment has been cancelled.",
        is_read: false,
        recipient_type: "patient",
        notification_type: "appointment_cancelled",
      });

      setSuccess(
        isArabic
          ? "تم إلغاء موعد المتابعة."
          : "Follow-up appointment cancelled."
      );

      setOpenMenuId(null);

      await loadData(true);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء إلغاء الموعد."
            : "Failed to cancel appointment.")
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/doctor/dashboard")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={
                isArabic ? "العودة" : "Back"
              }
            >
              {isArabic ? (
                <ArrowRight className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-3">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="h-11 w-11 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Activity className="h-6 w-6" />
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  DentalCare
                </p>

                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {clinicName ||
                    (isArabic
                      ? "عيادتي"
                      : "My Clinic")}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/doctor/notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={
                isArabic
                  ? "الإشعارات"
                  : "Notifications"
              }
            >
              <Bell className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={() =>
                setLanguage(isArabic ? "en" : "ar")
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Languages className="h-4 w-4" />

              {isArabic ? "EN" : "عربي"}
            </button>

            <button
              type="button"
              onClick={() =>
                setTheme(
                  theme === "dark"
                    ? "light"
                    : "dark"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={
                theme === "dark"
                  ? "Light mode"
                  : "Dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
              <Calendar className="h-4 w-4" />

              <span>
                {formatDate(
                  todayDate,
                  isArabic
                )}
              </span>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "مواعيد اليوم"
                : "Today's Appointments"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "جميع مواعيد العيادة المجدولة لليوم"
                : "All appointments scheduled for today"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCheckupModal}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <Calendar className="h-4 w-4" />

              {isArabic
                ? "إضافة كشف جديد"
                : "Add New Checkup"}
            </button>

            <button
              type="button"
              onClick={openFollowUpModal}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-900 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
            >
              <Clock className="h-4 w-4" />

              {isArabic
                ? "إضافة موعد متابعة"
                : "Add Follow-up"}
            </button>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title={
                isArabic ? "تحديث" : "Refresh"
              }
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{success}</span>
          </div>
        )}

        {/* Doctor + Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              {doctorProfile?.avatar_url ? (
                <img
                  src={doctorProfile.avatar_url}
                  alt={doctorProfile.name}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  <User className="h-7 w-7" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "الطبيب"
                    : "Doctor"}
                </p>

                <h3 className="truncate font-bold text-slate-900 dark:text-white">
                  {doctorProfile?.name ||
                    (isArabic
                      ? "الطبيب"
                      : "Doctor")}
                </h3>

                {doctorProfile?.specialty && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {doctorProfile.specialty}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "إجمالي مواعيد اليوم"
                : "Today's Appointments"}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {todayAppointments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "مواعيد مؤكدة"
                : "Confirmed"}
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-900 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "في الانتظار"
                : "Pending"}
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
              {waitingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "مواعيد مكتملة"
                : "Completed"}
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </p>
          </div>
        </div>

        {/* Appointments */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {isArabic
                  ? "جدول مواعيد اليوم"
                  : "Today's Schedule"}
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? `${todayAppointments.length} موعد`
                  : `${todayAppointments.length} appointments`}
              </p>
            </div>

            <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex dark:text-slate-400">
              <span>
                {isArabic
                  ? `مكتمل: ${completedCount}`
                  : `Completed: ${completedCount}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                <RefreshCcw className="h-7 w-7 animate-spin" />

                <span className="text-sm">
                  {isArabic
                    ? "جاري تحميل المواعيد..."
                    : "Loading appointments..."}
                </span>
              </div>
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Calendar className="h-8 w-8" />
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {isArabic
                  ? "لا توجد مواعيد اليوم"
                  : "No appointments today"}
              </h4>

              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد مواعيد مسجلة لهذا اليوم."
                  : "There are no appointments scheduled for today."}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={openCheckupModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  <Calendar className="h-4 w-4" />

                  {isArabic
                    ? "إضافة كشف جديد"
                    : "Add New Checkup"}
                </button>

                <button
                  type="button"
                  onClick={openFollowUpModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:bg-slate-900 dark:text-teal-300"
                >
                  <Clock className="h-4 w-4" />

                  {isArabic
                    ? "إضافة موعد متابعة"
                    : "Add Follow-up"}
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                    <th className="px-5 py-4 text-start">
                      {isArabic ? "الوقت" : "Time"}
                    </th>

                    <th className="px-5 py-4 text-start">
                      {isArabic
                        ? "المريض"
                        : "Patient"}
                    </th>

                    <th className="px-5 py-4 text-start">
                      {isArabic
                        ? "نوع الموعد"
                        : "Type"}
                    </th>

                    <th className="px-5 py-4 text-start">
                      {isArabic
                        ? "الدفع"
                        : "Payment"}
                    </th>

                    <th className="px-5 py-4 text-start">
                      {isArabic
                        ? "الحالة"
                        : "Status"}
                    </th>

                    <th className="px-5 py-4 text-start">
                      {isArabic
                        ? "المصدر"
                        : "Source"}
                    </th>

                    <th className="px-5 py-4 text-end">
                      {isArabic
                        ? "الإجراءات"
                        : "Actions"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {todayAppointments.map(
                    (appointment) => {
                      const isActionLoading =
                        actionLoading ===
                        appointment.id;

                      return (
                        <tr
                          key={appointment.id}
                          onClick={() =>
                            setSelectedAppointmentId(
                              appointment.id
                            )
                          }
                          className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                            selectedAppointmentId ===
                            appointment.id
                              ? "bg-teal-50/60 dark:bg-teal-950/20"
                              : ""
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />

                              {formatTime(
                                appointment.appointment_time
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <User className="h-5 w-5" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {appointment.patient
                                    ?.name ||
                                    (isArabic
                                      ? "مريض"
                                      : "Patient")}
                                </p>

                                {appointment.patient
                                  ?.phone && (
                                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Phone className="h-3 w-3" />

                                    {
                                      appointment
                                        .patient
                                        .phone
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {appointment.appointment_type ===
                                "xray" && (
                                <ScanLine className="h-3.5 w-3.5" />
                              )}

                              {appointment.appointment_type ===
                                "new_checkup" && (
                                <Stethoscope className="h-3.5 w-3.5" />
                              )}

                              {appointment.appointment_type ===
                                "follow_up" && (
                                <Clock className="h-3.5 w-3.5" />
                              )}

                              {getTypeLabel(
                                appointment.appointment_type
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {appointment.price !==
                            null ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {
                                    appointment.price
                                  }{" "}
                                  {currency}
                                </span>

                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                    appointment.is_paid
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                                  }`}
                                >
                                  {appointment.is_paid
                                    ? isArabic
                                      ? "مدفوع"
                                      : "Paid"
                                    : isArabic
                                    ? "غير مدفوع"
                                    : "Unpaid"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                appointment.status
                              )}`}
                            >
                              {getStatusLabel(
                                appointment.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {appointment.created_by ===
                              "patient"
                                ? isArabic
                                  ? "المريض"
                                  : "Patient"
                                : isArabic
                                ? "الطبيب"
                                : "Doctor"}
                            </span>
                          </td>

                          <td
                            className="px-5 py-4 text-end"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <div className="flex items-center justify-end gap-2">
                              {appointment.status ===
                                "pending" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      handleConfirm(
                                        appointment
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5" />

                                    {isArabic
                                      ? "تأكيد"
                                      : "Confirm"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      isActionLoading
                                    }
                                    onClick={() =>
                                      handleReject(
                                        appointment
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
                                  >
                                    <X className="h-3.5 w-3.5" />

                                    {isArabic
                                      ? "رفض"
                                      : "Reject"}
                                  </button>
                                </>
                              )}

                              {appointment.status ===
                                "confirmed" && (
                                <button
                                  type="button"
                                  disabled={
                                    isActionLoading
                                  }
                                  onClick={() =>
                                    handleComplete(
                                      appointment
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />

                                  {isArabic
                                    ? "مكتمل"
                                    : "Complete"}
                                </button>
                              )}

                              {appointment.appointment_type ===
                                "follow_up" && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId ===
                                          appointment.id
                                          ? null
                                          : appointment.id
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  {openMenuId ===
                                    appointment.id && (
                                    <div className="absolute end-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-start shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCancelFollowUp(
                                            appointment
                                          )
                                        }
                                        disabled={
                                          isActionLoading
                                        }
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                      >
                                        <XCircle className="h-4 w-4" />

                                        {isArabic
                                          ? "إلغاء الموعد"
                                          : "Cancel Appointment"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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

        {/* Selected Patient */}
        {selectedAppointment && (
          <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/50 p-5 dark:border-teal-900 dark:bg-teal-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {isArabic
                    ? "الموعد المحدد"
                    : "Selected Appointment"}
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAppointment.patient
                    ?.name ||
                    (isArabic
                      ? "مريض"
                      : "Patient")}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-teal-600" />

                  {formatDate(
                    selectedAppointment.appointment_date,
                    isArabic
                  )}
                </span>

                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-600" />

                  {formatTime(
                    selectedAppointment.appointment_time
                  )}
                </span>

                {selectedAppointment.patient
                  ?.phone && (
                  <a
                    href={`tel:${selectedAppointment.patient.phone}`}
                    className="flex items-center gap-1.5 text-teal-700 hover:underline dark:text-teal-300"
                  >
                    <Phone className="h-4 w-4" />

                    {
                      selectedAppointment.patient
                        .phone
                    }
                  </a>
                )}
              </div>
            </div>

            {(selectedAppointment.patient_age !==
              null ||
              selectedAppointment.price !== null) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                {selectedAppointment.patient_age !==
                  null && (
                  <span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isArabic
                        ? "العمر:"
                        : "Age:"}
                    </span>{" "}
                    {
                      selectedAppointment.patient_age
                    }
                  </span>
                )}

                {selectedAppointment.price !==
                  null && (
                  <span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isArabic
                        ? "سعر الكشف:"
                        : "Price:"}
                    </span>{" "}
                    {
                      selectedAppointment.price
                    }{" "}
                    {currency}
                  </span>
                )}

                {selectedAppointment.price !==
                  null && (
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      selectedAppointment.is_paid
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                    }`}
                  >
                    {selectedAppointment.is_paid
                      ? isArabic
                        ? "مدفوع"
                        : "Paid"
                      : isArabic
                      ? "غير مدفوع"
                      : "Unpaid"}
                  </span>
                )}
              </div>
            )}

            {selectedAppointment.notes && (
              <div className="mt-4 rounded-xl border border-teal-100 bg-white p-4 text-sm text-slate-600 dark:border-teal-900 dark:bg-slate-900 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {isArabic
                    ? "ملاحظات:"
                    : "Notes:"}
                </span>{" "}
                {selectedAppointment.notes}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          Add New Checkup Modal
         ======================================================== */}

      {showCheckupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900">
              <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "إضافة كشف جديد"
                      : "Add New Checkup"}
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCheckupModal(false)
                    }
                    className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-6">
                {/* New Patient */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "اسم المريض الجديد (ثلاثي على الأقل)"
                      : "New Patient Name (at least 3 names)"}
                  </label>

                  <input
                    type="text"
                    value={checkupPatientName}
                    onChange={(event) =>
                      setCheckupPatientName(
                        event.target.value
                      )
                    }
                    placeholder={
                      isArabic
                        ? "مثال: محمد أحمد علي"
                        : "Example: Mohamed Ahmed Ali"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  {checkupPatientName.trim() &&
                    !isFullName(
                      checkupPatientName
                    ) && (
                      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                        {isArabic
                          ? "الاسم لازم يكون ثلاثي على الأقل."
                          : "The name must contain at least three names."}
                      </p>
                    )}
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "رقم موبايل المريض"
                      : "Patient Mobile Number"}
                  </label>

                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    maxLength={14}
                    value={checkupPhone}
                    onChange={(event) =>
                      setCheckupPhone(
                        event.target.value
                      )
                    }
                    placeholder="01012345678"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none dark:bg-slate-800 dark:text-white ${
                      checkupPhone.trim() &&
                      !isValidEgyptianPhone(
                        checkupPhone
                      )
                        ? "border-amber-400 focus:border-amber-500"
                        : "border-slate-300 focus:border-teal-500 dark:border-slate-700"
                    }`}
                  />

                  {checkupPhone.trim() &&
                    !isValidEgyptianPhone(
                      checkupPhone
                    ) && (
                      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                        {isArabic
                          ? "الرقم لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015."
                          : "Number must be 11 digits starting with 010, 011, 012 or 015."}
                      </p>
                    )}
                </div>

                {/* Age */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "عمر المريض"
                      : "Patient Age"}
                  </label>

                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={120}
                    value={checkupAge}
                    onChange={(event) =>
                      setCheckupAge(
                        event.target.value
                      )
                    }
                    placeholder={
                      isArabic
                        ? "مثال: 28"
                        : "Example: 28"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Patient Address */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "عنوان المريض"
                      : "Patient Address"}
                  </label>

                  <input
                    type="text"
                    value={checkupAddress}
                    onChange={(event) =>
                      setCheckupAddress(
                        event.target.value
                      )
                    }
                    placeholder={
                      isArabic
                        ? "مثال: شارع الجيش، طنطا"
                        : "Example: El Geish Street, Tanta"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Appointment Type */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "نوع الموعد"
                      : "Appointment Type"}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCheckupType(
                          "new_checkup"
                        )
                      }
                      className={`rounded-xl border-2 p-4 text-center transition ${
                        checkupType ===
                        "new_checkup"
                          ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                      }`}
                    >
                      <Stethoscope className="mx-auto mb-2 h-6 w-6" />

                      <span className="block font-semibold">
                        {isArabic
                          ? "كشف"
                          : "Checkup"}
                      </span>

                      {checkupType ===
                        "new_checkup" && (
                        <span className="mt-1 block text-xs">
                          ✓{" "}
                          {isArabic
                            ? "تم الاختيار"
                            : "Selected"}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCheckupType("xray")
                      }
                      className={`rounded-xl border-2 p-4 text-center transition ${
                        checkupType === "xray"
                          ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                      }`}
                    >
                      <ScanLine className="mx-auto mb-2 h-6 w-6" />

                      <span className="block font-semibold">
                        {isArabic
                          ? "أشعة"
                          : "X-ray"}
                      </span>

                      {checkupType ===
                        "xray" && (
                        <span className="mt-1 block text-xs">
                          ✓{" "}
                          {isArabic
                            ? "تم الاختيار"
                            : "Selected"}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "هل يعاني المريض من أي أمراض؟"
                      : "Does the patient have any medical conditions?"}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckupMedicalConditions(
                          "no"
                        );

                        setCheckupMedicalConditionsDetails(
                          ""
                        );
                      }}
                      className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition ${
                        checkupMedicalConditions ===
                        "no"
                          ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                      }`}
                    >
                      {isArabic ? "لا" : "No"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCheckupMedicalConditions(
                          "yes"
                        )
                      }
                      className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition ${
                        checkupMedicalConditions ===
                        "yes"
                          ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                      }`}
                    >
                      {isArabic
                        ? "نعم"
                        : "Yes"}
                    </button>
                  </div>

                  {checkupMedicalConditions ===
                    "yes" && (
                    <div className="mt-3">
                      <textarea
                        value={
                          checkupMedicalConditionsDetails
                        }
                        onChange={(event) =>
                          setCheckupMedicalConditionsDetails(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder={
                          isArabic
                            ? "اذكر الأمراض، مثل: ضغط، سكر، حساسية من أدوية..."
                            : "Describe the conditions, e.g. blood pressure, diabetes, drug allergies..."
                        }
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "التاريخ"
                      : "Date"}
                  </label>

                  <input
                    type="date"
                    value={checkupDate}
                    min={getTodayDate()}
                    onChange={(event) =>
                      setCheckupDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "الوقت"
                      : "Time"}
                  </label>

                  <input
                    type="time"
                    value={checkupTime}
                    onChange={(event) =>
                      setCheckupTime(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "ملاحظات"
                      : "Notes"}
                  </label>

                  <textarea
                    value={checkupNotes}
                    onChange={(event) =>
                      setCheckupNotes(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder={
                      isArabic
                        ? "أي معلومات إضافية عن الموعد..."
                        : "Any additional information about the appointment..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Price + Payment */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isArabic
                          ? "سعر الكشف"
                          : "Checkup Price"}
                      </p>

                      {!editingPrice && (
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {doctorPrice !==
                          null
                            ? `${doctorPrice} ${currency}`
                            : isArabic
                            ? "لم يتم تحديد السعر"
                            : "Price not set"}
                        </p>
                      )}
                    </div>

                    {!editingPrice && (
                      <button
                        type="button"
                        onClick={() => {
                          setPriceInput(
                            doctorPrice !==
                              null
                              ? String(
                                  doctorPrice
                                )
                              : ""
                          );

                          setEditingPrice(
                            true
                          );
                        }}
                        className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
                      >
                        {doctorPrice !==
                        null
                          ? isArabic
                            ? "تعديل السعر"
                            : "Edit Price"
                          : isArabic
                          ? "تحديد السعر"
                          : "Set Price"}
                      </button>
                    )}
                  </div>

                  {editingPrice && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        value={priceInput}
                        onChange={(event) =>
                          setPriceInput(
                            event.target.value
                          )
                        }
                        placeholder={
                          isArabic
                            ? "سعر الكشف"
                            : "Checkup price"
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                      <button
                        type="button"
                        disabled={priceSaving}
                        onClick={
                          handleSavePrice
                        }
                        className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        {priceSaving
                          ? "..."
                          : isArabic
                          ? "حفظ"
                          : "Save"}
                      </button>

                      <button
                        type="button"
                        disabled={priceSaving}
                        onClick={() =>
                          setEditingPrice(
                            false
                          )
                        }
                        className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                      >
                        {isArabic
                          ? "إلغاء"
                          : "Cancel"}
                      </button>
                    </div>
                  )}

                  <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "هل تم دفع الكشف؟"
                      : "Is the checkup paid?"}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCheckupPayment(
                          "paid"
                        )
                      }
                      className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition ${
                        checkupPayment ===
                        "paid"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700"
                      }`}
                    >
                      {isArabic
                        ? "مدفوع"
                        : "Paid"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCheckupPayment(
                          "unpaid"
                        )
                      }
                      className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition ${
                        checkupPayment ===
                        "unpaid"
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-700"
                      }`}
                    >
                      {isArabic
                        ? "غير مدفوع"
                        : "Unpaid"}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={checkupLoading}
                    onClick={
                      handleCreateCheckup
                    }
                    className="flex-1 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkupLoading
                      ? "..."
                      : isArabic
                      ? "إضافة المريض وإنشاء الكشف"
                      : "Add Patient & Create Checkup"}
                  </button>

                  <button
                    type="button"
                    disabled={checkupLoading}
                    onClick={() =>
                      setShowCheckupModal(
                        false
                      )
                    }
                    className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {isArabic
                      ? "إلغاء"
                      : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          Add Follow-up Modal
         ======================================================== */}

      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900">
              <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "إضافة موعد متابعة"
                      : "Add Follow-up"}
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setShowFollowUpModal(
                        false
                      )
                    }
                    className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-6">
                {/* Existing Patient */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "المريض"
                      : "Patient"}
                  </label>

                  <select
                    value={followUpPatientId}
                    onChange={(event) =>
                      setFollowUpPatientId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      {isArabic
                        ? "اختر المريض"
                        : "Select Patient"}
                    </option>

                    {patients.map(
                      (patient) => (
                        <option
                          key={patient.id}
                          value={patient.id}
                        >
                          {patient.name}

                          {patient.phone
                            ? ` - ${patient.phone}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "التاريخ"
                      : "Date"}
                  </label>

                  <input
                    type="date"
                    value={followUpDate}
                    min={getTodayDate()}
                    onChange={(event) =>
                      setFollowUpDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "الوقت"
                      : "Time"}
                  </label>

                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(event) =>
                      setFollowUpTime(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isArabic
                      ? "ملاحظات"
                      : "Notes"}
                  </label>

                  <textarea
                    value={followUpNotes}
                    onChange={(event) =>
                      setFollowUpNotes(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder={
                      isArabic
                        ? "مثال: متابعة بعد العلاج..."
                        : "Example: Follow-up after treatment..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={followUpLoading}
                    onClick={
                      handleCreateFollowUp
                    }
                    className="flex-1 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {followUpLoading
                      ? "..."
                      : isArabic
                      ? "إنشاء المتابعة"
                      : "Create Follow-up"}
                  </button>

                  <button
                    type="button"
                    disabled={followUpLoading}
                    onClick={() =>
                      setShowFollowUpModal(
                        false
                      )
                    }
                    className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {isArabic
                      ? "إلغاء"
                      : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodayAppointments;




