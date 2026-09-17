import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type RecentAppointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patients?: {
    name: string;
  } | null;
};

type MedicalRecord = {
  id: string;
  cost: number | null;
};

type Payment = {
  id: string;
  amount: number;
  medical_record_id: string | null;
};

const DoctorDashboard = () => {
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] =
    useState("Free");

  const [patientsCount, setPatientsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] =
    useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  const [totalTreatmentValue, setTotalTreatmentValue] =
    useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);

  const [recentAppointments, setRecentAppointments] =
    useState<RecentAppointment[]>([]);

  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(
      "dentalcare-language"
    );

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

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

  useEffect(() => {
    const loadDoctorData = async () => {
      setLoading(true);

      // Get Logged-in Doctor
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/doctor/login";
        return;
      }

      // Get Doctor Profile + Clinic
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          name,
          email,
          clinic_id,
          clinics (
            name,
            subscription_plan,
            subscription_status
          )
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(
          "Error loading doctor:",
          error
        );

        setLoading(false);
        return;
      }

      setDoctorName(profile.name || "");
      setDoctorEmail(
        profile.email || user.email || ""
      );

      if (profile.clinics) {
        const clinic = Array.isArray(profile.clinics)
          ? profile.clinics[0]
          : profile.clinics;

        setClinicName(clinic?.name || "");

        setSubscriptionPlan(
          clinic?.subscription_plan || "Free"
        );
      }

      const clinicId = profile.clinic_id;

      if (!clinicId) {
        setLoading(false);
        return;
      }

      // Patients Count
      const {
        count: patientsCount,
        error: patientsError,
      } = await supabase
        .from("patients")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (patientsError) {
        console.error(
          "Patients count error:",
          patientsError
        );
      } else {
        setPatientsCount(
          patientsCount || 0
        );
      }

      // Appointments Count
      const {
        count: appointmentsCount,
        error: appointmentsError,
      } = await supabase
        .from("appointments")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (appointmentsError) {
        console.error(
          "Appointments count error:",
          appointmentsError
        );
      } else {
        setAppointmentsCount(
          appointmentsCount || 0
        );
      }

      // Services Count
      const {
        count: servicesCount,
        error: servicesError,
      } = await supabase
        .from("services")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (servicesError) {
        console.error(
          "Services count error:",
          servicesError
        );
      } else {
        setServicesCount(
          servicesCount || 0
        );
      }

      // Reviews Count
      const {
        count: reviewsCount,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("clinic_id", clinicId);

      if (reviewsError) {
        console.error(
          "Reviews count error:",
          reviewsError
        );
      } else {
        setReviewsCount(
          reviewsCount || 0
        );
      }

      // Medical Records
      const {
        data: medicalRecords,
        error: medicalRecordsError,
      } = await supabase
        .from("medical_records")
        .select("id, cost")
        .eq("clinic_id", clinicId);

      if (medicalRecordsError) {
        console.error(
          "Medical records error:",
          medicalRecordsError
        );
      } else {
        const records: MedicalRecord[] =
          medicalRecords || [];

        const treatmentValue =
          records.reduce(
            (total, record) =>
              total +
              Number(record.cost || 0),
            0
          );

        setTotalTreatmentValue(
          treatmentValue
        );

        // Payments
        const {
          data: payments,
          error: paymentsError,
        } = await supabase
          .from("payments")
          .select(
            "id, amount, medical_record_id"
          )
          .eq("clinic_id", clinicId);

        if (paymentsError) {
          console.error(
            "Payments error:",
            paymentsError
          );
        } else {
          const paymentRows: Payment[] =
            payments || [];

          const paid =
            paymentRows.reduce(
              (total, payment) =>
                total +
                Number(payment.amount || 0),
              0
            );

          setTotalPaid(paid);

          const remaining = Math.max(
            treatmentValue - paid,
            0
          );

          setTotalRemaining(
            remaining
          );
        }
      }

      // Recent Appointments
      const {
        data: recentData,
        error: recentError,
      } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          patients (
            name
          )
        `)
        .eq("clinic_id", clinicId)
        .order("appointment_date", {
          ascending: true,
        })
        .order("appointment_time", {
          ascending: true,
        })
        .limit(5);

      if (recentError) {
        console.error(
          "Recent appointments error:",
          recentError
        );
      } else {
        const formattedAppointments: RecentAppointment[] =
          (recentData || []).map(
            (item: any) => ({
              id: item.id,
              appointment_date:
                item.appointment_date,
              appointment_time:
                item.appointment_time,
              status: item.status,
              patients: item.patients
                ? {
                    name:
                      item.patients.name,
                  }
                : null,
            })
          );

        setRecentAppointments(
          formattedAppointments
        );
      }

      setLoading(false);
    };

    loadDoctorData();
  }, []);

  const formatMoney = (
    amount: number
  ) => {
    return `${amount.toLocaleString(
      "en-US"
    )} EGP`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل لوحة التحكم..."
            : "Loading dashboard..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 p-6 pt-32 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {isArabic
              ? `مرحباً د. ${doctorName}`
              : `Welcome, Dr. ${doctorName}`}
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isArabic
              ? "قم بإدارة عيادتك للأسنان من مكان واحد."
              : "Manage your dental clinic from one place."}
          </p>
        </div>

        {/* Doctor + Clinic */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "الطبيب"
                : "Doctor"}
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? `د. ${doctorName}`
                : `Dr. ${doctorName}`}
            </p>

            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {doctorEmail}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "العيادة"
                : "Clinic"}
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              {clinicName ||
                (isArabic
                  ? "لم يتم العثور على عيادة"
                  : "No clinic found")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "الاشتراك"
                : "Subscription"}
            </p>

            <p className="mt-2 text-xl font-bold text-teal-600 dark:text-teal-400">
              {subscriptionPlan}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/subscription";
              }}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "إدارة الخطة"
                : "Manage Plan"}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            {isArabic
              ? "الإحصائيات"
              : "Statistics"}
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.patients}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {patientsCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "إجمالي المرضى"
                  : "Total patients"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.appointments}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {appointmentsCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "إجمالي المواعيد"
                  : "Total appointments"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.doctorServices}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {servicesCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "خدمات العيادة"
                  : "Clinic services"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.reviews}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {reviewsCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "تقييمات المرضى"
                  : "Patient reviews"}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            {isArabic
              ? "نظرة عامة مالية"
              : "Financial Overview"}
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "قيمة العلاج"
                  : "Treatment Value"}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {formatMoney(
                  totalTreatmentValue
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "إجمالي تكاليف العلاج"
                  : "Total treatment costs"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "إجمالي المدفوع"
                  : "Total Paid"}
              </p>

              <p className="mt-2 text-3xl font-bold text-teal-600 dark:text-teal-400">
                {formatMoney(totalPaid)}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "المدفوعات المستلمة"
                  : "Payments received"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "المبلغ المتبقي"
                  : "Total Remaining"}
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formatMoney(
                  totalRemaining
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "الرصيد المستحق"
                  : "Outstanding balance"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            {isArabic
              ? "إجراءات سريعة"
              : "Quick Actions"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => {
                window.location.href =
                  "/doctor/patients";
              }}
              className={`rounded-2xl bg-teal-600 p-5 text-white shadow-sm transition hover:bg-teal-700 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
            >
              <p className="text-lg font-bold">
                {t.dashboard.patients}
              </p>

              <p className="mt-1 text-sm text-teal-50">
                {isArabic
                  ? "إدارة سجلات المرضى"
                  : "Manage patient records"}
              </p>
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/appointments";
              }}
              className={`rounded-2xl bg-teal-600 p-5 text-white shadow-sm transition hover:bg-teal-700 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
            >
              <p className="text-lg font-bold">
                {t.dashboard.appointments}
              </p>

              <p className="mt-1 text-sm text-teal-50">
                {isArabic
                  ? "إدارة المواعيد"
                  : "Manage appointments"}
              </p>
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/payments";
              }}
              className={`rounded-2xl bg-teal-600 p-5 text-white shadow-sm transition hover:bg-teal-700 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
            >
              <p className="text-lg font-bold">
                {t.dashboard.payments}
              </p>

              <p className="mt-1 text-sm text-teal-50">
                {isArabic
                  ? "متابعة المدفوعات والأرصدة"
                  : "Track payments and balances"}
              </p>
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/services";
              }}
              className={`rounded-2xl bg-teal-600 p-5 text-white shadow-sm transition hover:bg-teal-700 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
            >
              <p className="text-lg font-bold">
                {t.dashboard.doctorServices}
              </p>

              <p className="mt-1 text-sm text-teal-50">
                {isArabic
                  ? "إدارة خدمات العيادة"
                  : "Manage clinic services"}
              </p>
            </button>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isArabic
                  ? "أحدث المواعيد"
                  : "Recent Appointments"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "مواعيدك القادمة"
                  : "Your upcoming appointments"}
              </p>
            </div>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/appointments";
              }}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              {isArabic
                ? "عرض الكل"
                : "View All"}
            </button>
          </div>

          {recentAppointments.length ===
          0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا توجد مواعيد حتى الآن."
                  : "No appointments yet."}
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    "/doctor/appointments";
                }}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
              >
                {isArabic
                  ? "إضافة موعد"
                  : "Add Appointment"}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th
                      className={`px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {isArabic
                        ? "المريض"
                        : "Patient"}
                    </th>

                    <th
                      className={`px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {isArabic
                        ? "التاريخ"
                        : "Date"}
                    </th>

                    <th
                      className={`px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {isArabic
                        ? "الوقت"
                        : "Time"}
                    </th>

                    <th
                      className={`px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {isArabic
                        ? "الحالة"
                        : "Status"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentAppointments.map(
                    (appointment) => (
                      <tr
                        key={
                          appointment.id
                        }
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                          {appointment.patients
                            ?.name ||
                            (isArabic
                              ? "مريض غير معروف"
                              : "Unknown patient")}
                        </td>

                        <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                          {
                            appointment.appointment_date
                          }
                        </td>

                        <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                          {
                            appointment.appointment_time
                          }
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                            {
                              appointment.status
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.clinicProfile}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "قم بتحديث اسم العيادة والعنوان والهاتف وواتساب وساعات العمل."
                : "Update your clinic name, address, phone, WhatsApp and working hours."}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/clinic-profile";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "إدارة العيادة"
                : "Manage Clinic"}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.appointments}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "عرض وإدارة مواعيد المرضى القادمة."
                : "View and manage your upcoming patient appointments."}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/appointments";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "عرض المواعيد"
                : "View Appointments"}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.patients}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "إدارة معلومات المرضى وسجلاتهم."
                : "Manage your patient information and records."}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/patients";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "عرض المرضى"
                : "View Patients"}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.payments}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "متابعة مدفوعات العلاج والأرصدة المتبقية للمرضى."
                : "Track treatment payments and remaining patient balances."}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/payments";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "عرض المدفوعات"
                : "View Payments"}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.doctorServices}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "إضافة وإدارة خدمات الأسنان التي تقدمها العيادة."
                : "Add and manage the dental services offered by your clinic."}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/services";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "إدارة الخدمات"
                : "Manage Services"}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.reviews}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "شاهد آراء المرضى حول عيادتك."
                : "See what patients are saying about your clinic."}
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/reviews";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "عرض التقييمات"
                : "View Reviews"}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t.dashboard.subscription}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "الخطة الحالية: "
                : "Current plan: "}
              <span className="font-semibold text-teal-600 dark:text-teal-400">
                {subscriptionPlan}
              </span>
            </p>

            <button
              onClick={() => {
                window.location.href =
                  "/doctor/subscription";
              }}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {isArabic
                ? "إدارة الخطة"
                : "Manage Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

