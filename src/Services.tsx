import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [clinicId, setClinicId] = useState("");

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(
      "dentalcare-language"
    );

    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";
  const t = translations[language];

  // ============================================
  // Language change listener
  // ============================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem(
        "dentalcare-language"
      );

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
  // Get clinic
  // ============================================

  const getClinic = async () => {
    setLoading(true);
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

        setLoading(false);
        return;
      }

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

      if (profileError || !profile?.clinic_id) {
        console.error(profileError);

        setError(
          isArabic
            ? "تعذر تحميل معلومات العيادة."
            : "Could not load clinic information."
        );

        setLoading(false);
        return;
      }

      setClinicId(profile.clinic_id);

      await loadServices(profile.clinic_id);
    } catch (error) {
      console.error(error);

      setError(
        isArabic
          ? "حدث خطأ أثناء تحميل بيانات العيادة."
          : "An error occurred while loading clinic data."
      );

      setLoading(false);
    }
  };

  // ============================================
  // Load services
  // ============================================

  const loadServices = async (
    clinicIdValue: string
  ) => {
    const {
      data,
      error: servicesError,
    } = await supabase
      .from("services")
      .select(
        "id, name, description, price, duration"
      )
      .eq("clinic_id", clinicIdValue)
      .order("created_at", {
        ascending: false,
      });

    if (servicesError) {
      console.error(servicesError);

      setError(
        isArabic
          ? "تعذر تحميل الخدمات."
          : "Could not load services."
      );

      setLoading(false);
      return;
    }

    setServices(data || []);
    setLoading(false);
  };

  // ============================================
  // Initial load
  // ============================================

  useEffect(() => {
    getClinic();
  }, []);

  // ============================================
  // Clear messages when language changes
  // ============================================

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [language]);

  // ============================================
  // Add service
  // ============================================

  const handleAddService = async (
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

    if (!name.trim()) {
      setError(
        isArabic
          ? "من فضلك أدخل اسم الخدمة."
          : "Please enter the service name."
      );

      return;
    }

    if (!price) {
      setError(
        isArabic
          ? "من فضلك أدخل سعر الخدمة."
          : "Please enter the service price."
      );

      return;
    }

    const {
      error: insertError,
    } = await supabase
      .from("services")
      .insert({
        clinic_id: clinicId,
        name: name.trim(),
        description:
          description.trim() || null,
        price: Number(price),
        duration: duration
          ? Number(duration)
          : null,
      });

    if (insertError) {
      console.error(insertError);

      setError(
        isArabic
          ? `حدث خطأ أثناء إضافة الخدمة: ${insertError.message}`
          : `Error adding service: ${insertError.message}`
      );

      return;
    }

    setSuccess(
      isArabic
        ? "تمت إضافة الخدمة بنجاح!"
        : "Service added successfully!"
    );

    setName("");
    setDescription("");
    setPrice("");
    setDuration("");

    setShowForm(false);

    await loadServices(clinicId);
  };

  // ============================================
  // Delete service
  // ============================================

  const handleDeleteService = async (
    serviceId: string
  ) => {
    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد أنك تريد حذف هذه الخدمة؟"
        : "Are you sure you want to delete this service?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const {
      error: deleteError,
    } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("clinic_id", clinicId);

    if (deleteError) {
      console.error(deleteError);

      setError(
        isArabic
          ? `حدث خطأ أثناء حذف الخدمة: ${deleteError.message}`
          : `Error deleting service: ${deleteError.message}`
      );

      return;
    }

    setSuccess(
      isArabic
        ? "تم حذف الخدمة بنجاح!"
        : "Service deleted successfully!"
    );

    await loadServices(clinicId);
  };

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 pb-12 pt-32"
      >
        <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-10 shadow-lg">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {t.common.loading}
            </p>
          </div>
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
      className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 pb-12 pt-32"
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* ============================================
            Header
        ============================================ */}

        <div className="mb-8 rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {t.dashboard.doctorServices}
              </h1>

              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                {isArabic
                  ? "أضف خدمات عيادتك وقم بإدارتها بسهولة."
                  : "Add and manage your clinic services easily."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setError("");
                setSuccess("");
              }}
              className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-teal-700"
            >
              +{" "}
              {isArabic
                ? "إضافة خدمة"
                : "Add Service"}
            </button>

          </div>
        </div>

        {/* ============================================
            Error
        ============================================ */}

        {error && (
          <div
            className={`mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-5 text-red-700 dark:text-red-300 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {error}
          </div>
        )}

        {/* ============================================
            Success
        ============================================ */}

        {success && (
          <div
            className={`mb-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-5 text-green-700 dark:text-green-300 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {success}
          </div>
        )}

        {/* ============================================
            Add Service Form
        ============================================ */}

        {showForm && (
          <div className="mb-8 rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-md">

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isArabic
                    ? "إضافة خدمة جديدة"
                    : "Add New Service"}
                </h2>

                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {isArabic
                    ? "إضافة الخدمات اختيارية. يمكنك تخطي هذا القسم."
                    : "Adding services is optional. You can skip this section."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2 text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.common.cancel}
              </button>

            </div>

            <form
              onSubmit={handleAddService}
              className="grid gap-6 md:grid-cols-2"
            >

              {/* Service Name */}

              <div>
                <label className="mb-2 block font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "اسم الخدمة"
                    : "Service Name"}
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder={
                    isArabic
                      ? "مثال: تنظيف الأسنان"
                      : "e.g. Dental Cleaning"
                  }
                  required
                  dir={isArabic ? "rtl" : "ltr"}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Price */}

              <div>
                <label className="mb-2 block font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "السعر"
                    : "Price"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  placeholder={
                    isArabic
                      ? "مثال: 500"
                      : "e.g. 500"
                  }
                  required
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Duration */}

              <div>
                <label className="mb-2 block font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "المدة (بالدقائق)"
                    : "Duration (minutes)"}
                </label>

                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
                  }
                  placeholder={
                    isArabic
                      ? "مثال: 30"
                      : "e.g. 30"
                  }
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block font-semibold text-slate-700 dark:text-slate-200">
                  {isArabic
                    ? "الوصف"
                    : "Description"}
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder={
                    isArabic
                      ? "وصف مختصر للخدمة"
                      : "Short description"
                  }
                  dir={isArabic ? "rtl" : "ltr"}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Submit */}

              <div className="md:col-span-2">

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-teal-700"
                >
                  {isArabic
                    ? "إضافة الخدمة"
                    : "Add Service"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* ============================================
            Services List
        ============================================ */}

        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-md">

          <div
            className={`border-b border-slate-200 dark:border-slate-800 p-8 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "خدماتك"
                : "Your Services"}
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "الخدمات اختيارية. يمكنك ترك هذا القسم فارغًا."
                : "Services are optional. You can leave this section empty."}
            </p>
          </div>

          {/* ============================================
              No Services
          ============================================ */}

          {services.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <span className="text-2xl">
                  🦷
                </span>
              </div>

              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "لم تتم إضافة خدمات بعد"
                  : "No services added yet"}
              </p>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "أضف الخدمات فقط إذا كنت بحاجة إليها."
                  : "Add services only if you need them."}
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setError("");
                  setSuccess("");
                }}
                className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
              >
                +{" "}
                {isArabic
                  ? "إضافة أول خدمة"
                  : "Add Your First Service"}
              </button>

            </div>
          ) : (

            /* ============================================
               Services Table
            ============================================ */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px]">

                <thead className="bg-slate-50 dark:bg-slate-800/60">

                  <tr>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الخدمة"
                        : "Service"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الوصف"
                        : "Description"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "السعر"
                        : "Price"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "المدة"
                        : "Duration"}
                    </th>

                    <th
                      className={`px-6 py-4 ${
                        isArabic
                          ? "text-right"
                          : "text-left"
                      } text-sm font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      {isArabic
                        ? "الإجراء"
                        : "Action"}
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {services.map((service) => (

                    <tr
                      key={service.id}
                      className="border-t border-slate-100 dark:border-slate-800 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >

                      <td
                        className={`px-6 py-4 font-semibold text-slate-900 dark:text-white ${
                          isArabic
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {service.name}
                      </td>

                      <td
                        className={`px-6 py-4 text-slate-600 dark:text-slate-300 ${
                          isArabic
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {service.description || "-"}
                      </td>

                      <td
                        className={`px-6 py-4 font-medium text-slate-900 dark:text-white ${
                          isArabic
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {service.price}{" "}
                        {isArabic
                          ? "جنيه"
                          : "EGP"}
                      </td>

                      <td
                        className={`px-6 py-4 text-slate-600 dark:text-slate-300 ${
                          isArabic
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {service.duration
                          ? `${service.duration} ${
                              isArabic
                                ? "دقيقة"
                                : "min"
                            }`
                          : "-"}
                      </td>

                      <td
                        className={`px-6 py-4 ${
                          isArabic
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteService(
                              service.id
                            )
                          }
                          className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-950/60"
                        >
                          {isArabic
                            ? "حذف"
                            : "Delete"}
                        </button>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Services;