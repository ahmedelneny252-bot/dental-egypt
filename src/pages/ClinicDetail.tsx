import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { supabase } from "../supabase";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: number | null;
};

type Review = {
  id: string;
  patient_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const ClinicDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClinic = async () => {
      if (!id) {
        setError("Clinic not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: clinicData, error: clinicError } =
        await supabase
          .from("clinics")
          .select(`
            id,
            name,
            logo_url,
            phone,
            whatsapp,
            address,
            description,
            slug
          `)
          .eq("id", id)
          .single();

      if (clinicError) {
        console.error("Clinic error:", clinicError);
        setError("Clinic not found.");
        setLoading(false);
        return;
      }

      setClinic(clinicData);

      const { data: servicesData, error: servicesError } =
        await supabase
          .from("services")
          .select(`
            id,
            name,
            description,
            price,
            duration
          `)
          .eq("clinic_id", id)
          .order("name", { ascending: true });

      if (servicesError) {
        console.error("Services error:", servicesError);
      } else {
        setServices(servicesData || []);
      }

      const { data: reviewsData, error: reviewsError } =
        await supabase
          .from("reviews")
          .select(`
            id,
            patient_name,
            rating,
            comment,
            created_at
          `)
          .eq("clinic_id", id)
          .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Reviews error:", reviewsError);
      } else {
        setReviews(reviewsData || []);
      }

      setLoading(false);
    };

    loadClinic();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-24">
        <p className="text-slate-600">
          Loading clinic...
        </p>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 pt-24">
        <div className="text-center">

          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
            <Star className="h-12 w-12 text-slate-400" />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-slate-700">
            العيادة غير موجودة
          </h2>

          <p className="mb-8 text-slate-500">
            عذراً، لم نتمكن من العثور على هذه العيادة.
          </p>

          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
          >
            <ArrowLeft className="h-5 w-5" />
            العودة إلى العيادات
          </Link>

        </div>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  const phoneUrl = clinic.phone
    ? `tel:${clinic.phone}`
    : "#";

  const whatsappUrl = clinic.whatsapp
    ? `https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`
    : "#";

  const googleMapsUrl = clinic.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        clinic.address
      )}`
    : "#";

  return (
    <div className="min-h-screen bg-slate-50 pt-24">

      {/* Back */}
      <div className="mx-auto max-w-7xl px-6 py-5">
        <Link
          to="/clinics"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة إلى العيادات
        </Link>
      </div>

      {/* Clinic Header */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">

          <div className="flex flex-col gap-8 md:flex-row md:items-center">

            {/* Logo */}
            <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">

              {clinic.logo_url ? (
                <img
                  src={clinic.logo_url}
                  alt={clinic.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-teal-600">
                  {clinic.name.charAt(0).toUpperCase()}
                </span>
              )}

            </div>

            {/* Information */}
            <div className="flex-1">

              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                {clinic.name}
              </h1>

              {clinic.address && (
                <div className="mt-4 flex items-center gap-2 text-slate-500">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  <span>{clinic.address}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">

                <span className="text-2xl font-bold text-slate-900">
                  {averageRating}
                </span>

                <span className="text-yellow-500">
                  {"★".repeat(
                    Math.round(Number(averageRating))
                  )}
                </span>

                <span className="text-sm text-slate-500">
                  ({reviews.length} reviews)
                </span>

              </div>

            </div>

            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3">

              {clinic.phone && (
                <a
                  href={phoneUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700"
                >
                  <Phone className="h-5 w-5" />
                  Call
                </a>
              )}

              {clinic.whatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-8 lg:grid-cols-3">

          <div className="space-y-8 lg:col-span-2">

            {/* About */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-2xl font-bold text-slate-900">
                نبذة عن العيادة
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {clinic.description ||
                  "لا يوجد وصف للعيادة حتى الآن."}
              </p>

            </section>

            {/* Services */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="text-2xl font-bold text-slate-900">
                  الخدمات والأسعار
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  الخدمات المتاحة في هذه العيادة
                </p>

              </div>

              {services.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center">
                  <p className="text-slate-500">
                    لا توجد خدمات مضافة حتى الآن.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">

                  {services.map((service) => (

                    <div
                      key={service.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h3 className="font-bold text-slate-900">
                            {service.name}
                          </h3>

                          {service.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {service.description}
                            </p>
                          )}

                        </div>

                        {service.price !== null && (
                          <span className="shrink-0 font-bold text-teal-600">
                            {service.price} EGP
                          </span>
                        )}

                      </div>

                      {service.duration && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="h-4 w-4" />
                          {service.duration} minutes
                        </div>
                      )}

                    </div>

                  ))}

                </div>
              )}

            </section>

            {/* Reviews */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-bold text-slate-900">
                    تقييمات المرضى
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    آراء المرضى عن العيادة
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-2xl font-bold text-slate-900">
                    {averageRating}
                  </p>

                  <p className="text-yellow-500">
                    {"★".repeat(
                      Math.round(Number(averageRating))
                    )}
                  </p>

                </div>

              </div>

              {reviews.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center">

                  <p className="text-slate-500">
                    لا توجد تقييمات حتى الآن.
                  </p>

                </div>
              ) : (
                <div className="space-y-4">

                  {reviews.map((review) => (

                    <div
                      key={review.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h3 className="font-semibold text-slate-900">
                            {review.patient_name}
                          </h3>

                          <div className="mt-1 text-yellow-500">
                            {"★".repeat(
                              Math.max(
                                0,
                                Math.min(5, review.rating)
                              )
                            )}
                          </div>

                        </div>

                        <span className="text-sm text-slate-400">
                          {new Date(
                            review.created_at
                          ).toLocaleDateString()}
                        </span>

                      </div>

                      <p className="mt-4 leading-6 text-slate-600">
                        {review.comment}
                      </p>

                    </div>

                  ))}

                </div>
              )}

            </section>

          </div>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Contact */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                تواصل مع العيادة
              </h2>

              <div className="mt-5 space-y-3">

                {clinic.phone && (
                  <a
                    href={phoneUrl}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100"
                  >
                    <Phone className="h-5 w-5 text-teal-600" />

                    <div>
                      <p className="text-sm text-slate-500">
                        الهاتف
                      </p>

                      <p className="font-medium text-slate-900">
                        {clinic.phone}
                      </p>
                    </div>

                  </a>
                )}

                {clinic.whatsapp && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100"
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />

                    <div>
                      <p className="text-sm text-slate-500">
                        WhatsApp
                      </p>

                      <p className="font-medium text-slate-900">
                        {clinic.whatsapp}
                      </p>
                    </div>

                  </a>
                )}

                {clinic.address && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-slate-100"
                  >
                    <MapPin className="h-5 w-5 text-teal-600" />

                    <div>
                      <p className="text-sm text-slate-500">
                        العنوان
                      </p>

                      <p className="font-medium text-slate-900">
                        {clinic.address}
                      </p>
                    </div>

                  </a>
                )}

              </div>

            </section>

            {/* Booking */}
            <section className="rounded-2xl bg-teal-600 p-6 text-white shadow-sm">

              <h2 className="text-xl font-bold">
                هل تريد حجز موعد؟
              </h2>

              <p className="mt-2 text-sm leading-6 text-teal-50">
                يمكنك حجز موعد مع العيادة بسهولة.
              </p>

              <Link
                to={`/clinics/${id}/book`}
                className="mt-5 block w-full rounded-xl bg-white px-5 py-3 text-center font-semibold text-teal-700 hover:bg-teal-50"
              >
                Book Appointment
              </Link>

            </section>

          </aside>

        </div>

      </main>

    </div>
  );
};

export default ClinicDetail;

