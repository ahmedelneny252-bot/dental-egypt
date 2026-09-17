import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
};

const FREE_PATIENT_LIMIT = 20;

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [clinicId, setClinicId] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] =
    useState("Free");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage =
      localStorage.getItem("dentalcare-language");

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // Listen for language changes
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

  // Get doctor's clinic and subscription
  const getClinic = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/doctor/login";
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

    setClinicId(profile.clinic_id);

    // Get subscription plan
    const {
      data: clinic,
      error: clinicError,
    } = await supabase
      .from("clinics")
      .select("subscription_plan")
      .eq("id", profile.clinic_id)
      .single();

    if (clinicError) {
      console.error(clinicError);

      setError(
        isArabic
          ? "تعذر تحميل معلومات الاشتراك."
          : "Could not load subscription information."
      );

      setLoading(false);
      return;
    }

    setSubscriptionPlan(
      clinic?.subscription_plan || "Free"
    );

    await loadPatients(profile.clinic_id);
  };

  // Load patients
  const loadPatients = async (
    clinicIdValue: string
  ) => {
    const {
      data,
      error: patientsError,
    } = await supabase
      .from("patients")
      .select(
        "id, name, phone, age, gender, address, medical_notes, created_at"
      )
      .eq("clinic_id", clinicIdValue)
      .order("created_at", {
        ascending: false,
      });

    if (patientsError) {
      console.error(patientsError);

      setError(patientsError.message);
      setLoading(false);
      return;
    }

    setPatients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    getClinic();
  }, []);

  // Check if the clinic reached its patient limit
  const hasReachedPatientLimit =
    subscriptionPlan === "Free" &&
    patients.length >= FREE_PATIENT_LIMIT;

  // Add patient
  const handleAddPatient = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!clinicId) {
      setError(
        isArabic
          ? "لم يتم العثور على العيادة."
          : "Clinic not found."
      );
      return;
    }

    // Free plan limit
    if (
      subscriptionPlan === "Free" &&
      patients.length >= FREE_PATIENT_LIMIT
    ) {
      setError(
        isArabic
          ? "الباقة المجانية تسمح بحد أقصى 20 مريضًا. يرجى ترقية اشتراكك لإضافة المزيد من المرضى."
          : "Your Free plan allows up to 20 patients. Please upgrade your subscription to add more patients."
      );

      setShowForm(false);

      return;
    }

    const {
      error: insertError,
    } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinicId,
        name,
        phone: phone || null,
        age: age ? Number(age) : null,
        gender: gender || null,
        address: address || null,
        medical_notes:
          medicalNotes || null,
      });

    if (insertError) {
      console.error(insertError);

      setError(insertError.message);
      return;
    }

    setSuccess(
      isArabic
        ? "تمت إضافة المريض بنجاح!"
        : "Patient added successfully!"
    );

    // Clear form
    setName("");
    setPhone("");
    setAge("");
    setGender("");
    setAddress("");
    setMedicalNotes("");

    setShowForm(false);

    // Reload patients
    await loadPatients(clinicId);
  };

  const getGenderLabel = (
    patientGender: string | null
  ) => {
    if (!patientGender) {
      return "-";
    }

    if (patientGender === "Male") {
      return isArabic ? "ذكر" : "Male";
    }

    if (patientGender === "Female") {
      return isArabic ? "أنثى" : "Female";
    }

    return patientGender;
  };

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-28 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل المرضى..."
            : "Loading patients..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-6 pb-12 pt-32 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic ? "المرضى" : "Patients"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "إدارة مرضى عيادتك."
                : "Manage your clinic patients."}
            </p>

            {/* Patient Limit */}
            <div className="mt-3">

              {subscriptionPlan === "Free" ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">

                  {isArabic
                    ? "الباقة المجانية: "
                    : "Free plan: "}

                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {patients.length}/
                    {FREE_PATIENT_LIMIT}
                  </span>

                  {isArabic
                    ? " مريضًا"
                    : " patients"}

                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">

                  {isArabic
                    ? `${subscriptionPlan} - الباقة: `
                    : `${subscriptionPlan} plan: `}

                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {isArabic
                      ? "عدد غير محدود من المرضى"
                      : "Unlimited patients"}
                  </span>

                </p>
              )}

            </div>

          </div>

          <button
            onClick={() => {
              if (hasReachedPatientLimit) {
                setError(
                  isArabic
                    ? "الباقة المجانية تسمح بحد أقصى 20 مريضًا. يرجى ترقية اشتراكك لإضافة المزيد من المرضى."
                    : "Your Free plan allows up to 20 patients. Please upgrade your subscription to add more patients."
                );

                setSuccess("");

                return;
              }

              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className={`rounded-xl px-5 py-3 font-semibold text-white transition ${
              hasReachedPatientLimit
                ? "bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {showForm
              ? isArabic
                ? "إلغاء"
                : "Cancel"
              : isArabic
                ? "+ إضافة مريض"
                : "+ Add Patient"}
          </button>

        </div>

        {/* Limit Warning */}
        {hasReachedPatientLimit && (
          <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-950/40">

            <p className="font-semibold text-orange-800 dark:text-orange-300">
              {isArabic
                ? "تم الوصول إلى الحد الأقصى للباقة المجانية"
                : "Free plan limit reached"}
            </p>

            <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
              {isArabic
                ? "لقد وصلت إلى الحد الأقصى وهو 20 مريضًا في الباقة المجانية."
                : "You have reached the maximum of 20 patients on the Free plan."}
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/doctor/subscription";
              }}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-700"
            >
              {isArabic
                ? "ترقية الاشتراك"
                : "Upgrade Subscription"}
            </button>

          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-600 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Add Patient Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">
              {isArabic
                ? "إضافة مريض جديد"
                : "Add New Patient"}
            </h2>

            <form
              onSubmit={handleAddPatient}
              className="grid gap-4 md:grid-cols-2"
            >

              {/* Name */}
              <input
                type="text"
                placeholder={
                  isArabic
                    ? "اسم المريض"
                    : "Patient Name"
                }
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              {/* Phone */}
              <input
                type="tel"
                placeholder={
                  isArabic
                    ? "رقم الهاتف"
                    : "Phone"
                }
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                dir="ltr"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              {/* Age */}
              <input
                type="number"
                placeholder={
                  isArabic ? "العمر" : "Age"
                }
                min="0"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              {/* Gender */}
              <select
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">
                  {isArabic
                    ? "اختر النوع"
                    : "Select Gender"}
                </option>

                <option value="Male">
                  {isArabic ? "ذكر" : "Male"}
                </option>

                <option value="Female">
                  {isArabic ? "أنثى" : "Female"}
                </option>
              </select>

              {/* Address */}
              <input
                type="text"
                placeholder={
                  isArabic
                    ? "العنوان"
                    : "Address"
                }
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              {/* Medical Notes */}
              <textarea
                placeholder={
                  isArabic
                    ? "الملاحظات الطبية"
                    : "Medical Notes"
                }
                value={medicalNotes}
                onChange={(e) =>
                  setMedicalNotes(
                    e.target.value
                  )
                }
                className="min-h-32 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 md:col-span-2"
              />

              {/* Submit */}
              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 md:col-span-2"
              >
                {isArabic
                  ? "إضافة المريض"
                  : "Add Patient"}
              </button>

            </form>

          </div>
        )}

        {/* Patients List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 p-6 dark:border-slate-700">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isArabic
                  ? "قائمة المرضى"
                  : "Patient List"}
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {patients.length}{" "}
                {isArabic
                  ? patients.length === 1
                    ? "مريض"
                    : "مرضى"
                  : patients.length === 1
                    ? "patient"
                    : "patients"}
              </p>

            </div>

          </div>

          {patients.length === 0 ? (

            <div className="p-10 text-center">

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "لا يوجد مرضى حتى الآن."
                  : "No patients yet."}
              </p>

              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {isArabic
                  ? 'اضغط على "إضافة مريض" لإضافة أول مريض.'
                  : 'Click "Add Patient" to add your first patient.'}
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 dark:bg-slate-800">

                  <tr>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الاسم"
                        : "Name"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الهاتف"
                        : "Phone"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "العمر"
                        : "Age"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "النوع"
                        : "Gender"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "العنوان"
                        : "Address"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الملاحظات الطبية"
                        : "Medical Notes"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {patients.map(
                    (patient) => (

                      <tr
                        key={patient.id}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >

                        {/* Patient Name */}
                        <td className="px-6 py-4">

                          <Link
                            to={`/doctor/patients/${patient.id}`}
                            className="font-semibold text-teal-600 transition hover:text-teal-700 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            {patient.name}
                          </Link>

                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {patient.phone || "-"}
                        </td>

                        {/* Age */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {patient.age !== null
                            ? patient.age
                            : "-"}
                        </td>

                        {/* Gender */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {getGenderLabel(
                            patient.gender
                          )}
                        </td>

                        {/* Address */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {patient.address || "-"}
                        </td>

                        {/* Medical Notes */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {patient.medical_notes ||
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

      </div>
    </div>
  );
};

export default Patients;




