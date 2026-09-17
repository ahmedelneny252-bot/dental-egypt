import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Stethoscope, ScanLine, RotateCcw } from "lucide-react";
import { supabase } from "../supabase";
import { translations, type Language } from "../i18n";

type Clinic = {
  id: string;
  name: string;
  subscription_plan: string | null;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
};

type AppointmentType =
  | "new_checkup"
  | "follow_up"
  | "xray";

const FREE_APPOINTMENT_LIMIT = 50;

const BookAppointment = () => {
  const { id } = useParams<{ id: string }>();

  const [clinic, setClinic] = useState<Clinic | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("new_checkup");

  const [appointmentDate, setAppointmentDate] =
    useState("");

  const [appointmentTime, setAppointmentTime] =
    useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [appointmentCount, setAppointmentCount] =
    useState(0);

  const [loggedInPatient, setLoggedInPatient] =
    useState(false);

  const [patientId, setPatientId] =
    useState<string | null>(null);

  // ============================================
  // Language
  // ============================================

  const [language, setLanguage] =
    useState<Language>(() => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      return savedLanguage === "en" ? "en" : "ar";
    });

  const isArabic = language === "ar";
  const t = translations[language];

  // ============================================
  // Language Change
  // ============================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      setLanguage(
        savedLanguage === "en" ? "en" : "ar"
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

  // ============================================
  // Current Month
  // ============================================

  const getCurrentMonthRange = () => {
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    return {
      start: formatDate(startOfMonth),
      end: formatDate(startOfNextMonth),
    };
  };

  // ============================================
  // Appointment Type Label
  // ============================================

  const getAppointmentTypeLabel = (
    type: AppointmentType
  ) => {
    switch (type) {
      case "new_checkup":
        return isArabic ? "كشف" : "Checkup";

      case "xray":
        return isArabic ? "أشعة" : "X-ray";

      case "follow_up":
        return isArabic ? "إعادة" : "Follow-up";

      default:
        return isArabic ? "كشف" : "Checkup";
    }
  };

  // ============================================
  // Load Clinic + Patient
  // ============================================

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError(
          isArabic
            ? "العيادة غير موجودة."
            : "Clinic not found."
        );

        setLoading(false);
        return;
      }

      try {
        // ======================================
        // Clinic
        // ======================================

        const {
          data: clinicData,
          error: clinicError,
        } = await supabase
          .from("clinics")
          .select(
            "id, name, subscription_plan"
          )
          .eq("id", id)
          .single();

        if (clinicError) {
          console.error(clinicError);

          setError(
            isArabic
              ? "العيادة غير موجودة."
              : "Clinic not found."
          );

          setLoading(false);
          return;
        }

        setClinic(clinicData);

        // ======================================
        // Monthly Appointment Count
        // ======================================

        const {
          start,
          end,
        } = getCurrentMonthRange();

        const {
          count,
          error: appointmentCountError,
        } = await supabase
          .from("appointments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("clinic_id", id)
          .gte("appointment_date", start)
          .lt("appointment_date", end);

        if (appointmentCountError) {
          console.error(
            appointmentCountError
          );
        } else {
          setAppointmentCount(count || 0);
        }

        // ======================================
        // Logged-in Patient
        // ======================================

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const {
            data: patientData,
            error: patientError,
          } = await supabase
            .from("patients")
            .select(
              "id, name, phone"
            )
            .eq("user_id", user.id)
            .eq("clinic_id", id)
            .limit(1)
            .maybeSingle();

          if (patientError) {
            console.error(
              "Patient account error:",
              patientError
            );
          }

          if (patientData) {
            setLoggedInPatient(true);
            setPatientId(patientData.id);

            setName(
              patientData.name || ""
            );

            setPhone(
              patientData.phone || ""
            );
          }
        }
      } catch (err) {
        console.error(err);

        setError(
          isArabic
            ? "حدث خطأ أثناء تحميل بيانات الحجز."
            : "Something went wrong while loading booking data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isArabic]);

  // ============================================
  // Free Plan
  // ============================================

  const isFreePlan =
    clinic?.subscription_plan === "Free" ||
    !clinic?.subscription_plan;

  const hasReachedAppointmentLimit =
    isFreePlan &&
    appointmentCount >= FREE_APPOINTMENT_LIMIT;

  // ============================================
  // Handle Booking
  // ============================================

  const handleBooking = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!id) {
      setError(
        isArabic
          ? "العيادة غير موجودة."
          : "Clinic not found."
      );

      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError(
        isArabic
          ? "من فضلك أدخل اسمك ورقم هاتفك."
          : "Please enter your name and phone number."
      );

      return;
    }

    if (!appointmentType) {
      setError(
        isArabic
          ? "من فضلك اختر نوع الحجز."
          : "Please choose the appointment type."
      );

      return;
    }

    if (
      !appointmentDate ||
      !appointmentTime
    ) {
      setError(
        isArabic
          ? "من فضلك اختر تاريخ ووقت الموعد."
          : "Please choose the appointment date and time."
      );

      return;
    }

    if (
      isFreePlan &&
      appointmentCount >= FREE_APPOINTMENT_LIMIT
    ) {
      setError(
        isArabic
          ? `الباقة المجانية لهذه العيادة تسمح بحد أقصى ${FREE_APPOINTMENT_LIMIT} موعدًا شهريًا. لقد وصلت العيادة إلى الحد الشهري للمواعيد.`
          : `This clinic's Free plan allows up to ${FREE_APPOINTMENT_LIMIT} appointments per month. The clinic has reached its monthly appointment limit.`
      );

      return;
    }

    setBooking(true);

    try {
      // ========================================
      // Current User
      // ========================================

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let patient: Patient | null = null;

      // ========================================
      // Logged-in Patient
      // ========================================

      if (user) {
        let accountPatient: Patient | null = null;

        if (patientId) {
          const {
            data,
            error: patientError,
          } = await supabase
            .from("patients")
            .select(
              "id, name, phone"
            )
            .eq("id", patientId)
            .eq("user_id", user.id)
            .eq("clinic_id", id)
            .maybeSingle();

          if (patientError) {
            throw patientError;
          }

          accountPatient = data;
        }

        if (!accountPatient) {
          const {
            data,
            error: patientError,
          } = await supabase
            .from("patients")
            .select(
              "id, name, phone"
            )
            .eq("user_id", user.id)
            .eq("clinic_id", id)
            .limit(1)
            .maybeSingle();

          if (patientError) {
            throw patientError;
          }

          accountPatient = data;
        }

        if (accountPatient) {
          patient = accountPatient;
        }
      }

      // ========================================
      // Guest Patient
      // ========================================

      if (!patient) {
        const {
          data: existingPatient,
          error: patientSearchError,
        } = await supabase
          .from("patients")
          .select(
            "id, name, phone"
          )
          .eq("clinic_id", id)
          .eq("phone", phone.trim())
          .limit(1)
          .maybeSingle();

        if (patientSearchError) {
          throw patientSearchError;
        }

        if (existingPatient) {
          patient = existingPatient;
        } else {
          const {
            data: newPatient,
            error: patientInsertError,
          } = await supabase
            .from("patients")
            .insert({
              clinic_id: id,
              name: name.trim(),
              phone: phone.trim(),
              medical_notes: null,
              user_id: user?.id || null,
            })
            .select(
              "id, name, phone"
            )
            .single();

          if (patientInsertError) {
            throw patientInsertError;
          }

          patient = newPatient;

          if (user) {
            setPatientId(newPatient.id);
            setLoggedInPatient(true);
          }
        }
      }

      if (!patient) {
        throw new Error(
          isArabic
            ? "تعذر العثور على سجل المريض."
            : "Could not find the patient record."
        );
      }

      // ========================================
      // Create Appointment
      // ========================================

      const {
        data: newAppointment,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .insert({
          clinic_id: id,
          patient_id: patient.id,

          appointment_date:
            appointmentDate,

          appointment_time:
            appointmentTime,

          // ====================================
          // APPOINTMENT TYPE
          // ====================================

          appointment_type:
            appointmentType,

          status: "pending",

          notes:
            notes.trim() || null,
        })
        .select("id")
        .single();

      if (appointmentError) {
        throw appointmentError;
      }

      setAppointmentCount(
        (current) => current + 1
      );

      const appointmentTypeLabel =
        getAppointmentTypeLabel(
          appointmentType
        );

      // ========================================
      // Doctor Notification
      // ========================================

      const {
        error: doctorNotificationError,
      } = await supabase
        .from("notifications")
        .insert({
          clinic_id: id,

          patient_id:
            patient.id,

          appointment_id:
            newAppointment.id,

          title: isArabic
            ? "طلب موعد جديد"
            : "New Appointment Request",

          message: isArabic
            ? `${patient.name} طلب ${appointmentTypeLabel}. التاريخ: ${appointmentDate} الساعة ${appointmentTime}.`
            : `${patient.name} requested a ${appointmentTypeLabel} appointment. Date: ${appointmentDate} at ${appointmentTime}.`,

          is_read: false,

          recipient_type:
            "doctor",

          notification_type:
            "appointment_request",
        });

      if (doctorNotificationError) {
        console.error(
          doctorNotificationError
        );

        setError(
          isArabic
            ? `تم إنشاء الموعد، لكن تعذر إرسال إشعار للطبيب: ${doctorNotificationError.message}`
            : `The appointment was created, but the doctor notification could not be sent: ${doctorNotificationError.message}`
        );

        return;
      }

      // ========================================
      // Patient Notification
      // ========================================

      if (user) {
        const {
          error: patientNotificationError,
        } = await supabase
          .from("notifications")
          .insert({
            clinic_id: id,

            patient_id:
              patient.id,

            appointment_id:
              newAppointment.id,

            title: isArabic
              ? "تم إرسال طلب الموعد"
              : "Appointment Request Sent",

            message: isArabic
              ? `تم إرسال طلب ${appointmentTypeLabel} إلى العيادة بنجاح. التاريخ: ${appointmentDate} الساعة ${appointmentTime}.`
              : `Your ${appointmentTypeLabel} appointment request has been sent successfully. Date: ${appointmentDate} at ${appointmentTime}.`,

            is_read: false,

            recipient_type:
              "patient",

            notification_type:
              "appointment_request",
          });

        if (patientNotificationError) {
          console.error(
            "Patient notification error:",
            patientNotificationError
          );
        }
      }

      // ========================================
      // Success
      // ========================================

      setSuccess(
        isArabic
          ? `تم إرسال طلب ${appointmentTypeLabel} بنجاح!`
          : `${appointmentTypeLabel} appointment request has been sent successfully!`
      );

      if (!loggedInPatient) {
        setName("");
        setPhone("");
      }

      // Reset appointment fields

      setAppointmentType(
        "new_checkup"
      );

      setAppointmentDate("");

      setAppointmentTime("");

      setNotes("");
    } catch (err: any) {
      console.error(
        "Booking error:",
        err
      );

      setError(
        err?.message ||
          (isArabic
            ? "حدث خطأ أثناء حجز الموعد."
            : "Something went wrong while booking the appointment.")
      );
    } finally {
      setBooking(false);
    }
  };

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري التحميل..."
            : "Loading..."}
        </p>
      </div>
    );
  }

  // ============================================
  // Clinic Not Found
  // ============================================

  if (error && !clinic) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isArabic
              ? "العيادة غير موجودة"
              : "Clinic not found"}
          </h2>

          <Link
            to="/clinics"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
          >
            {isArabic ? (
              <>
                العودة إلى العيادات

                <ArrowLeft className="h-5 w-5 rotate-180" />
              </>
            ) : (
              <>
                <ArrowLeft className="h-5 w-5" />

                Back to Clinics
              </>
            )}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 pt-24 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* Back */}

        <Link
          to={`/clinics/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
        >
          {isArabic ? (
            <>
              {t.common.back}

              <ArrowLeft className="h-4 w-4 rotate-180" />
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />

              Back to Clinic
            </>
          )}
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 md:p-8">

          {/* ================================== */}
          {/* Header */}
          {/* ================================== */}

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "حجز موعد"
                : "Book an Appointment"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {clinic?.name}
            </p>

            {loggedInPatient && (
              <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30">

                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                  {isArabic
                    ? "بيانات حساب المريض"
                    : "Patient Account"}
                </p>

                <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                  {isArabic
                    ? "سيتم استخدام اسمك وبيانات حسابك كما هي."
                    : "Your account name and information will be used as stored."}
                </p>

              </div>
            )}

            {isFreePlan ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">

                {isArabic
                  ? "الباقة المجانية: "
                  : "Free plan: "}

                <span
                  className={`font-semibold ${
                    hasReachedAppointmentLimit
                      ? "text-red-600 dark:text-red-400"
                      : "text-teal-600 dark:text-teal-400"
                  }`}
                >
                  {appointmentCount}/
                  {FREE_APPOINTMENT_LIMIT}
                </span>{" "}

                {isArabic
                  ? "موعدًا هذا الشهر"
                  : "appointments this month"}

              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">

                {clinic?.subscription_plan}{" "}

                {isArabic
                  ? "الباقة:"
                  : "plan:"}{" "}

                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {isArabic
                    ? "مواعيد غير محدودة"
                    : "Unlimited appointments"}
                </span>

              </p>
            )}
          </div>

          {/* ================================== */}
          {/* Limit */}
          {/* ================================== */}

          {hasReachedAppointmentLimit && (
            <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-950/40">

              <p className="font-semibold text-orange-800 dark:text-orange-300">
                {isArabic
                  ? "تم الوصول إلى الحد الشهري للمواعيد"
                  : "Monthly appointment limit reached"}
              </p>

              <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                {isArabic
                  ? `الباقة المجانية لهذه العيادة تسمح بحد أقصى ${FREE_APPOINTMENT_LIMIT} موعدًا شهريًا.`
                  : `This clinic's Free plan allows up to ${FREE_APPOINTMENT_LIMIT} appointments per month.`}
              </p>

            </div>
          )}

          {/* ================================== */}
          {/* Error */}
          {/* ================================== */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* ================================== */}
          {/* Success */}
          {/* ================================== */}

          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">

              <p className="font-semibold">
                {success}
              </p>

              <p className="mt-1 text-sm">
                {isArabic
                  ? "سيظهر الطلب للطبيب، وسيصلك إشعار عند القبول أو الرفض."
                  : "The request will appear to the doctor, and you will receive a notification when it is accepted or rejected."}
              </p>

            </div>
          )}

          {/* ================================== */}
          {/* Form */}
          {/* ================================== */}

          <form
            onSubmit={handleBooking}
            className="space-y-6"
          >

            {/* ================================= */}
            {/* Name */}
            {/* ================================= */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "الاسم"
                  : "Your Name"}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder={
                  isArabic
                    ? "أدخل اسمك"
                    : "Enter your name"
                }
                required
                disabled={
                  hasReachedAppointmentLimit ||
                  loggedInPatient
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
              />

            </div>

            {/* ================================= */}
            {/* Phone */}
            {/* ================================= */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "رقم الهاتف"
                  : "Phone Number"}
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder={
                  isArabic
                    ? "أدخل رقم هاتفك"
                    : "Enter your phone number"
                }
                required
                disabled={
                  hasReachedAppointmentLimit ||
                  loggedInPatient
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
              />

            </div>

            {/* ================================= */}
            {/* Appointment Type */}
            {/* ================================= */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "نوع الحجز"
                  : "Appointment Type"}
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                {/* ============================= */}
                {/* Checkup */}
                {/* ============================= */}

                <button
                  type="button"
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  onClick={() =>
                    setAppointmentType(
                      "new_checkup"
                    )
                  }
                  className={`rounded-xl border-2 p-4 text-center transition ${
                    appointmentType ===
                    "new_checkup"
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                  }`}
                >

                  <Stethoscope className="mx-auto mb-2 h-7 w-7" />

                  <span className="block font-semibold">
                    {isArabic
                      ? "كشف"
                      : "Checkup"}
                  </span>

                  {appointmentType ===
                    "new_checkup" && (
                    <span className="mt-1 block text-xs">
                      ✓{" "}
                      {isArabic
                        ? "تم الاختيار"
                        : "Selected"}
                    </span>
                  )}

                </button>

                {/* ============================= */}
                {/* X-Ray */}
                {/* ============================= */}

                <button
                  type="button"
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  onClick={() =>
                    setAppointmentType(
                      "xray"
                    )
                  }
                  className={`rounded-xl border-2 p-4 text-center transition ${
                    appointmentType ===
                    "xray"
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                  }`}
                >

                  <ScanLine className="mx-auto mb-2 h-7 w-7" />

                  <span className="block font-semibold">
                    {isArabic
                      ? "أشعة"
                      : "X-ray"}
                  </span>

                  {appointmentType ===
                    "xray" && (
                    <span className="mt-1 block text-xs">
                      ✓{" "}
                      {isArabic
                        ? "تم الاختيار"
                        : "Selected"}
                    </span>
                  )}

                </button>

                {/* ============================= */}
                {/* Follow-up */}
                {/* ============================= */}

                <button
                  type="button"
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  onClick={() =>
                    setAppointmentType(
                      "follow_up"
                    )
                  }
                  className={`rounded-xl border-2 p-4 text-center transition ${
                    appointmentType ===
                    "follow_up"
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                  }`}
                >

                  <RotateCcw className="mx-auto mb-2 h-7 w-7" />

                  <span className="block font-semibold">
                    {isArabic
                      ? "إعادة"
                      : "Follow-up"}
                  </span>

                  {appointmentType ===
                    "follow_up" && (
                    <span className="mt-1 block text-xs">
                      ✓{" "}
                      {isArabic
                        ? "تم الاختيار"
                        : "Selected"}
                    </span>
                  )}

                </button>

              </div>

              {/* Selected Type */}

              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? "نوع الحجز المختار:"
                    : "Selected appointment type:"}
                </span>

                <span className="mx-2 font-bold text-teal-600 dark:text-teal-400">
                  {getAppointmentTypeLabel(
                    appointmentType
                  )}
                </span>

              </div>

            </div>

            {/* ================================= */}
            {/* Date + Time */}
            {/* ================================= */}

            <div className="grid gap-5 md:grid-cols-2">

              {/* Date */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "تاريخ الموعد"
                    : "Appointment Date"}
                </label>

                <div className="relative">

                  <Calendar
                    className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${
                      isArabic
                        ? "right-4"
                        : "left-4"
                    }`}
                  />

                  <input
                    type="date"
                    value={appointmentDate}
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) =>
                      setAppointmentDate(
                        e.target.value
                      )
                    }
                    required
                    disabled={
                      hasReachedAppointmentLimit
                    }
                    className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      isArabic
                        ? "pl-4 pr-12"
                        : "pl-12 pr-4"
                    }`}
                  />

                </div>

              </div>

              {/* Time */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "وقت الموعد"
                    : "Appointment Time"}
                </label>

                <div className="relative">

                  <Clock
                    className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${
                      isArabic
                        ? "right-4"
                        : "left-4"
                    }`}
                  />

                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) =>
                      setAppointmentTime(
                        e.target.value
                      )
                    }
                    required
                    disabled={
                      hasReachedAppointmentLimit
                    }
                    className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      isArabic
                        ? "pl-4 pr-12"
                        : "pl-12 pr-4"
                    }`}
                  />

                </div>

              </div>

            </div>

            {/* ================================= */}
            {/* Notes */}
            {/* ================================= */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "ملاحظات"
                  : "Notes"}
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder={
                  isArabic
                    ? "أي معلومات إضافية..."
                    : "Any additional information..."
                }
                rows={4}
                disabled={
                  hasReachedAppointmentLimit
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>

            {/* ================================= */}
            {/* Submit */}
            {/* ================================= */}

            <button
              type="submit"
              disabled={
                booking ||
                hasReachedAppointmentLimit
              }
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70"
            >
              {booking
                ? isArabic
                  ? "جاري إرسال الطلب..."
                  : "Sending Request..."
                : hasReachedAppointmentLimit
                  ? isArabic
                    ? "تم الوصول للحد الشهري"
                    : "Monthly Limit Reached"
                  : isArabic
                    ? "طلب حجز موعد"
                    : "Request Appointment"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;

