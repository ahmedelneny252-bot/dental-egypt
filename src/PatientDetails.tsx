import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Calendar,
  Facebook,
  Building2,
  HeartPulse,
  Users,
  Cpu,
  ImageOff,
  User,
} from "lucide-react";
import { supabase } from "./supabase";
import { translations, type Language } from "./i18n";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  facebook: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
  // Optional columns (the sections show only when they exist)
  doctor_name?: string | null;
  doctor_specialty?: string | null;
  doctor_phone?: string | null;
  doctor_photo_url?: string | null;
  doctor_rating?: number | null;
  doctor_reviews_count?: number | null;
  doctor_slug?: string | null;
  working_days?: number[] | null; // 0 = Sunday ... 6 = Saturday
  open_time?: string | null; // "09:00"
  close_time?: string | null; // "21:00"
};

type ClinicCase = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  before_url: string | null;
  after_url: string | null;
};

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5]; // week starts on Saturday

const toMinutes = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + (m || 0);
};

const formatTime = (v: string, ar: boolean) => {
  const [h, m] = v.split(":").map(Number);
  const suffix = h >= 12 ? (ar ? "م" : "PM") : ar ? "ص" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, "0")} ${suffix}`;
};

const ToothLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 10c6-4 11 1 14 1s8-5 14-1c7 5 5 18 1 27-3 7-3 17-8 17s-3-12-7-12-2 12-7 12-5-10-8-17c-4-9-6-22 1-27z" />
  </svg>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    {children}
  </section>
);

const ClinicDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [cases, setCases] = useState<ClinicCase[]>([]);
  const [casesError, setCasesError] = useState("");
  const [showAllCases, setShowAllCases] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const t = translations[language];
  const isArabic = language === "ar";

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");
      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener("dentalcare-language-change", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener("dentalcare-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    const loadClinic = async () => {
      if (!id) {
        setError(isArabic ? "رقم العيادة غير موجود." : "Clinic ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // "*" so the optional doctor / working-hours columns come through when they exist
        const { data, error } = await supabase
          .from("clinics")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Clinic detail error:", error);
          setClinic(null);
          setError(error.message);
          return;
        }

        if (!data) {
          setClinic(null);
          setError(
            isArabic ? "لم يتم العثور على هذه العيادة." : "This clinic could not be found."
          );
          return;
        }

        setClinic(data as Clinic);
      } catch (err) {
        console.error("Unexpected clinic detail error:", err);
        setClinic(null);
        setError(
          isArabic
            ? "حدث خطأ أثناء تحميل بيانات العيادة."
            : "An error occurred while loading the clinic information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClinic();
  }, [id, isArabic]);

  // Treated cases (before / after). A failure here never breaks the page.
  useEffect(() => {
    if (!id) return;

    const loadCases = async () => {
      const { data, error } = await supabase
        .from("clinic_cases")
        .select("id, title, category, description, before_url, after_url")
        .eq("clinic_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Clinic cases error:", error);
        setCasesError(error.message);
        setCases([]);
        return;
      }
      setCases(data ?? []);
    };

    loadCases();
  }, [id]);

  const visibleCases = showAllCases ? cases : cases.slice(0, 4);

  const hours = useMemo(() => {
    if (!clinic) return null;
    const days = clinic.working_days ?? [];
    if (days.length === 0 && !clinic.open_time) return null;

    let isOpen = false;
    if (clinic.open_time && clinic.close_time) {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      isOpen =
        (days.length === 0 || days.includes(now.getDay())) &&
        mins >= toMinutes(clinic.open_time) &&
        mins < toMinutes(clinic.close_time);
    }
    return { days, isOpen };
  }, [clinic]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />
          <p className="text-slate-600 dark:text-slate-300">
            {isArabic ? "جاري تحميل بيانات العيادة..." : "Loading clinic information..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-24 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Star className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-700 dark:text-white">
            {t.clinic.notFound}
          </h2>
          <p className="mb-4 text-slate-500 dark:text-slate-400">
            {t.clinic.notFoundDescription}
          </p>
          {error && (
            <p className="mb-6 break-words rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}
          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {isArabic ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            {t.common.back} {t.common.clinics}
          </Link>
        </div>
      </div>
    );
  }

  const phoneUrl = clinic.phone ? `tel:${clinic.phone}` : "";
  const whatsappNumber = clinic.whatsapp ? clinic.whatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";
  const hasCoords = clinic.latitude !== null && clinic.longitude !== null;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${clinic.latitude},${clinic.longitude}`
    : clinic.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`
      : "";

  const googleMapsEmbedUrl = hasCoords
    ? `https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}&output=embed`
    : clinic.address
      ? `https://www.google.com/maps?q=${encodeURIComponent(clinic.address)}&output=embed`
      : "";

  let facebookHandle = clinic.facebook ?? "";
  try {
    if (clinic.facebook) {
      facebookHandle = new URL(clinic.facebook).pathname.replace(/\/$/, "") || clinic.facebook;
    }
  } catch {
    /* keep raw value */
  }

  const features = [
    { icon: Building2, label: isArabic ? "بيئة مريحة\nونظيفة" : "Clean & comfortable\nenvironment" },
    { icon: HeartPulse, label: isArabic ? "رعاية شاملة\nلكافة الأعمار" : "Complete care\nfor all ages" },
    { icon: Users, label: isArabic ? "فريق طبي\nمتخصص" : "Specialist\nmedical team" },
    { icon: Cpu, label: isArabic ? "أحدث الأجهزة\nوالتقنيات" : "Latest equipment\nand technology" },
  ];

  const row =
    "flex items-center gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800";
  const rowIcon = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";

  const contacts = [
    {
      key: "clinic",
      label: isArabic ? "رقم العيادة" : "Clinic phone",
      value: clinic.phone,
      href: phoneUrl,
      icon: Phone,
      iconCls: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      ltr: true,
    },
    {
      key: "whatsapp",
      label: isArabic ? "رقم الواتس آب" : "WhatsApp",
      value: clinic.whatsapp,
      href: whatsappUrl,
      icon: MessageCircle,
      iconCls: "bg-green-500 text-white",
      ltr: true,
    },
    {
      key: "facebook",
      label: isArabic ? "صفحة الفيسبوك" : "Facebook page",
      value: clinic.facebook ? facebookHandle : null,
      href: clinic.facebook ?? "",
      icon: Facebook,
      iconCls: "bg-blue-600 text-white",
      ltr: true,
    },
    {
      key: "doctor",
      label: isArabic ? "رقم الدكتور" : "Doctor phone",
      value: clinic.doctor_phone,
      href: clinic.doctor_phone ? `tel:${clinic.doctor_phone}` : "",
      icon: Phone,
      iconCls: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      ltr: true,
    },
    {
      key: "location",
      label: isArabic ? "الموقع" : "Location",
      value: clinic.address,
      href: googleMapsUrl,
      icon: MapPin,
      iconCls: "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400",
      ltr: false,
    },
  ];

  const showDoctor = !!clinic.doctor_name;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen bg-[#f4f8fd] pt-24 dark:bg-slate-950 ${isArabic ? "text-right" : "text-left"}`}
    >
      <div className="mx-auto max-w-[1180px] px-4 pb-12 sm:px-6">
        {/* Hero banner */}
        <section
          dir="ltr"
          className="flex h-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 md:h-[340px]"
        >
          <div className="flex w-2/5 min-w-0 shrink-0 flex-col items-center justify-center gap-1 px-3 text-center md:px-8">
            <ToothLogo className="mb-1 h-10 w-10 text-blue-600 dark:text-blue-300 md:h-16 md:w-16" />
            <h1 className="break-words text-xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl">
              {clinic.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 md:text-2xl">Dental Clinic</p>
          </div>
          <div className="relative flex-1 bg-white">
            {clinic.logo_url ? (
              <img
                src={clinic.logo_url}
                alt={clinic.name}
                className="absolute inset-0 h-full w-full object-contain p-2"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-200 to-sky-100">
                <ToothLogo className="h-24 w-24 text-white/90" />
              </div>
            )}
          </div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div className="min-w-0 space-y-5">
            {/* About */}
            <Card className="p-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.clinic.aboutClinic}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {clinic.description || t.clinic.noDescription}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="whitespace-pre-line text-xs text-slate-600 dark:text-slate-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cases gallery (replaces clinic photos) */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isArabic ? "صور الحالات" : "Case Photos"}
                </h2>
                {cases.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCases((v) => !v)}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {showAllCases
                      ? isArabic ? "عرض أقل" : "Show less"
                      : isArabic ? "عرض الكل" : "View all"}
                  </button>
                )}
              </div>

              {casesError ? (
                <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {isArabic ? "تعذر تحميل الحالات: " : "Could not load cases: "}
                  {casesError}
                </p>
              ) : cases.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {isArabic ? "لم تتم إضافة حالات بعد." : "No cases have been added yet."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {visibleCases.map((c) => (
                    <figure
                      key={c.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
                    >
                      <div dir="ltr" className="grid h-full grid-cols-2 gap-px bg-white dark:bg-slate-900">
                        {[
                          { src: c.before_url, label: isArabic ? "قبل" : "Before" },
                          { src: c.after_url, label: isArabic ? "بعد" : "After" },
                        ].map(({ src, label }) => (
                          <div key={label} className="relative h-full">
                            {src ? (
                              <img
                                src={src}
                                alt={`${c.title} - ${label}`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
                                <ImageOff className="h-6 w-6" />
                              </div>
                            )}
                            <span className="absolute start-1 top-1 rounded bg-slate-900/70 px-1.5 text-[10px] text-white">
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-900/80 to-transparent px-2 pb-1.5 pt-5 text-xs font-medium text-white">
                        {c.title}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </Card>

            {/* Working hours + Doctor */}
            {(hours || showDoctor) && (
              <div className={`grid gap-5 ${hours && showDoctor ? "md:grid-cols-[1.35fr_1fr]" : ""}`}>
                {hours && (
                  <Card>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      {isArabic ? "مواعيد العمل" : "Working Hours"}
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      {DAY_ORDER.filter((d) => hours.days.length === 0 || hours.days.includes(d)).map((d) => (
                        <span
                          key={d}
                          className="rounded-full border border-slate-200 px-3 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          {isArabic ? DAYS_AR[d] : DAYS_EN[d]}
                        </span>
                      ))}
                    </div>

                    {clinic.open_time && clinic.close_time && (
                      <p className="mt-4 text-slate-700 dark:text-slate-200">
                        {formatTime(clinic.open_time, isArabic)} - {formatTime(clinic.close_time, isArabic)}
                      </p>
                    )}

                    {clinic.open_time && clinic.close_time && (
                      <span
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          hours.isOpen
                            ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${hours.isOpen ? "bg-green-500" : "bg-red-500"}`} />
                        {hours.isOpen
                          ? isArabic ? "العيادة مفتوحة الآن" : "Open now"
                          : isArabic ? "العيادة مغلقة الآن" : "Closed now"}
                      </span>
                    )}
                  </Card>
                )}

                {showDoctor && (
                  <Card>
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 dark:bg-slate-800">
                        {clinic.doctor_photo_url ? (
                          <img src={clinic.doctor_photo_url} alt={clinic.doctor_name ?? ""} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-9 w-9 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white">{clinic.doctor_name}</p>
                        {clinic.doctor_specialty && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{clinic.doctor_specialty}</p>
                        )}
                        {clinic.doctor_rating != null && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-slate-700 dark:text-slate-200">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {clinic.doctor_rating}
                            {clinic.doctor_reviews_count != null && (
                              <span className="text-xs text-slate-400">
                                ({clinic.doctor_reviews_count} {isArabic ? "تقييم" : "reviews"})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {clinic.doctor_slug && (
                      <Link
                        to={`/doctors/${clinic.doctor_slug}`}
                        className="mt-4 block rounded-lg bg-blue-50 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
                      >
                        {isArabic ? "عرض الملف الشخصي" : "View profile"}
                      </Link>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            <Card>
              <Link
                to={`/clinics/${clinic.id}/book`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                <Calendar className="h-5 w-5" />
                {t.common.bookAppointmentNow}
              </Link>

              <div className="mt-3">
                {contacts.filter((c) => c.value).map((c) => {
                  const Icon = c.icon;
                  const inner = (
                    <>
                      <span className={`${rowIcon} ${c.iconCls}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {c.label}
                        </p>
                        {c.value ? (
                          <p
                            dir={c.ltr ? "ltr" : undefined}
                            className={`break-words text-sm text-slate-600 dark:text-slate-300 ${
                              c.ltr && isArabic ? "text-right" : ""
                            }`}
                          >
                            {c.value}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 dark:text-slate-500">
                            {isArabic ? "غير متوفر" : "Not available"}
                          </p>
                        )}
                      </div>
                    </>
                  );

                  return c.value && c.href ? (
                    <a
                      key={c.key}
                      href={c.href}
                      target={c.key === "clinic" || c.key === "doctor" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className={row}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={c.key} className={row}>
                      {inner}
                    </div>
                  );
                })}
              </div>

              {googleMapsEmbedUrl && (
                <div className="relative mt-3 overflow-hidden rounded-xl">
                  <iframe
                    src={googleMapsEmbedUrl}
                    title={isArabic ? "موقع العيادة" : "Clinic location"}
                    className="h-36 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow">
                    {isArabic ? "موقع العيادة" : "Clinic location"}
                  </span>
                </div>
              )}

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500 px-5 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  <MapPin className="h-4 w-4" />
                  {isArabic ? "عرض على خرائط جوجل" : "Open in Google Maps"}
                </a>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetail;




