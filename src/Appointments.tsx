import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Languages,
  Moon,
  MoreVertical,
  Phone,
  RefreshCcw,
  Sun,
  User,
} from "lucide-react";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

type AppointmentType = "booking" | "follow_up";

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
  patient: PatientInfo | null;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
};

type DoctorProfile = {
  name: string;
  specialty: string | null;
  avatar_url: string | null;
};

type ViewMode = "day" | "week" | "month";

const Appointments = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof (input as any).showPicker === "function") {
      (input as any).showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpPatientId, setFollowUpPatientId] = useState("");
  const [followUpDate, setFollowUpDate] = useState(getTodayDate());
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const isArabic = language === "ar";

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
    const handleThemeChange = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark")
      );
    };

    window.addEventListener("dentalcare-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener(
        "dentalcare-theme-change",
        handleThemeChange
      );
    };
  }, []);

  const toggleLanguage = () => {
    const nextLanguage: Language =
      language === "ar" ? "en" : "ar";

    localStorage.setItem("dentalcare-language", nextLanguage);
    setLanguage(nextLanguage);

    window.dispatchEvent(
      new Event("dentalcare-language-change")
    );
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDarkMode = !root.classList.contains("dark");

    root.classList.toggle("dark", nextDarkMode);

    localStorage.setItem(
      "dentalcare-theme",
      nextDarkMode ? "dark" : "light"
    );

    setIsDarkMode(nextDarkMode);

    window.dispatchEvent(
      new Event("dentalcare-theme-change")
    );
  };

  const formatDate = (date: string) => {
    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(`${date}T00:00:00`));
    } catch {
      return date;
    }
  };

  // تاريخ مختصر للصفوف في عرض الأسبوع والشهر: يوم الأسبوع + اليوم + الشهر
  const formatRowDate = (date: string) => {
    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(`${date}T00:00:00`));
    } catch {
      return date;
    }
  };

  const formatDateNav = (date: string) => {
    try {
      const d = new Date(`${date}T00:00:00`);
      const weekday = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        weekday: "long",
      }).format(d);
      const day = d.getDate();
      const monthYear = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(d);
      return `${weekday} ${day}, ${monthYear}`;
    } catch {
      return date;
    }
  };

  const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;

  const shiftSelectedDate = (days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(toISODate(d));
  };

  const shiftSelectedMonth = (months: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setMonth(d.getMonth() + months);
    setSelectedDate(toISODate(d));
  };

  const handlePrev = () => {
    if (viewMode === "week") shiftSelectedDate(-7);
    else if (viewMode === "month") shiftSelectedMonth(-1);
    else shiftSelectedDate(-1);
  };

  const handleNext = () => {
    if (viewMode === "week") shiftSelectedDate(7);
    else if (viewMode === "month") shiftSelectedMonth(1);
    else shiftSelectedDate(1);
  };

  const getWeekRange = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    const dayOfWeek = d.getDay();
    const diffFromSaturday = (dayOfWeek + 1) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - diffFromSaturday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toISODate(start), end: toISODate(end) };
  };

  const getMonthRange = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start: toISODate(start), end: toISODate(end) };
  };

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
      .select("clinic_id, name, specialty, avatar_url")
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

    setDoctorProfile({
      name: profile.name || "",
      specialty: (profile as any).specialty || null,
      avatar_url: (profile as any).avatar_url || null,
    });

    setClinicId(profile.clinic_id);

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("name, logo_url")
      .eq("id", profile.clinic_id)
      .single();

    if (clinicError) {
      console.error(clinicError);
    } else {
      setClinicName(clinic?.name || "");
      setClinicLogo(clinic?.logo_url || null);
    }

    await Promise.all([
      loadAppointments(profile.clinic_id),
      loadPatients(profile.clinic_id),
    ]);
  };

  const loadAppointments = async (clinicIdValue: string) => {
    const { data, error: appointmentsError } = await supabase
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
        patients (
          name,
          phone
        )
      `
      )
      .eq("clinic_id", clinicIdValue)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (appointmentsError) {
      console.error(appointmentsError);
      setError(appointmentsError.message);
      setLoading(false);
      return;
    }

    const formattedAppointments: Appointment[] = (data ?? []).map((item) => {
      const row = item as unknown as {
        id: string;
        appointment_date: string;
        appointment_time: string;
        status: string;
        notes: string | null;
        patient_id: string;
        clinic_id: string;
        appointment_type: string | null;
        created_by: string | null;
        updated_at: string | null;
        patients:
          | { name: string; phone: string | null }
          | { name: string; phone: string | null }[]
          | null;
      };

      let patient: PatientInfo | null = null;

      if (Array.isArray(row.patients)) {
        if (row.patients.length > 0) {
          patient = {
            name: row.patients[0].name,
            phone: row.patients[0].phone,
          };
        }
      } else if (row.patients) {
        patient = {
          name: row.patients.name,
          phone: row.patients.phone,
        };
      }

      return {
        id: row.id,
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time,
        status: row.status as AppointmentStatus,
        notes: row.notes,
        patient_id: row.patient_id,
        clinic_id: row.clinic_id,
        appointment_type:
          row.appointment_type === "follow_up" ? "follow_up" : "booking",
        created_by: row.created_by === "doctor" ? "doctor" : "patient",
        updated_at: row.updated_at,
        patient,
      };
    });

    setAppointments(formattedAppointments);
    setLoading(false);
  };

  const loadPatients = async (clinicIdValue: string) => {
    const { data, error: patientsError } = await supabase
      .from("patients")
      .select("id, name, phone")
      .eq("clinic_id", clinicIdValue)
      .order("name", { ascending: true });

    if (patientsError) {
      console.error(patientsError);
      setError(patientsError.message);
      return;
    }

    setPatients(data ?? []);
  };

  useEffect(() => {
    getClinic();
  }, []);

  const displayedAppointments = useMemo(() => {
    if (viewMode === "week") {
      const { start, end } = getWeekRange(selectedDate);
      return appointments.filter(
        (a) => a.appointment_date >= start && a.appointment_date <= end
      );
    }

    if (viewMode === "month") {
      const { start, end } = getMonthRange(selectedDate);
      return appointments.filter(
        (a) => a.appointment_date >= start && a.appointment_date <= end
      );
    }

    return appointments.filter(
      (a) => a.appointment_date === selectedDate
    );
  }, [appointments, viewMode, selectedDate]);

  const rangeLabel = useMemo(() => {
    if (viewMode === "week") {
      const { start, end } = getWeekRange(selectedDate);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }

    if (viewMode === "month") {
      const d = new Date(`${selectedDate}T00:00:00`);
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(d);
    }

    return formatDateNav(selectedDate);
  }, [viewMode, selectedDate, isArabic]);

  const selectedAppointment = useMemo(() => {
    if (selectedAppointmentId) {
      const found = displayedAppointments.find(
        (a) => a.id === selectedAppointmentId
      );
      if (found) return found;
    }
    return displayedAppointments[0] || null;
  }, [displayedAppointments, selectedAppointmentId]);

  // في عرض الأسبوع والشهر نظهر التاريخ مع الوقت
  const showDateColumn = viewMode !== "day";

  const handleAppointmentAction = async (
    appointment: Appointment,
    action: "confirm" | "cancel"
  ) => {
    if (!clinicId) {
      return;
    }

    if (appointment.status !== "pending") {
      setError(
        isArabic
          ? "هذا الموعد تمت معالجته بالفعل."
          : "This appointment has already been processed."
      );
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(appointment.id);
    setOpenMenuId(null);

    const newStatus: AppointmentStatus =
      action === "confirm" ? "confirmed" : "cancelled";

    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id)
      .eq("clinic_id", clinicId)
      .eq("status", "pending")
      .select(
        `
    id,
    appointment_date,
    appointment_time,
    patient_id,
    clinic_id,
    status
  `
      )
      .maybeSingle();

    if (updateError || !updatedAppointment) {
      console.error(updateError);
      setError(
        updateError?.message ||
          (isArabic
            ? "تعذر تحديث حالة الموعد. ربما تمت معالجته من مكان آخر."
            : "Could not update the appointment. It may have already been processed elsewhere.")
      );
      setActionLoading(null);
      return;
    }

    const patientName =
      appointment.patient?.name || (isArabic ? "المريض" : "Patient");
    const formattedDate = formatDate(appointment.appointment_date);

    const patientNotificationTitle =
      action === "confirm"
        ? isArabic
          ? "تم قبول موعدك"
          : "Your Appointment Was Confirmed"
        : isArabic
        ? "تم رفض موعدك"
        : "Your Appointment Was Rejected";

    const patientNotificationMessage =
      action === "confirm"
        ? isArabic
          ? `مرحبًا ${patientName}، تم قبول موعدك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
          : `Hello ${patientName}, your appointment on ${formattedDate} at ${appointment.appointment_time} has been confirmed.`
        : isArabic
        ? `مرحبًا ${patientName}، نعتذر، تم رفض موعدك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
        : `Hello ${patientName}, unfortunately your appointment on ${formattedDate} at ${appointment.appointment_time} has been rejected.`;

    const { error: patientNotificationError } = await supabase
      .from("notifications")
      .insert({
        clinic_id: clinicId,
        patient_id: updatedAppointment.patient_id,
        appointment_id: updatedAppointment.id,
        title: patientNotificationTitle,
        message: patientNotificationMessage,
        is_read: false,
        recipient_type: "patient",
        notification_type:
          action === "confirm"
            ? "appointment_confirmed"
            : "appointment_rejected",
      });

    if (patientNotificationError) {
      console.error("Patient notification error:", patientNotificationError);
    }

    const doctorNotificationTitle =
      action === "confirm"
        ? isArabic
          ? "تم قبول الموعد"
          : "Appointment Confirmed"
        : isArabic
        ? "تم رفض الموعد"
        : "Appointment Rejected";

    const doctorNotificationMessage =
      action === "confirm"
        ? isArabic
          ? `تم قبول موعد ${patientName} يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
          : `The appointment for ${patientName} on ${formattedDate} at ${appointment.appointment_time} has been confirmed.`
        : isArabic
        ? `تم رفض موعد ${patientName} يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
        : `The appointment for ${patientName} on ${formattedDate} at ${appointment.appointment_time} has been rejected.`;

    const { error: doctorNotificationError } = await supabase
      .from("notifications")
      .update({
        title: doctorNotificationTitle,
        message: doctorNotificationMessage,
        is_read: true,
        notification_type:
          action === "confirm"
            ? "appointment_confirmed"
            : "appointment_rejected",
      })
      .eq("clinic_id", clinicId)
      .eq("appointment_id", appointment.id)
      .eq("recipient_type", "doctor")
      .eq("notification_type", "appointment_request");

    if (doctorNotificationError) {
      console.error(
        "Doctor notification update error:",
        doctorNotificationError
      );
    }

    setAppointments((currentAppointments) =>
      currentAppointments.map((item) =>
        item.id === appointment.id
          ? {
              ...item,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    if (patientNotificationError && doctorNotificationError) {
      setError(
        isArabic
          ? "تم تحديث حالة الموعد، لكن تعذر تحديث إشعارات الطبيب والمريض."
          : "Appointment status was updated, but both patient and doctor notifications could not be updated."
      );
    } else if (patientNotificationError) {
      setError(
        isArabic
          ? "تم تحديث الموعد وإشعار الطبيب، لكن تعذر إرسال إشعار للمريض."
          : "Appointment and doctor notification were updated, but the patient could not be notified."
      );
    } else if (doctorNotificationError) {
      setError(
        isArabic
          ? "تم تحديث الموعد وإشعار المريض، لكن تعذر تحديث إشعار الطبيب."
          : "Appointment and patient notification were updated, but the doctor notification could not be updated."
      );
    } else {
      setSuccess(
        action === "confirm"
          ? isArabic
            ? "تم قبول الموعد وتحديث الإشعارات."
            : "Appointment confirmed and notifications updated."
          : isArabic
          ? "تم رفض الموعد وتحديث الإشعارات."
          : "Appointment rejected and notifications updated."
      );
    }

    setActionLoading(null);
  };

  const openFollowUpModal = () => {
    setError("");
    setSuccess("");
    setFollowUpPatientId("");
    setFollowUpDate(
      selectedDate < getTodayDate() ? getTodayDate() : selectedDate
    );
    setFollowUpTime("");
    setFollowUpNotes("");
    setShowFollowUpModal(true);
  };

  const checkAppointmentConflict = async (
    date: string,
    time: string,
    excludeAppointmentId?: string
  ) => {
    let query = supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("appointment_date", date)
      .eq("appointment_time", time)
      .neq("status", "cancelled");

    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId);
    }

    const { data, error: conflictError } = await query.limit(1);

    if (conflictError) {
      console.error("Conflict check error:", conflictError);
      return { error: conflictError, conflict: false };
    }

    return { error: null, conflict: (data?.length ?? 0) > 0 };
  };

  const handleCreateFollowUp = async () => {
    if (!clinicId) {
      return;
    }

    if (!followUpPatientId || !followUpDate || !followUpTime) {
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
          ? "لا يمكن اختيار تاريخ قديم. من فضلك اختر اليوم أو تاريخًا قادمًا."
          : "You cannot select a past date. Please choose today or a future date."
      );
      return;
    }

    setFollowUpLoading(true);
    setError("");
    setSuccess("");

    const { conflict, error: conflictError } =
      await checkAppointmentConflict(followUpDate, followUpTime);

    if (conflictError) {
      setError(
        isArabic
          ? "تعذر التحقق من توفر الموعد."
          : "Could not check appointment availability."
      );
      setFollowUpLoading(false);
      return;
    }

    if (conflict) {
      setError(
        isArabic
          ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
          : "This time is already booked. Please choose another time."
      );
      setFollowUpLoading(false);
      return;
    }

    const { data: newAppointment, error: insertError } = await supabase
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
      .select(
        `
    id,
    appointment_date,
    appointment_time,
    patient_id,
    clinic_id,
    status,
    notes,
    appointment_type,
    created_by,
    updated_at
  `
      )
      .single();

    if (insertError || !newAppointment) {
      console.error(insertError);
      setError(
        insertError?.message ||
          (isArabic
            ? "تعذر إنشاء موعد المتابعة."
            : "Could not create follow-up appointment.")
      );
      setFollowUpLoading(false);
      return;
    }

    const selectedPatient = patients.find(
      (patient) => patient.id === followUpPatientId
    );
    const patientName =
      selectedPatient?.name || (isArabic ? "المريض" : "Patient");
    const formattedDate = formatDate(followUpDate);

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        clinic_id: clinicId,
        patient_id: followUpPatientId,
        appointment_id: newAppointment.id,
        title: isArabic
          ? "تم تحديد موعد متابعة"
          : "Follow-up Appointment Scheduled",
        message: isArabic
          ? `مرحبًا ${patientName}، قام الطبيب بتحديد موعد متابعة لك يوم ${formattedDate} الساعة ${followUpTime}.`
          : `Hello ${patientName}, your doctor scheduled a follow-up appointment for ${formattedDate} at ${followUpTime}.`,
        is_read: false,
        recipient_type: "patient",
        notification_type: "follow_up_created",
      });

    if (notificationError) {
      console.error("Notification error:", notificationError);
      setError(
        isArabic
          ? "تم إنشاء موعد المتابعة، لكن تعذر إرسال الإشعار."
          : "Follow-up was created, but the notification could not be sent."
      );
    } else {
      setSuccess(
        isArabic
          ? "تم إنشاء موعد المتابعة وإرسال إشعار للمريض."
          : "Follow-up appointment created and the patient was notified."
      );
    }

    await loadAppointments(clinicId);
    setSelectedDate(followUpDate);
    setViewMode("day");
    setShowFollowUpModal(false);
    setFollowUpLoading(false);
  };

  const openEditModal = (appointment: Appointment) => {
    setError("");
    setSuccess("");
    setOpenMenuId(null);
    setEditingAppointment(appointment);
    setEditDate(appointment.appointment_date);
    setEditTime(appointment.appointment_time);
    setEditNotes(appointment.notes || "");
  };

  const handleUpdateFollowUp = async () => {
    if (!clinicId || !editingAppointment) {
      return;
    }

    if (!editDate || !editTime) {
      setError(
        isArabic
          ? "من فضلك اختر التاريخ والوقت."
          : "Please select the date and time."
      );
      return;
    }

    const today = getTodayDate();

    if (editDate < today) {
      setError(
        isArabic
          ? "لا يمكن اختيار تاريخ قديم. من فضلك اختر اليوم أو تاريخًا قادمًا."
          : "You cannot select a past date. Please choose today or a future date."
      );
      return;
    }

    setEditLoading(true);
    setError("");
    setSuccess("");

    const { conflict, error: conflictError } =
      await checkAppointmentConflict(
        editDate,
        editTime,
        editingAppointment.id
      );

    if (conflictError) {
      setError(
        isArabic
          ? "تعذر التحقق من توفر الموعد."
          : "Could not check appointment availability."
      );
      setEditLoading(false);
      return;
    }

    if (conflict) {
      setError(
        isArabic
          ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
          : "This time is already booked. Please choose another time."
      );
      setEditLoading(false);
      return;
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update({
        appointment_date: editDate,
        appointment_time: editTime,
        notes: editNotes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingAppointment.id)
      .eq("clinic_id", clinicId)
      .eq("appointment_type", "follow_up")
      .select(
        `
    id,
    appointment_date,
    appointment_time,
    patient_id,
    clinic_id,
    status
  `
      )
      .single();

    if (updateError || !updatedAppointment) {
      console.error(updateError);
      setError(
        updateError?.message ||
          (isArabic
            ? "تعذر تعديل موعد المتابعة."
            : "Could not update the follow-up appointment.")
      );
      setEditLoading(false);
      return;
    }

    const patientName =
      editingAppointment.patient?.name || (isArabic ? "المريض" : "Patient");
    const formattedDate = formatDate(editDate);

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        clinic_id: clinicId,
        patient_id: updatedAppointment.patient_id,
        appointment_id: updatedAppointment.id,
        title: isArabic
          ? "تم تغيير موعد المتابعة"
          : "Follow-up Appointment Changed",
        message: isArabic
          ? `مرحبًا ${patientName}، تم تغيير موعد المتابعة الخاص بك إلى يوم ${formattedDate} الساعة ${editTime}.`
          : `Hello ${patientName}, your follow-up appointment has been changed to ${formattedDate} at ${editTime}.`,
        is_read: false,
        recipient_type: "patient",
        notification_type: "appointment_rescheduled",
      });

    if (notificationError) {
      console.error("Notification error:", notificationError);
      setError(
        isArabic
          ? "تم تعديل الموعد، لكن تعذر إرسال الإشعار."
          : "Appointment updated, but the notification could not be sent."
      );
    } else {
      setSuccess(
        isArabic
          ? "تم تعديل موعد المتابعة وإرسال إشعار للمريض."
          : "Follow-up appointment updated and the patient was notified."
      );
    }

    await loadAppointments(clinicId);
    setSelectedDate(editDate);
    setViewMode("day");
    setEditingAppointment(null);
    setEditLoading(false);
  };

  const handleCancelFollowUp = async (appointment: Appointment) => {
    if (!clinicId) {
      return;
    }

    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد من إلغاء موعد المتابعة؟"
        : "Are you sure you want to cancel this follow-up appointment?"
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(appointment.id);
    setOpenMenuId(null);
    setError("");
    setSuccess("");

    const { error: cancelError } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id)
      .eq("clinic_id", clinicId)
      .eq("appointment_type", "follow_up");

    if (cancelError) {
      console.error(cancelError);
      setError(cancelError.message);
      setActionLoading(null);
      return;
    }

    const patientName =
      appointment.patient?.name || (isArabic ? "المريض" : "Patient");
    const formattedDate = formatDate(appointment.appointment_date);

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        clinic_id: clinicId,
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        title: isArabic
          ? "تم إلغاء موعد المتابعة"
          : "Follow-up Appointment Cancelled",
        message: isArabic
          ? `مرحبًا ${patientName}، تم إلغاء موعد المتابعة الخاص بك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
          : `Hello ${patientName}, your follow-up appointment on ${formattedDate} at ${appointment.appointment_time} has been cancelled.`,
        is_read: false,
        recipient_type: "patient",
        notification_type: "appointment_cancelled",
      });

    if (notificationError) {
      console.error("Notification error:", notificationError);
      setError(
        isArabic
          ? "تم إلغاء الموعد، لكن تعذر إرسال الإشعار."
          : "Appointment cancelled, but the notification could not be sent."
      );
    } else {
      setSuccess(
        isArabic
          ? "تم إلغاء موعد المتابعة وإرسال إشعار للمريض."
          : "Follow-up appointment cancelled and the patient was notified."
      );
    }

    setAppointments((currentAppointments) =>
      currentAppointments.map((item) =>
        item.id === appointment.id
          ? { ...item, status: "cancelled" }
          : item
      )
    );

    setActionLoading(null);
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case "pending":
        return isArabic ? "قادم" : "Pending";
      case "confirmed":
        return isArabic ? "مؤكد" : "Confirmed";
      case "completed":
        return isArabic ? "مكتمل" : "Completed";
      case "cancelled":
        return isArabic ? "ملغي / مرفوض" : "Cancelled / Rejected";
      default:
        return status;
    }
  };

  const getStatusClasses = (status: AppointmentStatus) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getAppointmentTypeLabel = (type: AppointmentType) => {
    if (type === "follow_up") {
      return isArabic ? "متابعة" : "Follow-up";
    }
    return isArabic ? "حجز" : "Booking";
  };

  // ألوان نوع الموعد: حجز = أزرق سماوي، متابعة = بنفسجي
  const getTypeBadgeClasses = (type: AppointmentType) =>
    type === "follow_up"
      ? "bg-purple-100 text-purple-700 ring-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:ring-purple-700"
      : "bg-sky-100 text-sky-700 ring-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-700";

  const getTypeDotClasses = (type: AppointmentType) =>
    type === "follow_up" ? "bg-purple-500" : "bg-sky-500";

  const getTypeBorderClasses = (type: AppointmentType) =>
    type === "follow_up" ? "border-s-purple-500" : "border-s-sky-500";

  const renderTypeBadge = (type: AppointmentType) => (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getTypeBadgeClasses(
        type
      )}`}
    >
      <span className={`h-2 w-2 rounded-full ${getTypeDotClasses(type)}`} />
      {getAppointmentTypeLabel(type)}
    </span>
  );

  // قائمة الإجراءات (قبول / رفض / تعديل / إلغاء) - مشتركة بين الجدول وكروت الموبايل
  const renderActionsMenu = (appointment: Appointment) => {
    const isPending = appointment.status === "pending";
    const isFollowUp = appointment.appointment_type === "follow_up";
    const isProcessing = actionLoading === appointment.id;

    if (!((isPending || isFollowUp) && appointment.status !== "cancelled")) {
      return null;
    }

    return (
      <div className="relative">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() =>
            setOpenMenuId((current) =>
              current === appointment.id ? null : appointment.id
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          aria-label={isArabic ? "المزيد" : "More"}
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {openMenuId === appointment.id && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenMenuId(null)}
            />

            <div className="absolute end-0 z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {isPending && !isFollowUp && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleAppointmentAction(appointment, "confirm")
                    }
                    className="block w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                  >
                    {isArabic ? "قبول" : "Accept"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAppointmentAction(appointment, "cancel")
                    }
                    className="block w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {isArabic ? "رفض" : "Reject"}
                  </button>
                </>
              )}

              {isFollowUp && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditModal(appointment)}
                    className="block w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    {isArabic ? "تعديل" : "Edit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancelFollowUp(appointment)}
                    className="block w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // أيقونات التنقل: تتعكس حسب اتجاه اللغة
  const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic ? "جاري تحميل المواعيد..." : "Loading appointments..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950"
    >
      {/* ==================== Header ==================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={isArabic ? "رجوع" : "Go back"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isArabic ? (
                <ArrowRight className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-600 text-white shadow-sm">
                {clinicLogo ? (
                  <img
                    src={clinicLogo}
                    alt={clinicName || "Clinic logo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Activity className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 leading-tight">
                <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  {clinicName || (isArabic ? "العيادة" : "Clinic")}
                </p>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {isArabic ? "المواعيد" : "Appointments"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={isArabic ? "تغيير اللغة" : "Change language"}
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

            <Link
              to="/doctor/notifications"
              title={isArabic ? "إشعارات الدكتور" : "Doctor notifications"}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 pb-12 pt-5 sm:px-6 sm:pt-6">
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">
            {success}
          </div>
        )}

        {/* ---------- عنوان الصفحة + إضافة موعد متابعة ---------- */}
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {isArabic ? "المواعيد" : "Appointments"}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <button
              type="button"
              onClick={openFollowUpModal}
              className="rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 sm:px-5"
            >
              {isArabic ? "+ إضافة موعد متابعة" : "+ Add Follow-up"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                loadAppointments(clinicId);
                loadPatients(clinicId);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 sm:px-5"
            >
              <RefreshCcw className="h-4 w-4" />
              {isArabic ? "تحديث" : "Refresh"}
            </button>
          </div>
        </div>

        {/* ==================== Main grid ==================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ---------- العمود الجانبي (على الموبايل بيظهر بعد الجدول) ---------- */}
          <div className="order-2 min-w-0 space-y-6 lg:order-first">
            {/* بروفايل الطبيب */}
            {doctorProfile && (
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                {doctorProfile.avatar_url ? (
                  <img
                    src={doctorProfile.avatar_url}
                    alt={doctorProfile.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    {doctorProfile.name?.charAt(0) || "D"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? `د. ${doctorProfile.name}`
                      : `Dr. ${doctorProfile.name}`}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {doctorProfile.specialty ||
                      (isArabic ? "طبيب أسنان عام" : "General dentist")}
                  </p>
                </div>
              </div>
            )}

            {/* تفاصيل المريض */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="mb-4 font-bold text-slate-900 dark:text-white">
                {isArabic ? "تفاصيل المريض" : "Patient Details"}
              </h2>

              {selectedAppointment ? (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <User className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-bold text-slate-900 dark:text-white">
                        {selectedAppointment.patient?.name ||
                          (isArabic ? "مريض غير معروف" : "Unknown patient")}
                      </p>
                    </div>
                  </div>

                  {selectedAppointment.patient?.phone && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span dir="ltr">{selectedAppointment.patient.phone}</span>
                    </div>
                  )}

                  <div className="mb-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {isArabic ? "الموعد المحدد" : "Selected appointment"}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-800 dark:text-white">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {formatDate(selectedAppointment.appointment_date)}
                        {" - "}
                        {selectedAppointment.appointment_time}
                      </span>
                    </p>
                    <div className="mt-2">
                      {renderTypeBadge(selectedAppointment.appointment_type)}
                    </div>
                  </div>

                  <Link
                    to={`/doctor/patients/${selectedAppointment.patient_id}`}
                    className="block w-full rounded-xl bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    {isArabic ? "عرض الملف الكامل" : "View full file"}
                  </Link>
                </>
              ) : (
                <p className="py-6 text-center text-sm text-slate-400">
                  {isArabic
                    ? "اختر موعدًا من الجدول لعرض تفاصيل المريض."
                    : "Select an appointment from the table to see patient details."}
                </p>
              )}
            </div>
          </div>

          {/* ---------- العمود الرئيسي ---------- */}
          <div className="order-1 min-w-0 space-y-4 sm:space-y-6 lg:order-last">
            {/* شريط الفلتر والتنقل */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex w-full items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto">
                {(
                  [
                    { key: "day", label: isArabic ? "اليوم" : "Day" },
                    { key: "week", label: isArabic ? "الأسبوع" : "Week" },
                    { key: "month", label: isArabic ? "الشهر" : "Month" },
                  ] as { key: ViewMode; label: string }[]
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setViewMode(option.key)}
                    className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-semibold transition sm:flex-none ${
                      viewMode === option.key
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex w-full min-w-0 items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label={isArabic ? "السابق" : "Previous"}
                >
                  <PrevIcon className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={openDatePicker}
                  className="relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:flex-none sm:px-3 sm:text-sm"
                >
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{rangeLabel}</span>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      if (event.target.value) {
                        setSelectedDate(event.target.value);
                      }
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={isArabic ? "اختيار تاريخ" : "Choose date"}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label={isArabic ? "التالي" : "Next"}
                >
                  <NextIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* قائمة المواعيد */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
              {displayedAppointments.length === 0 ? (
                <div className="p-8 text-center sm:p-12">
                  <p className="text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? "لا توجد مواعيد في هذه الفترة."
                      : "No appointments in this period."}
                  </p>
                  <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                    {isArabic
                      ? "يمكنك إضافة موعد متابعة جديد للمريض."
                      : "You can add a new follow-up appointment for a patient."}
                  </p>
                </div>
              ) : (
                <>
                  {/* ---------- كروت الموبايل ---------- */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                    {displayedAppointments.map((appointment) => {
                      const isRowSelected =
                        selectedAppointment?.id === appointment.id;

                      return (
                        <div
                          key={appointment.id}
                          onClick={() =>
                            setSelectedAppointmentId(appointment.id)
                          }
                          className={`border-s-4 p-4 ${getTypeBorderClasses(
                            appointment.appointment_type
                          )} ${
                            isRowSelected
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <User className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">
                                {appointment.patient?.name ||
                                  (isArabic
                                    ? "مريض غير معروف"
                                    : "Unknown Patient")}
                              </span>
                            </div>

                            <span
                              className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                appointment.status
                              )}`}
                            >
                              {getStatusLabel(appointment.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {showDateColumn && (
                              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {formatRowDate(appointment.appointment_date)}
                              </span>
                            )}

                            <span className="font-medium">
                              {appointment.appointment_time}
                            </span>

                            {renderTypeBadge(appointment.appointment_type)}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <Link
                              to={`/doctor/patients/${appointment.patient_id}`}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                              {isArabic ? "عرض التفاصيل" : "View details"}
                            </Link>

                            {renderActionsMenu(appointment)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ---------- جدول الشاشات الكبيرة ---------- */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-4 text-start font-semibold text-slate-600 dark:text-slate-300">
                            {showDateColumn
                              ? isArabic
                                ? "التاريخ والوقت"
                                : "Date & Time"
                              : isArabic
                              ? "الوقت"
                              : "Time"}
                          </th>
                          <th className="px-6 py-4 text-start font-semibold text-slate-600 dark:text-slate-300">
                            {isArabic ? "اسم المريض" : "Patient"}
                          </th>
                          <th className="px-6 py-4 text-start font-semibold text-slate-600 dark:text-slate-300">
                            {isArabic ? "نوع الموعد" : "Type"}
                          </th>
                          <th className="px-6 py-4 text-start font-semibold text-slate-600 dark:text-slate-300">
                            {isArabic ? "الحالة" : "Status"}
                          </th>
                          <th className="px-6 py-4 text-start font-semibold text-slate-600 dark:text-slate-300">
                            {isArabic ? "الإجراءات" : "Actions"}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {displayedAppointments.map((appointment) => {
                          const isRowSelected =
                            selectedAppointment?.id === appointment.id;

                          return (
                            <tr
                              key={appointment.id}
                              onClick={() =>
                                setSelectedAppointmentId(appointment.id)
                              }
                              className={`cursor-pointer border-t border-slate-100 transition dark:border-slate-800 ${
                                isRowSelected
                                  ? "bg-blue-50/60 dark:bg-blue-950/20"
                                  : ""
                              }`}
                            >
                              <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                                {showDateColumn ? (
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      {formatRowDate(
                                        appointment.appointment_date
                                      )}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                      {appointment.appointment_time}
                                    </p>
                                  </div>
                                ) : (
                                  appointment.appointment_time
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                    <User className="h-4 w-4" />
                                  </span>
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    {appointment.patient?.name ||
                                      (isArabic
                                        ? "مريض غير معروف"
                                        : "Unknown Patient")}
                                  </span>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                {renderTypeBadge(appointment.appointment_type)}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                    appointment.status
                                  )}`}
                                >
                                  {getStatusLabel(appointment.status)}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/doctor/patients/${appointment.patient_id}`}
                                    className="whitespace-nowrap rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                                  >
                                    {isArabic
                                      ? "عرض التفاصيل"
                                      : "View details"}
                                  </Link>

                                  {renderActionsMenu(appointment)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ==================== مودال إضافة موعد متابعة ==================== */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                  {isArabic
                    ? "إضافة موعد متابعة"
                    : "Add Follow-up Appointment"}
                </h2>

                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="text-2xl text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "المريض" : "Patient"}
                </label>

                <select
                  value={followUpPatientId}
                  onChange={(event) =>
                    setFollowUpPatientId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">
                    {isArabic ? "اختر المريض" : "Select Patient"}
                  </option>

                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                      {patient.phone ? ` - ${patient.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "التاريخ" : "Date"}
                </label>

                <input
                  type="date"
                  value={followUpDate}
                  min={getTodayDate()}
                  onChange={(event) =>
                    setFollowUpDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "الوقت" : "Time"}
                </label>

                <input
                  type="time"
                  value={followUpTime}
                  onChange={(event) =>
                    setFollowUpTime(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "ملاحظات" : "Notes"}
                </label>

                <textarea
                  value={followUpNotes}
                  onChange={(event) =>
                    setFollowUpNotes(event.target.value)
                  }
                  rows={3}
                  placeholder={
                    isArabic
                      ? "مثال: متابعة بعد تنظيف الأسنان..."
                      : "Example: Follow-up after dental cleaning..."
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={followUpLoading}
                  onClick={handleCreateFollowUp}
                  className="flex-1 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {followUpLoading
                    ? "..."
                    : isArabic
                    ? "إنشاء الموعد"
                    : "Create Appointment"}
                </button>

                <button
                  type="button"
                  disabled={followUpLoading}
                  onClick={() => setShowFollowUpModal(false)}
                  className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                >
                  {isArabic ? "إلغاء" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== مودال تعديل موعد متابعة ==================== */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                    {isArabic
                      ? "تعديل موعد المتابعة"
                      : "Edit Follow-up"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {editingAppointment.patient?.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="text-2xl text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "التاريخ الجديد" : "New Date"}
                </label>

                <input
                  type="date"
                  value={editDate}
                  min={getTodayDate()}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "الوقت الجديد" : "New Time"}
                </label>

                <input
                  type="time"
                  value={editTime}
                  onChange={(event) => setEditTime(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic ? "الملاحظات" : "Notes"}
                </label>

                <textarea
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={editLoading}
                  onClick={handleUpdateFollowUp}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editLoading
                    ? "..."
                    : isArabic
                    ? "حفظ التعديل"
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  disabled={editLoading}
                  onClick={() => setEditingAppointment(null)}
                  className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
                >
                  {isArabic ? "إلغاء" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;