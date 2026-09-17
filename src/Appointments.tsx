import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type AppointmentType =
  | "booking"
  | "follow_up";

type CreatedBy =
  | "patient"
  | "doctor";

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

const Appointments = () => {
  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);

  const [patients, setPatients] = useState<
    Patient[]
  >([]);

  const [clinicId, setClinicId] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // Selected Date
  // =========================

  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] =
    useState(getTodayDate());

  // =========================
  // Follow-up Modal
  // =========================

  const [showFollowUpModal, setShowFollowUpModal] =
    useState(false);

  const [followUpPatientId, setFollowUpPatientId] =
    useState("");

  const [followUpDate, setFollowUpDate] =
    useState(getTodayDate());

  const [followUpTime, setFollowUpTime] =
    useState("");

  const [followUpNotes, setFollowUpNotes] =
    useState("");

  const [followUpLoading, setFollowUpLoading] =
    useState(false);

  // =========================
  // Edit Follow-up Modal
  // =========================

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  const [editDate, setEditDate] =
    useState("");

  const [editTime, setEditTime] =
    useState("");

  const [editNotes, setEditNotes] =
    useState("");

  const [editLoading, setEditLoading] =
    useState(false);

  // =========================
  // Language
  // =========================

  const [language, setLanguage] =
    useState<Language>(() => {
      const savedLanguage =
        localStorage.getItem(
          "dentalcare-language"
        );

      return savedLanguage === "en"
        ? "en"
        : "ar";
    });

  const isArabic =
    language === "ar";

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem(
          "dentalcare-language"
        );

      setLanguage(
        savedLanguage === "en"
          ? "en"
          : "ar"
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

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );
    };
  }, []);

  // =========================
  // Format Date
  // =========================

  const formatDate = (
    date: string
  ) => {
    try {
      return new Intl.DateTimeFormat(
        isArabic
          ? "ar-EG"
          : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ).format(
        new Date(
          `${date}T00:00:00`
        )
      );
    } catch {
      return date;
    }
  };

  // =========================
  // Get Doctor Clinic
  // =========================

  const getClinic = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        "/doctor/login";
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
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

    setClinicId(
      profile.clinic_id
    );

    await Promise.all([
      loadAppointments(
        profile.clinic_id
      ),
      loadPatients(
        profile.clinic_id
      ),
    ]);
  };

  // =========================
  // Load Appointments
  // =========================

  const loadAppointments = async (
    clinicIdValue: string
  ) => {
    const {
      data,
      error: appointmentsError,
    } = await supabase
      .from("appointments")
      .select(`
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
      `)
      .eq(
        "clinic_id",
        clinicIdValue
      )
      .order(
        "appointment_date",
        {
          ascending: true,
        }
      )
      .order(
        "appointment_time",
        {
          ascending: true,
        }
      );

    if (appointmentsError) {
      console.error(
        appointmentsError
      );

      setError(
        appointmentsError.message
      );

      setLoading(false);
      return;
    }

    const formattedAppointments:
      Appointment[] = (
      data ?? []
    ).map((item) => {
      const row =
        item as unknown as {
          id: string;
          appointment_date: string;
          appointment_time: string;
          status: string;
          notes: string | null;
          patient_id: string;
          clinic_id: string;
          appointment_type:
            | string
            | null;
          created_by:
            | string
            | null;
          updated_at:
            | string
            | null;
          patients:
            | {
                name: string;
                phone: string | null;
              }
            | {
                name: string;
                phone: string | null;
              }[]
            | null;
        };

      let patient:
        | PatientInfo
        | null = null;

      if (
        Array.isArray(
          row.patients
        )
      ) {
        if (
          row.patients.length >
          0
        ) {
          patient = {
            name:
              row.patients[0]
                .name,
            phone:
              row.patients[0]
                .phone,
          };
        }
      } else if (
        row.patients
      ) {
        patient = {
          name:
            row.patients.name,
          phone:
            row.patients.phone,
        };
      }

      return {
        id: row.id,
        appointment_date:
          row.appointment_date,
        appointment_time:
          row.appointment_time,
        status:
          row.status as AppointmentStatus,
        notes: row.notes,
        patient_id:
          row.patient_id,
        clinic_id:
          row.clinic_id,
        appointment_type:
          row.appointment_type ===
          "follow_up"
            ? "follow_up"
            : "booking",
        created_by:
          row.created_by ===
          "doctor"
            ? "doctor"
            : "patient",
        updated_at:
          row.updated_at,
        patient,
      };
    });

    setAppointments(
      formattedAppointments
    );

    setLoading(false);
  };

  // =========================
  // Load Patients
  // =========================

  const loadPatients = async (
    clinicIdValue: string
  ) => {
    const {
      data,
      error: patientsError,
    } = await supabase
      .from("patients")
      .select(
        "id, name, phone"
      )
      .eq(
        "clinic_id",
        clinicIdValue
      )
      .order("name", {
        ascending: true,
      });

    if (patientsError) {
      console.error(
        patientsError
      );

      setError(
        patientsError.message
      );

      return;
    }

    setPatients(
      data ?? []
    );
  };

  // =========================
  // Initial Load
  // =========================

  useEffect(() => {
    getClinic();
  }, []);

  // =========================
  // Filter By Selected Date
  // =========================

  const selectedDayAppointments =
    appointments.filter(
      (appointment) =>
        appointment.appointment_date ===
        selectedDate
    );

  // =========================
  // Appointment Action
  // =========================

  const handleAppointmentAction =
    async (
      appointment: Appointment,
      action:
        | "confirm"
        | "cancel"
    ) => {
      if (!clinicId) {
        return;
      }

      setError("");
      setSuccess("");
      setActionLoading(
        appointment.id
      );

      const newStatus:
        AppointmentStatus =
        action === "confirm"
          ? "confirmed"
          : "cancelled";

      const {
        data: updatedAppointment,
        error: updateError,
      } = await supabase
        .from("appointments")
        .update({
          status: newStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          appointment.id
        )
        .eq(
          "clinic_id",
          clinicId
        )
        .select(`
          id,
          appointment_date,
          appointment_time,
          patient_id,
          clinic_id,
          status
        `)
        .single();

      if (
        updateError ||
        !updatedAppointment
      ) {
        console.error(
          updateError
        );

        setError(
          updateError?.message ||
            (isArabic
              ? "تعذر تحديث حالة الموعد."
              : "Could not update appointment status.")
        );

        setActionLoading(null);

        return;
      }

      // =========================
      // Patient Notification
      // =========================

      const patientName =
        appointment.patient
          ?.name ||
        (isArabic
          ? "المريض"
          : "Patient");

      const formattedDate =
        formatDate(
          appointment.appointment_date
        );

      const notificationTitle =
        action === "confirm"
          ? isArabic
            ? "تم قبول موعدك"
            : "Your Appointment Was Confirmed"
          : isArabic
          ? "تم رفض موعدك"
          : "Your Appointment Was Rejected";

      const notificationMessage =
        action === "confirm"
          ? isArabic
            ? `مرحبًا ${patientName}، تم قبول موعدك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
            : `Hello ${patientName}, your appointment on ${formattedDate} at ${appointment.appointment_time} has been confirmed.`
          : isArabic
          ? `مرحبًا ${patientName}، نعتذر، تم رفض موعدك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
          : `Hello ${patientName}, unfortunately your appointment on ${formattedDate} at ${appointment.appointment_time} has been rejected.`;

      const {
        error:
          notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          clinic_id:
            clinicId,
          patient_id:
            updatedAppointment.patient_id,
          appointment_id:
            updatedAppointment.id,
          title:
            notificationTitle,
          message:
            notificationMessage,
          is_read: false,
          recipient_type:
            "patient",
          notification_type:
            action === "confirm"
              ? "appointment_confirmed"
              : "appointment_rejected",
        });

      if (
        notificationError
      ) {
        console.error(
          "Notification error:",
          notificationError
        );

        setError(
          isArabic
            ? "تم تحديث الموعد، لكن تعذر إرسال إشعار للمريض."
            : "Appointment updated, but the patient notification could not be sent."
        );
      } else {
        setSuccess(
          action === "confirm"
            ? isArabic
              ? "تم قبول الموعد وإرسال إشعار للمريض."
              : "Appointment confirmed and the patient was notified."
            : isArabic
            ? "تم رفض الموعد وإرسال إشعار للمريض."
            : "Appointment rejected and the patient was notified."
        );
      }

      setAppointments(
        (
          currentAppointments
        ) =>
          currentAppointments.map(
            (item) =>
              item.id ===
              appointment.id
                ? {
                    ...item,
                    status:
                      newStatus,
                  }
                : item
          )
      );

      setActionLoading(null);
    };

  // =========================
  // Open Follow-up Modal
  // =========================

  const openFollowUpModal =
    () => {
      setError("");
      setSuccess("");

      setFollowUpPatientId("");
      setFollowUpDate(
        selectedDate < getTodayDate()
          ? getTodayDate()
          : selectedDate
      );
      setFollowUpTime("");
      setFollowUpNotes("");

      setShowFollowUpModal(
        true
      );
    };

  // =========================
  // Check Appointment Conflict
  // =========================

  const checkAppointmentConflict =
    async (
      date: string,
      time: string,
      excludeAppointmentId?: string
    ) => {
      let query = supabase
        .from("appointments")
        .select("id")
        .eq(
          "clinic_id",
          clinicId
        )
        .eq(
          "appointment_date",
          date
        )
        .eq(
          "appointment_time",
          time
        )
        .neq(
          "status",
          "cancelled"
        );

      if (
        excludeAppointmentId
      ) {
        query = query.neq(
          "id",
          excludeAppointmentId
        );
      }

      const {
        data,
        error: conflictError,
      } = await query.limit(1);

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
        conflict:
          (data?.length ?? 0) > 0,
      };
    };

  // =========================
  // Create Follow-up
  // =========================

  const handleCreateFollowUp =
    async () => {
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

      // =========================
      // Prevent Past Date
      // =========================

      const today =
        getTodayDate();

      if (
        followUpDate < today
      ) {
        setError(
          isArabic
            ? "لا يمكن اختيار تاريخ قديم. من فضلك اختر اليوم أو تاريخًا قادمًا."
            : "You cannot select a past date. Please choose today or a future date."
        );

        return;
      }

      setFollowUpLoading(
        true
      );
      setError("");
      setSuccess("");

      // =========================
      // Check Conflict
      // =========================

      const {
        conflict,
        error:
          conflictError,
      } =
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

        setFollowUpLoading(
          false
        );

        return;
      }

      if (conflict) {
        setError(
          isArabic
            ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
            : "This time is already booked. Please choose another time."
        );

        setFollowUpLoading(
          false
        );

        return;
      }

      // =========================
      // Create Appointment
      // =========================

      const {
        data: newAppointment,
        error: insertError,
      } = await supabase
        .from("appointments")
        .insert({
          clinic_id:
            clinicId,
          patient_id:
            followUpPatientId,
          appointment_date:
            followUpDate,
          appointment_time:
            followUpTime,
          status:
            "confirmed",
          notes:
            followUpNotes.trim() ||
            null,
          appointment_type:
            "follow_up",
          created_by:
            "doctor",
          updated_at:
            new Date().toISOString(),
        })
        .select(`
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
        `)
        .single();

      if (
        insertError ||
        !newAppointment
      ) {
        console.error(
          insertError
        );

        setError(
          insertError?.message ||
            (isArabic
              ? "تعذر إنشاء موعد المتابعة."
              : "Could not create follow-up appointment.")
        );

        setFollowUpLoading(
          false
        );

        return;
      }

      const selectedPatient =
        patients.find(
          (patient) =>
            patient.id ===
            followUpPatientId
        );

      const patientName =
        selectedPatient
          ?.name ||
        (isArabic
          ? "المريض"
          : "Patient");

      const formattedDate =
        formatDate(
          followUpDate
        );

      // =========================
      // Notification
      // =========================

      const {
        error:
          notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          clinic_id:
            clinicId,
          patient_id:
            followUpPatientId,
          appointment_id:
            newAppointment.id,
          title:
            isArabic
              ? "تم تحديد موعد متابعة"
              : "Follow-up Appointment Scheduled",
          message:
            isArabic
              ? `مرحبًا ${patientName}، قام الطبيب بتحديد موعد متابعة لك يوم ${formattedDate} الساعة ${followUpTime}.`
              : `Hello ${patientName}, your doctor scheduled a follow-up appointment for ${formattedDate} at ${followUpTime}.`,
          is_read: false,
          recipient_type:
            "patient",
          notification_type:
            "follow_up_created",
        });

      if (
        notificationError
      ) {
        console.error(
          "Notification error:",
          notificationError
        );

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

      await loadAppointments(
        clinicId
      );

      setSelectedDate(
        followUpDate
      );

      setShowFollowUpModal(
        false
      );

      setFollowUpLoading(
        false
      );
    };

  // =========================
  // Open Edit Modal
  // =========================

  const openEditModal = (
    appointment: Appointment
  ) => {
    setError("");
    setSuccess("");

    setEditingAppointment(
      appointment
    );

    setEditDate(
      appointment.appointment_date
    );

    setEditTime(
      appointment.appointment_time
    );

    setEditNotes(
      appointment.notes || ""
    );
  };

  // =========================
  // Update Follow-up
  // =========================

  const handleUpdateFollowUp =
    async () => {
      if (
        !clinicId ||
        !editingAppointment
      ) {
        return;
      }

      if (
        !editDate ||
        !editTime
      ) {
        setError(
          isArabic
            ? "من فضلك اختر التاريخ والوقت."
            : "Please select the date and time."
        );

        return;
      }

      // =========================
      // Prevent Past Date
      // =========================

      const today =
        getTodayDate();

      if (
        editDate < today
      ) {
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

      // =========================
      // Check Conflict
      // =========================

      const {
        conflict,
        error:
          conflictError,
      } =
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

        setEditLoading(
          false
        );

        return;
      }

      if (conflict) {
        setError(
          isArabic
            ? "هذا الوقت محجوز بالفعل. من فضلك اختر وقتًا آخر."
            : "This time is already booked. Please choose another time."
        );

        setEditLoading(
          false
        );

        return;
      }

      // =========================
      // Update Appointment
      // =========================

      const {
        data: updatedAppointment,
        error: updateError,
      } = await supabase
        .from("appointments")
        .update({
          appointment_date:
            editDate,
          appointment_time:
            editTime,
          notes:
            editNotes.trim() ||
            null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          editingAppointment.id
        )
        .eq(
          "clinic_id",
          clinicId
        )
        .eq(
          "appointment_type",
          "follow_up"
        )
        .select(`
          id,
          appointment_date,
          appointment_time,
          patient_id,
          clinic_id,
          status
        `)
        .single();

      if (
        updateError ||
        !updatedAppointment
      ) {
        console.error(
          updateError
        );

        setError(
          updateError?.message ||
            (isArabic
              ? "تعذر تعديل موعد المتابعة."
              : "Could not update the follow-up appointment.")
        );

        setEditLoading(
          false
        );

        return;
      }

      const patientName =
        editingAppointment
          .patient?.name ||
        (isArabic
          ? "المريض"
          : "Patient");

      const formattedDate =
        formatDate(
          editDate
        );

      const {
        error:
          notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          clinic_id:
            clinicId,
          patient_id:
            updatedAppointment.patient_id,
          appointment_id:
            updatedAppointment.id,
          title:
            isArabic
              ? "تم تغيير موعد المتابعة"
              : "Follow-up Appointment Changed",
          message:
            isArabic
              ? `مرحبًا ${patientName}، تم تغيير موعد المتابعة الخاص بك إلى يوم ${formattedDate} الساعة ${editTime}.`
              : `Hello ${patientName}, your follow-up appointment has been changed to ${formattedDate} at ${editTime}.`,
          is_read: false,
          recipient_type:
            "patient",
          notification_type:
            "appointment_rescheduled",
        });

      if (
        notificationError
      ) {
        console.error(
          "Notification error:",
          notificationError
        );

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

      await loadAppointments(
        clinicId
      );

      setSelectedDate(
        editDate
      );

      setEditingAppointment(
        null
      );

      setEditLoading(false);
    };

  // =========================
  // Cancel Follow-up
  // =========================

  const handleCancelFollowUp =
    async (
      appointment: Appointment
    ) => {
      if (!clinicId) {
        return;
      }

      const confirmed =
        window.confirm(
          isArabic
            ? "هل أنت متأكد من إلغاء موعد المتابعة؟"
            : "Are you sure you want to cancel this follow-up appointment?"
        );

      if (!confirmed) {
        return;
      }

      setActionLoading(
        appointment.id
      );

      setError("");
      setSuccess("");

      const {
        error: cancelError,
      } = await supabase
        .from("appointments")
        .update({
          status:
            "cancelled",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          appointment.id
        )
        .eq(
          "clinic_id",
          clinicId
        )
        .eq(
          "appointment_type",
          "follow_up"
        );

      if (cancelError) {
        console.error(
          cancelError
        );

        setError(
          cancelError.message
        );

        setActionLoading(null);

        return;
      }

      const patientName =
        appointment.patient
          ?.name ||
        (isArabic
          ? "المريض"
          : "Patient");

      const formattedDate =
        formatDate(
          appointment.appointment_date
        );

      const {
        error:
          notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          clinic_id:
            clinicId,
          patient_id:
            appointment.patient_id,
          appointment_id:
            appointment.id,
          title:
            isArabic
              ? "تم إلغاء موعد المتابعة"
              : "Follow-up Appointment Cancelled",
          message:
            isArabic
              ? `مرحبًا ${patientName}، تم إلغاء موعد المتابعة الخاص بك يوم ${formattedDate} الساعة ${appointment.appointment_time}.`
              : `Hello ${patientName}, your follow-up appointment on ${formattedDate} at ${appointment.appointment_time} has been cancelled.`,
          is_read: false,
          recipient_type:
            "patient",
          notification_type:
            "appointment_cancelled",
        });

      if (
        notificationError
      ) {
        console.error(
          "Notification error:",
          notificationError
        );

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

      setAppointments(
        (
          currentAppointments
        ) =>
          currentAppointments.map(
            (item) =>
              item.id ===
              appointment.id
                ? {
                    ...item,
                    status:
                      "cancelled",
                  }
                : item
          )
      );

      setActionLoading(null);
    };

  // =========================
  // Status Label
  // =========================

  const getStatusLabel = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case "pending":
        return isArabic
          ? "في انتظار الموافقة"
          : "Pending";

      case "confirmed":
        return isArabic
          ? "تم التأكيد"
          : "Confirmed";

      case "completed":
        return isArabic
          ? "مكتمل"
          : "Completed";

      case "cancelled":
        return isArabic
          ? "ملغي / مرفوض"
          : "Cancelled / Rejected";

      default:
        return status;
    }
  };

  // =========================
  // Status Classes
  // =========================

  const getStatusClasses = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";

      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";

      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";

      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  // =========================
  // Appointment Type
  // =========================

  const getAppointmentTypeLabel =
    (
      type: AppointmentType
    ) => {
      if (
        type ===
        "follow_up"
      ) {
        return isArabic
          ? "متابعة"
          : "Follow-up";
      }

      return isArabic
        ? "حجز"
        : "Booking";
    };

  const getAppointmentTypeClasses =
    (
      type: AppointmentType
    ) => {
      if (
        type ===
        "follow_up"
      ) {
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      }

      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center pt-28"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل المواعيد..."
            : "Loading appointments..."}
        </p>
      </div>
    );
  }

  // =========================
  // Page
  // =========================

  return (
    <div
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-12 px-6"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "المواعيد"
                : "Appointments"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "إدارة حجوزات المرضى ومواعيد المتابعة."
                : "Manage patient bookings and follow-up appointments."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <button
              type="button"
              onClick={openFollowUpModal}
              className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
            >
              {isArabic
                ? "+ إضافة موعد متابعة"
                : "+ Add Follow-up"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");

                loadAppointments(
                  clinicId
                );

                loadPatients(
                  clinicId
                );
              }}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              {isArabic
                ? "تحديث"
                : "Refresh"}
            </button>

          </div>

        </div>

        {/* Messages */}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 dark:bg-green-950/30 p-4 text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Date Selector */}

        <div className="mb-8 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isArabic
                  ? "مواعيد اليوم"
                  : "Appointments by Date"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "اختر اليوم لعرض جميع المواعيد الخاصة به."
                  : "Choose a date to view all appointments for that day."}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {isArabic
                  ? "اختيار التاريخ"
                  : "Select Date"}
              </label>

              <input
                type="date"
                value={
                  selectedDate
                }
                min={getTodayDate()}
                onChange={(
                  event
                ) =>
                  setSelectedDate(
                    event.target
                      .value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

          </div>

          <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800 p-4">

            <p className="font-semibold text-slate-900 dark:text-white">
              {formatDate(
                selectedDate
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? `${selectedDayAppointments.length} موعد في هذا اليوم`
                : `${selectedDayAppointments.length} appointment(s) on this day`}
            </p>

          </div>

        </div>

        {/* Statistics */}

        <div className="mb-8 grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "مواعيد اليوم"
                : "Today's Appointments"}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {
                selectedDayAppointments.length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "طلبات معلقة"
                : "Pending Requests"}
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {
                selectedDayAppointments.filter(
                  (appointment) =>
                    appointment.status ===
                    "pending"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "مواعيد مؤكدة"
                : "Confirmed"}
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                selectedDayAppointments.filter(
                  (appointment) =>
                    appointment.status ===
                    "confirmed"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "متابعات"
                : "Follow-ups"}
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {
                selectedDayAppointments.filter(
                  (appointment) =>
                    appointment.appointment_type ===
                    "follow_up"
                ).length
              }
            </p>
          </div>

        </div>

        {/* Appointments */}

        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm">

          <div className="border-b border-slate-200 dark:border-slate-700 p-6">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {isArabic
                    ? "مواعيد اليوم"
                    : "Daily Appointments"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(
                    selectedDate
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openFollowUpModal
                }
                className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                {isArabic
                  ? "+ موعد متابعة"
                  : "+ Follow-up"}
              </button>

            </div>

          </div>

          {selectedDayAppointments.length ===
          0 ? (
            <div className="p-12 text-center">

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد مواعيد في هذا اليوم."
                  : "No appointments on this date."}
              </p>

              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {isArabic
                  ? "يمكنك إضافة موعد متابعة جديد للمريض."
                  : "You can add a new follow-up appointment for a patient."}
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 dark:bg-slate-800">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "المريض"
                        : "Patient"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الهاتف"
                        : "Phone"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الوقت"
                        : "Time"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "النوع"
                        : "Type"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الحالة"
                        : "Status"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الملاحظات"
                        : "Notes"}
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isArabic
                        ? "الإجراء"
                        : "Action"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {selectedDayAppointments.map(
                    (
                      appointment
                    ) => {

                      const isPending =
                        appointment.status ===
                        "pending";

                      const isFollowUp =
                        appointment.appointment_type ===
                        "follow_up";

                      const isProcessing =
                        actionLoading ===
                        appointment.id;

                      return (
                        <tr
                          key={
                            appointment.id
                          }
                          className="border-t border-slate-100 dark:border-slate-800"
                        >

                          {/* Patient */}

                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {appointment.patient
                                ?.name ||
                                (isArabic
                                  ? "مريض غير معروف"
                                  : "Unknown Patient")}
                            </div>
                          </td>

                          {/* Phone */}

                          <td className="px-6 py-5 text-slate-600 dark:text-slate-300">
                            {appointment.patient
                              ?.phone ||
                              "-"}
                          </td>

                          {/* Time */}

                          <td className="px-6 py-5 font-medium text-slate-700 dark:text-slate-200">
                            {appointment.appointment_time}
                          </td>

                          {/* Type */}

                          <td className="px-6 py-5">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getAppointmentTypeClasses(
                                appointment.appointment_type
                              )}`}
                            >
                              {getAppointmentTypeLabel(
                                appointment.appointment_type
                              )}
                            </span>

                          </td>

                          {/* Status */}

                          <td className="px-6 py-5">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                                appointment.status
                              )}`}
                            >
                              {getStatusLabel(
                                appointment.status
                              )}
                            </span>

                          </td>

                          {/* Notes */}

                          <td className="max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300">
                            {appointment.notes ||
                              "-"}
                          </td>

                          {/* Actions */}

                          <td className="px-6 py-5">

                            {/* Booking Pending */}

                            {isPending &&
                            !isFollowUp ? (
                              <div className="flex flex-col gap-2 sm:flex-row">

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleAppointmentAction(
                                      appointment,
                                      "confirm"
                                    )
                                  }
                                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? "..."
                                    : isArabic
                                    ? "قبول"
                                    : "Accept"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleAppointmentAction(
                                      appointment,
                                      "cancel"
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? "..."
                                    : isArabic
                                    ? "رفض"
                                    : "Reject"}
                                </button>

                              </div>
                            ) : isFollowUp &&
                              appointment.status !==
                                "cancelled" ? (
                              <div className="flex flex-col gap-2 sm:flex-row">

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    openEditModal(
                                      appointment
                                    )
                                  }
                                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isArabic
                                    ? "تعديل"
                                    : "Edit"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleCancelFollowUp(
                                      appointment
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? "..."
                                    : isArabic
                                    ? "إلغاء"
                                    : "Cancel"}
                                </button>

                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 dark:text-slate-500">
                                {isArabic
                                  ? "لا يوجد إجراء"
                                  : "No action"}
                              </span>
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

      </div>

      {/* =========================
          Create Follow-up Modal
          ========================= */}

      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl">

            <div className="border-b border-slate-200 dark:border-slate-700 p-6">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isArabic
                    ? "إضافة موعد متابعة"
                    : "Add Follow-up Appointment"}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowFollowUpModal(
                      false
                    )
                  }
                  className="text-2xl text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="space-y-5 p-6">

              {/* Patient */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic
                    ? "المريض"
                    : "Patient"}
                </label>

                <select
                  value={
                    followUpPatientId
                  }
                  onChange={(
                    event
                  ) =>
                    setFollowUpPatientId(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >

                  <option value="">
                    {isArabic
                      ? "اختر المريض"
                      : "Select Patient"}
                  </option>

                  {patients.map(
                    (
                      patient
                    ) => (
                      <option
                        key={
                          patient.id
                        }
                        value={
                          patient.id
                        }
                      >
                        {
                          patient.name
                        }
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
                  value={
                    followUpDate
                  }
                  min={getTodayDate()}
                  onChange={(
                    event
                  ) =>
                    setFollowUpDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  value={
                    followUpTime
                  }
                  onChange={(
                    event
                  ) =>
                    setFollowUpTime(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  value={
                    followUpNotes
                  }
                  onChange={(
                    event
                  ) =>
                    setFollowUpNotes(
                      event.target
                        .value
                    )
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

              {/* Buttons */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  disabled={
                    followUpLoading
                  }
                  onClick={
                    handleCreateFollowUp
                  }
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
                  disabled={
                    followUpLoading
                  }
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
      )}

      {/* =========================
          Edit Follow-up Modal
          ========================= */}

      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl">

            <div className="border-b border-slate-200 dark:border-slate-700 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isArabic
                      ? "تعديل موعد المتابعة"
                      : "Edit Follow-up"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {
                      editingAppointment
                        .patient
                        ?.name
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingAppointment(
                      null
                    )
                  }
                  className="text-2xl text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="space-y-5 p-6">

              {/* Date */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic
                    ? "التاريخ الجديد"
                    : "New Date"}
                </label>

                <input
                  type="date"
                  value={
                    editDate
                  }
                  min={getTodayDate()}
                  onChange={(
                    event
                  ) =>
                    setEditDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              {/* Time */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic
                    ? "الوقت الجديد"
                    : "New Time"}
                </label>

                <input
                  type="time"
                  value={
                    editTime
                  }
                  onChange={(
                    event
                  ) =>
                    setEditTime(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              {/* Notes */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isArabic
                    ? "الملاحظات"
                    : "Notes"}
                </label>

                <textarea
                  value={
                    editNotes
                  }
                  onChange={(
                    event
                  ) =>
                    setEditNotes(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              {/* Buttons */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  disabled={
                    editLoading
                  }
                  onClick={
                    handleUpdateFollowUp
                  }
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
                  disabled={
                    editLoading
                  }
                  onClick={() =>
                    setEditingAppointment(
                      null
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
      )}

    </div>
  );
};

export default Appointments;
