import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Review = {
  id: string;
  patient_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // Language
  // =========================

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage =
      localStorage.getItem("dentalcare-language");

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
    const getReviews = async () => {
      setLoading(true);
      setError("");

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
        console.error(
          "Profile error:",
          profileError
        );

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

      const {
        data,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select(`
          id,
          patient_name,
          rating,
          comment,
          created_at
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("created_at", {
          ascending: false,
        });

      if (reviewsError) {
        console.error(
          "Reviews error:",
          reviewsError
        );

        setError(reviewsError.message);
      } else {
        setReviews(data || []);
      }

      setLoading(false);
    };

    getReviews();
  }, [language]);

  const getStars = (rating: number) => {
    return "★".repeat(
      Math.max(0, Math.min(5, rating))
    );
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"
      >
        <p className="text-slate-600 dark:text-slate-300">
          {isArabic
            ? "جاري تحميل التقييمات..."
            : "Loading reviews..."}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-32"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "التقييمات"
                : "Reviews"}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {isArabic
                ? "اطّلع على آراء المرضى حول عيادتك."
                : "See what patients are saying about your clinic."}
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href =
                "/doctor/dashboard";
            }}
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {isArabic
              ? "العودة إلى لوحة التحكم"
              : "Back to Dashboard"}
          </button>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Statistics */}

        <div className="mb-8 grid gap-6 md:grid-cols-2">

          {/* Total Reviews */}

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "إجمالي التقييمات"
                : "Total Reviews"}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {reviews.length}
            </p>

          </div>

          {/* Average Rating */}

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? "متوسط التقييم"
                : "Average Rating"}
            </p>

            <div className="mt-2 flex items-center gap-3">

              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {averageRating}
              </span>

              <span className="text-xl text-yellow-500">
                ★★★★★
              </span>

            </div>

          </div>

        </div>

        {/* Reviews */}

        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isArabic
                ? "تقييمات المرضى"
                : "Patient Reviews"}
            </h2>

          </div>

          {reviews.length === 0 ? (

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-10 text-center">

              <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "لا توجد تقييمات حتى الآن."
                  : "No reviews yet."}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "ستظهر تقييمات المرضى هنا عند إرسالها."
                  : "Patient reviews will appear here when they are submitted."}
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {reviews.map((review) => (

                <div
                  key={review.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>

                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {review.patient_name}
                      </h3>

                      <div className="mt-1 text-yellow-500">
                        {getStars(review.rating)}
                      </div>

                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(
                        review.created_at
                      ).toLocaleDateString(
                        isArabic
                          ? "ar-EG"
                          : "en-US"
                      )}
                    </p>

                  </div>

                  <p className="mt-4 text-slate-600 dark:text-slate-300">
                    {review.comment}
                  </p>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    </div>
  );
};

export default Reviews;


