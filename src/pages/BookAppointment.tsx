
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  ScanLine,
} from "lucide-react";
import { supabase } from "../supabase";
import {
  translations,
  type Language,
} from "../i18n";

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
  | "xray";

type MedicalConditionsAnswer =
  | ""
  | "no"
  | "yes";

const FREE_APPOINTMENT_LIMIT = 50;

const BookAppointment = () => {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();
  const location = useLocation();

  const [clinic, setClinic] =
    useState<Clinic | null>(null);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [age, setAge] =
    useState("");

  const [
    hasMedicalConditions,
    setHasMedicalConditions,
  ] =
    useState<MedicalConditionsAnswer>(
      ""
    );

  const [
    medicalConditionsDetails,
    setMedicalConditionsDetails,
  ] = useState("");

  const [
    appointmentType,
    setAppointmentType,
  ] =
    useState<AppointmentType>(
      "new_checkup"
    );

  const [
    appointmentDate,
    setAppointmentDate,
  ] = useState("");

  const [
    appointmentTime,
    setAppointmentTime,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [booking, setBooking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    appointmentCount,
    setAppointmentCount,
  ] = useState(0);

  // ============================================================
  // Language
  // ============================================================

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

  const isArabic = language === "ar";
  const t = translations[language];

  // ============================================================
  // Language Change
  // ============================================================

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

  // ============================================================
  // Protect Booking Page
  // ============================================================

  useEffect(() => {
    const checkPatientAccess =
      async () => {
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
          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          // ------------------------------------------------------
          // No Auth User
          // ------------------------------------------------------

          if (!user) {
            const redirectUrl =
              `${location.pathname}${location.search}`;

            navigate(
              `/patient/login?redirect=${encodeURIComponent(
                redirectUrl
              )}`,
              {
                replace: true,
              }
            );

            return;
          }

          // ------------------------------------------------------
          // Verify Patient Account
          // ------------------------------------------------------
          //
          // مجرد وجود Supabase session مش كفاية.
          // لازم يكون المستخدم مرتبط بسجل Patient.
          //

          const {
            data: patientRecord,
            error: patientError,
          } =
            await supabase
              .from("patients")
              .select("id")
              .eq("user_id", user.id)
              .limit(1)
              .maybeSingle();

          if (
            patientError ||
            !patientRecord
          ) {
            console.error(
              "Patient access verification error:",
              patientError
            );

            const redirectUrl =
              `${location.pathname}${location.search}`;

            navigate(
              `/patient/login?redirect=${encodeURIComponent(
                redirectUrl
              )}&reason=patient_account_required`,
              {
                replace: true,
              }
            );

            return;
          }

          // ------------------------------------------------------
          // Authorized Patient
          // ------------------------------------------------------

          await loadClinicData();
        } catch (err) {
          console.error(
            "Booking access error:",
            err
          );

          const redirectUrl =
            `${location.pathname}${location.search}`;

          navigate(
            `/patient/login?redirect=${encodeURIComponent(
              redirectUrl
            )}`,
            {
              replace: true,
            }
          );
        }
      };

    const loadClinicData =
      async () => {
        if (!id) {
          return;
        }

        try {
          // ======================================================
          // Clinic
          // ======================================================

          const {
            data: clinicData,
            error: clinicError,
          } =
            await supabase
              .from("clinics")
              .select(
                "id, name, subscription_plan"
              )
              .eq("id", id)
              .single();

          if (clinicError) {
            console.error(
              clinicError
            );

            setError(
              isArabic
                ? "العيادة غير موجودة."
                : "Clinic not found."
            );

            return;
          }

          setClinic(clinicData);

          // ======================================================
          // Monthly Appointment Count
          // ======================================================

          const {
            start,
            end,
          } = getCurrentMonthRange();

          const {
            count,
            error:
              appointmentCountError,
          } =
            await supabase
              .from("appointments")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq("clinic_id", id)
              .gte(
                "appointment_date",
                start
              )
              .lt(
                "appointment_date",
                end
              );

          if (
            appointmentCountError
          ) {
            console.error(
              appointmentCountError
            );
          } else {
            setAppointmentCount(
              count || 0
            );
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

    checkPatientAccess();
  }, [
    id,
    navigate,
    location.pathname,
    location.search,
    isArabic,
  ]);

  // ============================================================
  // Current Month
  // ============================================================

  const getCurrentMonthRange =
    () => {
      const now = new Date();

      const startOfMonth =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      const startOfNextMonth =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1
        );

      const formatDate = (
        date: Date
      ) => {
        return date
          .toISOString()
          .split("T")[0];
      };

      return {
        start:
          formatDate(
            startOfMonth
          ),
        end:
          formatDate(
            startOfNextMonth
          ),
      };
    };

  // ============================================================
  // Appointment Type Label
  // ============================================================

  const getAppointmentTypeLabel =
    (
      type: AppointmentType
    ) => {
      switch (type) {
        case "new_checkup":
          return isArabic
            ? "كشف"
            : "Checkup";

        case "xray":
          return isArabic
            ? "أشعة"
            : "X-ray";

        default:
          return isArabic
            ? "كشف"
            : "Checkup";
      }
    };

  // ============================================================
  // Free Plan
  // ============================================================

  const isFreePlan =
    clinic?.subscription_plan ===
      "Free" ||
    !clinic?.subscription_plan;

  const hasReachedAppointmentLimit =
    isFreePlan &&
    appointmentCount >=
      FREE_APPOINTMENT_LIMIT;

  // ============================================================
  // Handle Booking
  // ============================================================

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

    // ========================================================
    // Validate Patient Name + Phone
    // ========================================================

    if (
      !name.trim() ||
      !phone.trim()
    ) {
      setError(
        isArabic
          ? "من فضلك أدخل اسم المريض ورقم هاتفه."
          : "Please enter the patient's name and phone number."
      );

      return;
    }

    // ========================================================
    // Name
    // ========================================================

    const patientName =
      name
        .trim()
        .replace(/\s+/g, " ");

    const nameParts =
      patientName
        .split(" ")
        .filter(Boolean);

    if (
      nameParts.length < 3
    ) {
      setError(
        isArabic
          ? "يجب كتابة اسم المريض ثلاثيًا على الأقل."
          : "The patient's name must contain at least three names."
      );

      return;
    }

    // ========================================================
    // Age
    // ========================================================

    const trimmedAge =
      age.trim();

    const ageNumber =
      Number(trimmedAge);

    if (
      !trimmedAge ||
      Number.isNaN(ageNumber) ||
      ageNumber <= 0 ||
      ageNumber > 120
    ) {
      setError(
        isArabic
          ? "من فضلك أدخل عمر المريض بشكل صحيح."
          : "Please enter a valid patient age."
      );

      return;
    }

    // ========================================================
    // Medical Conditions
    // ========================================================

    if (
      !hasMedicalConditions
    ) {
      setError(
        isArabic
          ? "من فضلك حدد هل يعاني المريض من أي أمراض أم لا."
          : "Please specify whether the patient has any medical conditions."
      );

      return;
    }

    if (
      hasMedicalConditions ===
        "yes" &&
      !medicalConditionsDetails.trim()
    ) {
      setError(
        isArabic
          ? "من فضلك اذكر الأمراض التي يعاني منها المريض."
          : "Please describe the patient's medical conditions."
      );

      return;
    }

    // ========================================================
    // Appointment Type
    // ========================================================

    if (!appointmentType) {
      setError(
        isArabic
          ? "من فضلك اختر نوع الحجز."
          : "Please choose the appointment type."
      );

      return;
    }

    // ========================================================
    // Date + Time
    // ========================================================

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

    // ========================================================
    // Free Plan Limit
    // ========================================================

    if (
      isFreePlan &&
      appointmentCount >=
        FREE_APPOINTMENT_LIMIT
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
      // ========================================================
      // Current User
      // ========================================================

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        const redirectUrl =
          `${location.pathname}${location.search}`;

        navigate(
          `/patient/login?redirect=${encodeURIComponent(
            redirectUrl
          )}`,
          {
            replace: true,
          }
        );

        return;
      }

      // ========================================================
      // Verify Patient Account Again
      // ========================================================

      const {
        data: patientAccount,
        error:
          patientAccountError,
      } =
        await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

      if (
        patientAccountError ||
        !patientAccount
      ) {
        const redirectUrl =
          `${location.pathname}${location.search}`;

        navigate(
          `/patient/login?redirect=${encodeURIComponent(
            redirectUrl
          )}&reason=patient_account_required`,
          {
            replace: true,
          }
        );

        return;
      }

      // ========================================================
      // Medical Notes
      // ========================================================

      const medicalNotes =
        hasMedicalConditions ===
        "yes"
          ? medicalConditionsDetails.trim()
          : isArabic
            ? "لا يعاني من أي أمراض"
            : "No known medical conditions";

      // ========================================================
      // Create NEW Patient
      // ========================================================

      const {
        data: newPatient,
        error:
          patientInsertError,
      } =
        await supabase
          .from("patients")
          .insert({
            clinic_id: id,
            name: patientName,
            phone: phone.trim(),
            age: ageNumber,
            medical_notes:
              medicalNotes,
            user_id: user.id,
          })
          .select(
            "id, name, phone"
          )
          .single();

      if (patientInsertError) {
        throw patientInsertError;
      }

      const patient: Patient =
        newPatient;

      // ========================================================
      // Create Appointment
      // ========================================================

      const {
        data: newAppointment,
        error:
          appointmentError,
      } =
        await supabase
          .from("appointments")
          .insert({
            clinic_id: id,
            patient_id:
              patient.id,
            appointment_date:
              appointmentDate,
            appointment_time:
              appointmentTime,
            appointment_type:
              appointmentType,
            status: "pending",
            notes:
              notes.trim() ||
              null,
            created_by:
              "patient",
            updated_at:
              new Date().toISOString(),
          })
          .select("id")
          .single();

      if (appointmentError) {
        throw appointmentError;
      }

      setAppointmentCount(
        (current) =>
          current + 1
      );

      const appointmentTypeLabel =
        getAppointmentTypeLabel(
          appointmentType
        );

      // ========================================================
      // Doctor Notification ONLY
      // ========================================================

      const {
        error:
          doctorNotificationError,
      } =
        await supabase
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

      if (
        doctorNotificationError
      ) {
        console.error(
          "Doctor notification error:",
          doctorNotificationError
        );

        setError(
          isArabic
            ? `تم إنشاء الموعد، لكن تعذر إرسال إشعار للطبيب: ${doctorNotificationError.message}`
            : `The appointment was created, but the doctor notification could not be sent: ${doctorNotificationError.message}`
        );

        return;
      }

      // ========================================================
      // Success
      // ========================================================

      setSuccess(
        isArabic
          ? `تم إرسال طلب ${appointmentTypeLabel} بنجاح!`
          : `${appointmentTypeLabel} appointment request has been sent successfully!`
      );

      setName("");
      setPhone("");
      setAge("");
      setHasMedicalConditions(
        ""
      );
      setMedicalConditionsDetails(
        ""
      );

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

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري التحقق من الحساب..."
            : "Checking your account..."}
        </p>
      </div>
    );
  }

  // ============================================================
  // Clinic Not Found
  // ============================================================

  if (
    error &&
    !clinic
  ) {
    return (
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
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

  // ============================================================
  // Main
  // ============================================================

  return (
    <div
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
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

          {/* Header */}

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "حجز موعد"
                : "Book an Appointment"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {clinic?.name}
            </p>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "أدخل بيانات الشخص الذي تريد حجز الموعد له."
                : "Enter the information of the person you are booking the appointment for."}
            </p>

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
                  {
                    FREE_APPOINTMENT_LIMIT
                  }
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

          {/* Limit */}

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

          {/* Error */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Success */}

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

          {/* Form */}

          <form
            onSubmit={
              handleBooking
            }
            className="space-y-6"
          >

            {/* Name */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "اسم المريض"
                  : "Patient Name"}
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder={
                  isArabic
                    ? "أدخل الاسم ثلاثيًا على الأقل"
                    : "Enter at least three names"
                }
                required
                disabled={
                  hasReachedAppointmentLimit
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "يجب كتابة 3 أسماء على الأقل، مثل: أحمد سلمان عبدالحميد"
                  : "Enter at least three names, for example: Ahmed Salman Abdelhamid"}
              </p>

            </div>

            {/* Phone + Age */}

            <div className="grid gap-5 md:grid-cols-2">

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
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "أدخل رقم هاتف المريض"
                      : "Enter the patient's phone number"
                  }
                  required
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "عمر المريض"
                    : "Patient Age"}
                </label>

                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) =>
                    setAge(
                      e.target.value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "أدخل عمر المريض"
                      : "Enter the patient's age"
                  }
                  required
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                />

              </div>

            </div>

            {/* Medical Conditions */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "هل يعاني المريض من أي أمراض؟"
                  : "Does the patient have any medical conditions?"}
              </label>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  onClick={() =>
                    setHasMedicalConditions(
                      "no"
                    )
                  }
                  className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition ${
                    hasMedicalConditions ===
                    "no"
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700"
                  }`}
                >
                  {isArabic
                    ? "لا"
                    : "No"}
                </button>

                <button
                  type="button"
                  disabled={
                    hasReachedAppointmentLimit
                  }
                  onClick={() =>
                    setHasMedicalConditions(
                      "yes"
                    )
                  }
                  className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition ${
                    hasMedicalConditions ===
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

              {hasMedicalConditions ===
                "yes" && (
                <div className="mt-3">

                  <textarea
                    value={
                      medicalConditionsDetails
                    }
                    onChange={(e) =>
                      setMedicalConditionsDetails(
                        e.target.value
                      )
                    }
                    placeholder={
                      isArabic
                        ? "اذكر الأمراض، مثل: ضغط، سكر، حساسية من أدوية..."
                        : "Describe the conditions, e.g. blood pressure, diabetes, drug allergies..."
                    }
                    rows={3}
                    disabled={
                      hasReachedAppointmentLimit
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />

                </div>
              )}

            </div>

            {/* Appointment Type */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "نوع الحجز"
                  : "Appointment Type"}
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

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

              </div>

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

            {/* Date + Time */}

            <div className="grid gap-5 md:grid-cols-2">

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
                    value={
                      appointmentDate
                    }
                    min={
                      new Date()
                        .toISOString()
                        .split(
                          "T"
                        )[0]
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
                    value={
                      appointmentTime
                    }
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

            {/* Notes */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "ملاحظات"
                  : "Notes"}
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
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

            {/* Submit */}

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







