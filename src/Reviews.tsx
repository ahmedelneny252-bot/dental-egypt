import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setError("Could not load clinic information.");
        setLoading(false);
        return;
      }

      if (!profile?.clinic_id) {
        setError("No clinic is connected to this doctor.");
        setLoading(false);
        return;
      }

      const { data, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          patient_name,
          rating,
          comment,
          created_at
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Reviews error:", reviewsError);
        setError(reviewsError.message);
      } else {
        setReviews(data || []);
      }

      setLoading(false);
    };

    getReviews();
  }, []);

  const getStars = (rating: number) => {
    return "★".repeat(Math.max(0, Math.min(5, rating)));
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading reviews...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-32">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Reviews
            </h1>

            <p className="mt-2 text-slate-600">
              See what patients are saying about your clinic.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/doctor/dashboard";
            }}
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-900"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Reviews
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {reviews.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Average Rating
            </p>

            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {averageRating}
              </span>

              <span className="text-xl text-yellow-500">
                ★★★★★
              </span>
            </div>
          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Patient Reviews
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-10 text-center">
              <p className="text-lg font-medium text-slate-700">
                No reviews yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Patient reviews will appear here when they are submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-200 p-5"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {review.patient_name}
                      </h3>

                      <div className="mt-1 text-yellow-500">
                        {getStars(review.rating)}
                      </div>
                    </div>

                    <p className="text-sm text-slate-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>

                  </div>

                  <p className="mt-4 text-slate-600">
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


