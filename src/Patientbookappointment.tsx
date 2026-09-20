import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  LogOut,
  MapPin,
  RefreshCcw,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  appointment_type: string | null;
  clinics?: { name: string } | null;
};

type Patient = { id: string; name: string };

type Clinic = {
  id: string;
  name: string;
  address: string | null;
  logo_url: string | null;
  phone: string | null;
};

type Offer = {
  id: string;
  title: string | null;
  description: string | null;
  discount: string | number | null;
  clinics?: { name: string } | null;
};

type FilterType = "all" | "pending" | "confirmed" | "completed" | "cancelled";

type TabId = "my_appointments" | "book" | "clinics" | "offers";

type AppointmentType = "new_checkup" | "follow_up" | "xray";

const PatientAppointments = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================
  // التبويب النشط — ده اللي بيتحكم في المحتوى تحت
  // ============================================
  const [activeTab, setActiveTab] = useState<TabId>("my_appointments");

  // العيادات
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [clinicSearch, setClinicSearch] = useState("");

  // العروض
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState("");

  // نموذج الحجز
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("new_checkup");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // ============================================
  // Language
  // ============================================

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

  // ============================================
  // Load appointments
  // ============================================

  const loadPatientAppointments = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        setError(
          isArabic
            ? "حدث خطأ أثناء التحقق من تسجيل الدخول."
            : "An error occurred while checking your login."
        );
        return;
      }

      if (!user) {
        window.location.href = "/patient/login";
        return;
      }

      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id, name, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (patientError) {
        console.error(patientError);
        setError(
          isArabic
            ? `تعذر تحميل بيانات المريض: ${patientError.message}`
            : `Could not load patient data: ${patientError.message}`
        );
        return;
      }

      if (!patientData || patientData.length === 0) {
        setError(
          isArabic
            ? "حساب المريض الخاص بك غير مرتبط بسجل مريض."
            : "Your patient account is not connected to a patient record."
        );
        return;
      }

      setPatient(patientData[0]);

      // تعبئة بيانات نموذج الحجز تلقائياً
      setName((prev) => prev || patientData[0].name || "");
      const anyPhone = (patientData[0] as any).phone;
      if (anyPhone) setPhone((prev) => prev || anyPhone);

      const ids = patientData.map((p) => p.id);
      setPatientIds(ids);

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          appointment_type,
          clinics ( name )
        `
        )
        .in("patient_id", ids)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

      if (appointmentError) {
        console.error(appointmentError);
        setError(
          isArabic
            ? `تعذر تحميل المواعيد: ${appointmentError.message}`
            : `Could not load appointments: ${appointmentError.message}`
        );
        return;
      }

      const formatted: Appointment[] = (appointmentData || []).map(
        (a: any) => ({
          id: a.id,
          appointment_date: a.appointment_date,
          appointment_time: a.appointment_time,
          status: a.status,
          notes: a.notes,
          appointment_type: a.appointment_type,
          clinics: Array.isArray(a.clinics)
            ? a.clinics[0] || null
            : a.clinics || null,
        })
      );

      setAppointments(formatted);
    } catch (err) {
      console.error(err);
      setError(
        isArabic
          ? "حدث خطأ أثناء تحميل المواعيد."
          : "An error occurred while loading appointments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================
  // Load clinics
  // ============================================

  const loadClinics = async () => {
    setLoadingClinics(true);

    const { data, error: clinicsError } = await supabase
      .from("clinics")
      .select("id, name, address, logo_url, phone")
      .order("name", { ascending: true });

    if (clinicsError) {
      console.error("Clinics error:", clinicsError);
      setClinics([]);
    } else {
      setClinics(data || []);
    }

    setLoadingClinics(false);
  };

  // ============================================
  // Load offers (لو عندك جدول offers)
  // ============================================

  const loadOffers = async () => {
    setLoadingOffers(true);
    setOffersError("");

    const { data, error: offersErr } = await supabase
      .from("offers")
      .select("id, title, description, discount, clinics ( name )")
      .order("created_at", { ascending: false });

    if (offersErr) {
      console.error("Offers error:", offersErr);
      setOffers([]);
      setOffersError(offersErr.message);
    } else {
      setOffers(
        (data || []).map((o: any) => ({
          ...o,
          clinics: Array.isArray(o.clinics) ? o.clinics[0] || null : o.clinics,
        }))
      );
    }

    setLoadingOffers(false);
  };

  useEffect(() => {
    loadPatientAppointments();
    loadClinics();
  }, []);

  useEffect(() => {
    if (activeTab === "offers" && offers.length === 0 && !offersError) {
      loadOffers();
    }
  }, [activeTab]);

  useEffect(() => {
    setError("");
  }, [language]);

  // ============================================
  // Handlers
  // ============================================

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/patient/login";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();

    // البحث بقى بيفلتر العيادات جوه الصفحة بدل ما ينقلك
    setClinicSearch(trimmed);
    handleTabClick("clinics");
  };

  const handleBookInClinic = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    setFormError("");
    setFormSuccess("");
    handleTabClick("book");
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClinicId) {
      setFormError(
        isArabic ? "اختر عيادة أولاً." : "Please select a clinic first."
      );
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const { error: insertError } = await supabase.from("appointments").insert({
      clinic_id: selectedClinicId,
      patient_id: patientIds[0] || null,
      patient_name: name,
      patient_phone: phone,
      patient_age: age ? Number(age) : null,
      appointment_type: appointmentType,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: bookingNotes || null,
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setFormError(insertError.message);
      return;
    }

    setFormSuccess(
      isArabic ? "تم تقديم طلب الحجز بنجاح!" : "Booking submitted successfully!"
    );
    setAppointmentDate("");
    setAppointmentTime("");
    setBookingNotes("");
    loadPatientAppointments(true);
  };

  // ============================================
  // Helpers
  // ============================================

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return isArabic ? "قيد الانتظار" : "Pending";
      case "confirmed":
        return isArabic ? "مؤكد" : "Confirmed";
      case "cancelled":
        return isArabic ? "ملغي" : "Cancelled";
      case "completed":
        return isArabic ? "مكتمل" : "Completed";
      default:
        return status;
    }
  };

  const formatAppointmentType = (type: string | null) => {
    switch (type) {
      case "follow_up":
        return isArabic ? "إعادة" : "Follow-up";
      case "xray":
        return isArabic ? "أشعة" : "X-ray";
      default:
        return isArabic ? "كشف" : "Checkup";
    }
  };

  const getAppointmentTypeStyle = (type: string | null) => {
    switch (type) {
      case "follow_up":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "xray":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(isArabic ? "ar-EG" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    if (!time) return "-";
    const [hours, minutes] = time.split(":");
    if (!hours || !minutes) return time;
    const d = new Date();
    d.setHours(Number(hours), Number(minutes), 0, 0);
    return d.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return appointments;
    return appointments.filter((a) => a.status === filter);
  }, [appointments, filter]);

  const nextAppointment = useMemo(
    () =>
      appointments.find(
        (a) => a.status === "pending" || a.status === "confirmed"
      ) || null,
    [appointments]
  );

  const counts = useMemo(
    () => ({
      all: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    }),
    [appointments]
  );

  const filterLabels: Record<FilterType, string> = {
    all: isArabic ? "الكل" : "All",
    pending: isArabic ? "قيد الانتظار" : "Pending",
    confirmed: isArabic ? "مؤكد" : "Confirmed",
    completed: isArabic ? "مكتمل" : "Completed",
    cancelled: isArabic ? "ملغي" : "Cancelled",
  };

  const filteredClinics = useMemo(() => {
    const s = clinicSearch.trim().toLowerCase();
    if (!s) return clinics;
    return clinics.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.address?.toLowerCase().includes(s)
    );
  }, [clinics, clinicSearch]);

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) || null;

  // ============================================
  // الكروت الأربعة (أطباء الأسنان اتشالت واتحطت مواعيدي)
  // ============================================

  const quickActions: { id: TabId; label: string; icon: any }[] = [
    {
      id: "my_appointments",
      label: isArabic ? "مواعيدي" : "My Appointments",
      icon: Calendar,
    },
    {
      id: "book",
      label: isArabic ? "حجز موعد" : "Book Appointment",
      icon: CalendarPlus,
    },
    {
      id: "clinics",
      label: isArabic ? "العيادات" : "Clinics",
      icon: Building2,
    },
    {
      id: "offers",
      label: isArabic ? "عروض خاصة" : "Special Offers",
      icon: Sparkles,
    },
  ];

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24 dark:bg-slate-950"
      >
        <div className="rounded-2xl bg-white px-10 py-8 shadow-lg dark:bg-slate-900">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {isArabic ? "جاري تحميل مواعيدك..." : "Loading your appointments..."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Main page
  // ============================================

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 dark:bg-slate-950 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        {/* ==================== Hero ==================== */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-100">
                {isArabic ? "بوابة المريض" : "Patient Portal"}
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                {isArabic ? "مرحباً بك" : "Welcome"}
                {patient ? `، ${patient.name}` : ""} 👋
              </h1>

              <p className="mt-2 max-w-md text-teal-50">
                {nextAppointment
                  ? isArabic
                    ? `موعدك القادم يوم ${formatDate(
                        nextAppointment.appointment_date
                      )} الساعة ${formatTime(
                        nextAppointment.appointment_time
                      )}.`
                    : `Your next appointment is on ${formatDate(
                        nextAppointment.appointment_date
                      )} at ${formatTime(nextAppointment.appointment_time)}.`
                  : isArabic
                  ? "ابحث عن أقرب عيادة وأنت جاهز لحجز موعدك."
                  : "Find a nearby clinic and you're ready to book."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/patient/notifications"
                aria-label={t.common.notifications}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
              >
                <Bell className="h-5 w-5" />
              </Link>

              <button
                type="button"
                onClick={() => loadPatientAppointments(true)}
                disabled={refreshing}
                aria-label={isArabic ? "تحديث" : "Refresh"}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label={t.auth.logout}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-sm dark:bg-slate-900/95"
          >
            <Search className="ms-2 h-5 w-5 shrink-0 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isArabic
                  ? "ابحث عن عيادة أو تخصص"
                  : "Search for a clinic or specialty"
              }
              className="w-full bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />

            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              {isArabic ? "بحث" : "Search"}
            </button>
          </form>
        </div>

        {/* ==================== Error ==================== */}
        {error && (
          <div
            className={`mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {error}
          </div>
        )}

        {/* ==================== Quick action tabs ==================== */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const isActive = activeTab === action.id;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleTabClick(action.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? "bg-teal-600 text-white shadow-teal-600/20"
                    : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400"
                  }`}
                >
                  <action.icon className="h-5 w-5" />
                </span>

                <span className="text-sm font-semibold">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================== محتوى التبويب ==================== */}
        <div ref={contentRef} className="scroll-mt-28">
          {/* ---------- مواعيدي ---------- */}
          {activeTab === "my_appointments" && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                {isArabic ? "مواعيدك" : "Your Appointments"}
              </h2>

              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {(
                  [
                    "all",
                    "pending",
                    "confirmed",
                    "completed",
                    "cancelled",
                  ] as FilterType[]
                ).map((status) => {
                  const active = filter === status;

                  const activeClasses: Record<FilterType, string> = {
                    all: "bg-teal-600 text-white",
                    pending: "bg-yellow-500 text-white",
                    confirmed: "bg-green-600 text-white",
                    completed: "bg-blue-600 text-white",
                    cancelled: "bg-red-600 text-white",
                  };

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilter(status)}
                      className={`rounded-2xl p-4 shadow-sm transition ${
                        isArabic ? "text-right" : "text-left"
                      } ${
                        active
                          ? activeClasses[status]
                          : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {filterLabels[status]}
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {counts[status]}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                <div
                  className={`flex flex-col gap-2 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {isArabic ? "قائمة المواعيد" : "Appointment List"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {isArabic
                        ? "عرض حالة وتفاصيل مواعيدك."
                        : "View the status and details of your appointments."}
                    </p>
                  </div>

                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? `عرض ${filteredAppointments.length} ${
                          filteredAppointments.length === 1
                            ? "موعد"
                            : "مواعيد"
                        }`
                      : `Showing ${filteredAppointments.length} appointment${
                          filteredAppointments.length !== 1 ? "s" : ""
                        }`}
                  </div>
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <span className="text-2xl">📅</span>
                    </div>

                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {appointments.length === 0
                        ? isArabic
                          ? "لا توجد مواعيد بعد"
                          : "No appointments yet"
                        : isArabic
                        ? "لا توجد مواعيد"
                        : "No appointments found"}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {appointments.length === 0
                        ? isArabic
                          ? "ليس لديك أي مواعيد حتى الآن."
                          : "You don't have any appointments yet."
                        : isArabic
                        ? "لا توجد مواعيد بهذه الحالة."
                        : "There are no appointments with this status."}
                    </p>

                    {appointments.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleTabClick("clinics")}
                        className="mt-5 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700"
                      >
                        {t.common.findClinic}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/60">
                        <tr>
                          {[
                            isArabic ? "العيادة" : "Clinic",
                            isArabic ? "التاريخ" : "Date",
                            isArabic ? "الوقت" : "Time",
                            isArabic ? "النوع" : "Type",
                            isArabic ? "الحالة" : "Status",
                            isArabic ? "ملاحظات" : "Notes",
                          ].map((head) => (
                            <th
                              key={head}
                              className={`px-6 py-4 ${
                                isArabic ? "text-right" : "text-left"
                              } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {filteredAppointments.map((appointment) => (
                          <tr
                            key={appointment.id}
                            className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                          >
                            <td
                              className={`px-6 py-5 font-semibold text-slate-900 dark:text-white ${
                                isArabic ? "text-right" : "text-left"
                              }`}
                            >
                              {appointment.clinics?.name ||
                                t.common.dentalClinic}
                            </td>

                            <td
                              className={`px-6 py-5 text-slate-600 dark:text-slate-300 ${
                                isArabic ? "text-right" : "text-left"
                              }`}
                            >
                              {formatDate(appointment.appointment_date)}
                            </td>

                            <td
                              className={`px-6 py-5 text-slate-600 dark:text-slate-300 ${
                                isArabic ? "text-right" : "text-left"
                              }`}
                            >
                              {formatTime(appointment.appointment_time)}
                            </td>

                            <td
                              className={`px-6 py-5 ${
                                isArabic ? "text-right" : "text-left"
                              }`}
                            >
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getAppointmentTypeStyle(
                                  appointment.appointment_type
                                )}`}
                              >
                                {formatAppointmentType(
                                  appointment.appointment_type
                                )}
                              </span>
                            </td>

                            <td
                              className={`px-6 py-5 ${
                                isArabic ? "text-right" : "text-left"
                              }`}
                            >
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                                  appointment.status
                                )}`}
                              >
                                {formatStatus(appointment.status)}
                              </span>
                            </td>

                            <td
                              className={`max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300 ${
                                isArabic ? "text-right" : "text-left"
                              }`}
                            >
                              {appointment.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---------- حجز موعد ---------- */}
          {activeTab === "book" && (
            <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 sm:p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic ? "حجز موعد جديد" : "Book a new appointment"}
              </h2>

              {formError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isArabic ? "العيادة" : "Clinic"}
                  </label>
                  <select
                    required
                    value={selectedClinicId}
                    onChange={(e) => setSelectedClinicId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      {isArabic ? "اختر عيادة" : "Select a clinic"}
                    </option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {selectedClinic?.address && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedClinic.address}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isArabic ? "الاسم بالكامل" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isArabic ? "رقم الهاتف" : "Phone Number"}
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isArabic ? "العمر" : "Age"}
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isArabic ? "نوع الكشف" : "Appointment Type"}
                    </label>
                    <select
                      value={appointmentType}
                      onChange={(e) =>
                        setAppointmentType(e.target.value as AppointmentType)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="new_checkup">
                        {isArabic ? "كشف جديد" : "New Checkup"}
                      </option>
                      <option value="follow_up">
                        {isArabic ? "إعادة / متابعة" : "Follow-up"}
                      </option>
                      <option value="xray">
                        {isArabic ? "أشعة" : "X-Ray"}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isArabic ? "تاريخ الموعد" : "Appointment Date"}
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                      {isArabic ? "الوقت المناسب" : "Appointment Time"}
                    </label>
                    <input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isArabic ? "ملاحظات إضافية" : "Additional Notes"}
                  </label>
                  <textarea
                    rows={3}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl bg-teal-600 py-3.5 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {submitting
                    ? isArabic
                      ? "جاري إرسال الطلب..."
                      : "Submitting..."
                    : isArabic
                    ? "تأكيد طلب الحجز"
                    : "Confirm Booking"}
                </button>
              </form>
            </section>
          )}

          {/* ---------- العيادات ---------- */}
          {activeTab === "clinics" && (
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {isArabic ? "العيادات المتاحة" : "Available Clinics"}
                </h2>

                <div className="relative w-full sm:w-72">
                  <Search
                    className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                      isArabic ? "right-3" : "left-3"
                    }`}
                  />
                  <input
                    type="text"
                    value={clinicSearch}
                    onChange={(e) => setClinicSearch(e.target.value)}
                    placeholder={
                      isArabic ? "ابحث عن عيادة..." : "Search clinics..."
                    }
                    className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white ${
                      isArabic ? "pr-9 pl-3" : "pl-9 pr-3"
                    }`}
                  />
                </div>
              </div>

              {loadingClinics ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isArabic ? "جاري التحميل..." : "Loading..."}
                </p>
              ) : filteredClinics.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
                  {isArabic
                    ? "لا توجد عيادات لعرضها حالياً."
                    : "No clinics to show right now."}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredClinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
                    >
                      <div>
                        <div className="mb-3 flex items-center gap-3">
                          {clinic.logo_url ? (
                            <img
                              src={clinic.logo_url}
                              alt={clinic.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                              <Stethoscope className="h-6 w-6" />
                            </span>
                          )}

                          <h3 className="font-bold text-slate-800 dark:text-white">
                            {clinic.name}
                          </h3>
                        </div>

                        {clinic.address && (
                          <p className="mb-4 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="h-4 w-4 shrink-0" />
                            {clinic.address}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleBookInClinic(clinic.id)}
                          className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          {isArabic ? "احجز هنا" : "Book here"}
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/clinics/${clinic.id}`)}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {isArabic ? "التفاصيل" : "Details"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ---------- عروض خاصة ---------- */}
          {activeTab === "offers" && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {isArabic ? "العروض الخاصة" : "Special Offers"}
              </h2>

              {loadingOffers ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isArabic ? "جاري التحميل..." : "Loading..."}
                </p>
              ) : offers.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-slate-900">
                  <Sparkles className="mx-auto mb-3 h-10 w-10 text-teal-500" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? "لا توجد عروض متاحة حالياً. تابعنا قريباً!"
                      : "No offers available right now. Check back soon!"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-white">
                          {offer.title || (isArabic ? "عرض" : "Offer")}
                        </h3>

                        {offer.discount && (
                          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                            {offer.discount}
                            {typeof offer.discount === "number" ? "%" : ""}
                          </span>
                        )}
                      </div>

                      {offer.clinics?.name && (
                        <p className="mb-2 text-xs text-slate-400">
                          {offer.clinics.name}
                        </p>
                      )}

                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {offer.description || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;