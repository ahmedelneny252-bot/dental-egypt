import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  ChevronDown,
  ShieldCheck,
  Clock,
  Star,
  Headset,
  Stethoscope,
  UserRound,
  Users2,
  CalendarCheck,
  ArrowLeft,
  ArrowRight,
  X,
  Phone,
  MessageCircle,
  Facebook,
} from "lucide-react";
import { supabase } from "../supabase";

type SupabaseClinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  facebook?: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// توحيد النص عشان البحث يكون مرن (همزات، تاء مربوطة، تشكيل، حروف كبيرة/صغيرة)
const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();

// كلمات كل منطقة للفلترة بالعنوان
const regionKeywords: Record<string, string[]> = {
  cairo: ["القاهره", "cairo", "مدينه نصر", "التجمع", "nasr city"],
  giza: ["الجيزه", "giza", "الشيخ زايد", "6 اكتوبر", "اكتوبر", "zayed"],
  alex: ["الاسكندريه", "alexandria", "alex"],
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("");
  const [isArabic, setIsArabic] = useState(
    localStorage.getItem("dentalcare-language") !== "en"
  );

  const [clinics, setClinics] = useState<SupabaseClinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const clinicsSectionRef = useRef<HTMLElement | null>(null);

  // بيانات المودال
  const [selectedClinic, setSelectedClinic] =
    useState<SupabaseClinic | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const updateLanguage = () => {
      setIsArabic(localStorage.getItem("dentalcare-language") !== "en");
    };

    window.addEventListener("dentalcare-language-change", updateLanguage);
    window.addEventListener("storage", updateLanguage);
    updateLanguage();

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        updateLanguage
      );
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = isArabic ? "ar" : "en";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
  }, [isArabic]);

  // منع تمرير الصفحة خلف المودال
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // تحميل كل العيادات (عشان البحث يشتغل على الكل)
  useEffect(() => {
    const loadClinics = async () => {
      setLoadingClinics(true);

      const { data, error } = await supabase
        .from("clinics")
        .select(
          "id, name, logo_url, phone, whatsapp, facebook, address, description, slug, latitude, longitude"
        )
        .order("name", { ascending: true })
        .limit(200);

      if (error) {
        console.error("Error loading clinics:", error);
        setClinics([]);
        setLoadingClinics(false);
        return;
      }

      setClinics(data || []);
      setLoadingClinics(false);
    };

    loadClinics();
  }, []);

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: isArabic ? "عيادات موثوقة" : "Trusted Clinics",
      subtitle: isArabic ? "مراجعات حقيقية" : "Real reviews",
    },
    {
      icon: Clock,
      title: isArabic ? "مواعيد مرنة" : "Flexible Times",
      subtitle: isArabic ? "تناسب جدولك" : "Fits your schedule",
    },
    {
      icon: Star,
      title: isArabic ? "تقييمات المرضى" : "Patient Ratings",
      subtitle: isArabic ? "تساعدك في الاختيار" : "Helps you choose",
    },
    {
      icon: Headset,
      title: isArabic ? "دعم دائم" : "Ongoing Support",
      subtitle: isArabic ? "لإجابة استفساراتك" : "For your questions",
    },
  ];

  // بيانات تجريبية
  const fallbackClinics: SupabaseClinic[] = [
    {
      id: "demo-1",
      name: isArabic ? "عيادة سمايل لطب الأسنان" : "Smile Dental Clinic",
      logo_url: null,
      phone: null,
      whatsapp: null,
      facebook: null,
      address: isArabic ? "الشيخ زايد - الجيزة" : "Sheikh Zayed - Giza",
      description: null,
      slug: null,
      latitude: null,
      longitude: null,
    },
    {
      id: "demo-2",
      name: isArabic ? "عيادة د. أحمد عادل" : "Dr. Ahmed Adel Clinic",
      logo_url: null,
      phone: null,
      whatsapp: null,
      facebook: null,
      address: isArabic ? "مدينة نصر - القاهرة" : "Nasr City - Cairo",
      description: null,
      slug: null,
      latitude: null,
      longitude: null,
    },
    {
      id: "demo-3",
      name: isArabic ? "عيادة د. مروة مصطفى" : "Dr. Marwa Mostafa Clinic",
      logo_url: null,
      phone: null,
      whatsapp: null,
      facebook: null,
      address: isArabic
        ? "التجمع الخامس - القاهرة"
        : "Fifth Settlement - Cairo",
      description: null,
      slug: null,
      latitude: null,
      longitude: null,
    },
    {
      id: "demo-4",
      name: isArabic ? "عيادة إيليت لطب الأسنان" : "Elite Dental Clinic",
      logo_url: null,
      phone: null,
      whatsapp: null,
      facebook: null,
      address: isArabic ? "6 أكتوبر - الجيزة" : "6 October - Giza",
      description: null,
      slug: null,
      latitude: null,
      longitude: null,
    },
  ];

  const allClinics = clinics.length > 0 ? clinics : fallbackClinics;

  const isSearching = searchQuery.trim() !== "" || region !== "";

  // الفلترة اللحظية: كل ما تكتب حرف العيادات بتتفلتر
  const clinicsToShow = useMemo(() => {
    if (!isSearching) return allClinics.slice(0, 4);

    const query = normalizeText(searchQuery);
    const keywords = region ? regionKeywords[region] ?? [] : [];

    return allClinics.filter((clinic) => {
      const name = normalizeText(clinic.name);
      const address = normalizeText(clinic.address);
      const description = normalizeText(clinic.description);

      const matchesQuery =
        query === "" ||
        name.includes(query) ||
        address.includes(query) ||
        description.includes(query);

      const matchesRegion =
        keywords.length === 0 ||
        keywords.some((keyword) => address.includes(normalizeText(keyword)));

      return matchesQuery && matchesRegion;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClinics, searchQuery, region, isSearching]);

  const scrollToClinics = () => {
    clinicsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setRegion("");
  };

  const doctorFeatures = [
    {
      icon: CalendarCheck,
      label: isArabic
        ? "إدارة المواعيد بسهولة"
        : "Easy appointment management",
    },
    {
      icon: Users2,
      label: isArabic
        ? "وصول لعدد أكبر من المرضى"
        : "Reach more patients",
    },
    {
      icon: Headset,
      label: isArabic
        ? "دعم فني مستمر"
        : "Ongoing technical support",
    },
  ];

  // فتح تفاصيل العيادة
  const openClinicModal = (clinic: SupabaseClinic) => {
    setSelectedClinic(clinic);
    setIsModalOpen(true);
  };

  const closeClinicModal = () => {
    setIsModalOpen(false);
    setSelectedClinic(null);
  };

  const whatsappNumber = selectedClinic?.whatsapp
    ? selectedClinic.whatsapp.replace(/\D/g, "")
    : "";

  const googleMapsUrl = selectedClinic
    ? selectedClinic.latitude != null &&
      selectedClinic.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${selectedClinic.latitude},${selectedClinic.longitude}`
      : selectedClinic.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            selectedClinic.address
          )}`
        : ""
    : "";

  // كلاسات الكروت: على الموبايل سكرول أفقي، وعلى الشاشات الأكبر شبكة
  const clinicsListClasses =
    "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="bg-white pt-16 transition-colors duration-300 dark:bg-slate-950 lg:pt-20"
    >
      {/* ============================================
          Hero Section
          ============================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-0 sm:px-6 lg:min-h-[560px] lg:px-8 lg:py-0">
          {/* الصورة: على الموبايل فوق الكلام، وعلى اللابتوب جنب الكلام */}
          <div className="relative -mx-4 mb-8 h-64 sm:-mx-6 sm:h-80 lg:absolute lg:inset-y-0 lg:left-0 lg:mx-0 lg:mb-0 lg:h-auto lg:w-1/2">
            <img
              src="/dental-care.jpg"
              alt={isArabic ? "عيادة الأسنان" : "Dental clinic"}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-slate-950" />

            {/* الجراديانتات الجانبية والعلوية للابتوب بس */}
            <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-white to-transparent dark:from-slate-950 lg:block" />

            <div className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-white to-transparent dark:from-slate-950 lg:block" />

            <div className="absolute inset-x-0 top-0 hidden h-24 bg-gradient-to-b from-blue-50 to-transparent dark:from-slate-900 lg:block" />
          </div>

          {/* الكلام */}
          <div className="relative z-10 lg:ml-auto lg:flex lg:min-h-[560px] lg:w-1/2 lg:flex-col lg:justify-center lg:py-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Stethoscope className="h-4 w-4" />
                {isArabic
                  ? "منصة متكاملة لعيادات الأسنان"
                  : "A complete platform for dental clinics"}
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-tight text-slate-800 dark:text-white md:text-5xl">
                {isArabic ? (
                  <>
                    احجز موعدك بسهولة
                    <br />
                    واكتشف{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                      أفضل عيادات الأسنان
                    </span>
                  </>
                ) : (
                  <>
                    Book your appointment easily
                    <br />
                    and discover the{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                      best dental clinics
                    </span>
                  </>
                )}
              </h1>

              <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-slate-300">
                {isArabic
                  ? "نوفر لك منصة تجمع أفضل أطباء الأسنان والعيادات الموثوقة، مع حجز المواعيد ومراجعات حقيقية من المرضى."
                  : "We bring together the best dentists and trusted clinics, with easy booking and real patient reviews."}
              </p>

              {/* Search bar */}
              <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") scrollToClinics();
                    }}
                    placeholder={
                      isArabic
                        ? "ابحث باسم العيادة أو المنطقة..."
                        : "Search by clinic name or area..."
                    }
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={isArabic ? "مسح" : "Clear"}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 dark:border-slate-800 sm:border-t-0 sm:border-r sm:pr-4 dark:sm:border-slate-800">
                  <MapPin className="h-5 w-5 shrink-0 text-slate-400" />

                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full appearance-none bg-transparent text-sm text-slate-600 focus:outline-none dark:text-slate-300 sm:w-40"
                  >
                    <option value="">
                      {isArabic ? "اختر المنطقة" : "Choose region"}
                    </option>

                    <option value="cairo">
                      {isArabic ? "القاهرة" : "Cairo"}
                    </option>

                    <option value="giza">
                      {isArabic ? "الجيزة" : "Giza"}
                    </option>

                    <option value="alex">
                      {isArabic ? "الإسكندرية" : "Alexandria"}
                    </option>
                  </select>

                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={scrollToClinics}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  {isArabic ? "ابحث عن عيادة" : "Find a Clinic"}
                </button>
              </div>

              {/* Trust points */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {trustPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <point.icon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {point.title}
                      </p>

                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {point.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Featured Clinics / Search Results
          ============================================ */}
      <section
        ref={clinicsSectionRef}
        className="scroll-mt-20 bg-slate-50/60 py-16 transition-colors duration-300 dark:bg-slate-950 md:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {isSearching
                  ? isArabic
                    ? `نتائج البحث (${clinicsToShow.length})`
                    : `Search results (${clinicsToShow.length})`
                  : isArabic
                    ? "أشهر العيادات"
                    : "Popular Clinics"}
              </span>

              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                {isArabic
                  ? "اكتشف عيادات الأسنان القريبة منك"
                  : "Discover dental clinics near you"}
              </h2>

              <p className="mt-2 max-w-xl text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "مجموعة من أفضل العيادات والأطباء الموثوقين في مختلف المناطق."
                  : "A selection of the best trusted clinics and doctors across regions."}
              </p>
            </div>

            {isSearching ? (
              <button
                type="button"
                onClick={clearSearch}
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <X className="h-4 w-4" />
                {isArabic ? "مسح البحث" : "Clear search"}
              </button>
            ) : (
              <Link
                to="/clinics"
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {isArabic ? "عرض الكل" : "View all"}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loadingClinics ? (
            <div className={clinicsListClasses}>
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-64 w-[75%] shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 sm:w-auto"
                />
              ))}
            </div>
          ) : clinicsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-slate-800">
                <Search className="h-6 w-6" />
              </div>

              <p className="mb-1 text-base font-bold text-slate-700 dark:text-slate-200">
                {isArabic
                  ? "مفيش عيادات مطابقة للبحث"
                  : "No clinics match your search"}
              </p>

              <p className="mb-4 text-sm text-slate-400">
                {isArabic
                  ? "جرّب كلمة تانية أو غيّر المنطقة."
                  : "Try a different keyword or change the region."}
              </p>

              <button
                type="button"
                onClick={clearSearch}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {isArabic ? "مسح البحث" : "Clear search"}
              </button>
            </div>
          ) : (
            <div className={clinicsListClasses}>
              {clinicsToShow.map((clinic) => (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => openClinicModal(clinic)}
                  className="w-[75%] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white text-start shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:w-auto"
                >
                  <div className="flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 dark:from-slate-800 dark:to-slate-800 dark:text-blue-400">
                    {clinic.logo_url ? (
                      <img
                        src={clinic.logo_url}
                        alt={clinic.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="h-8 w-8" />
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 truncate text-base font-bold text-slate-800 dark:text-white">
                      {clinic.name}
                    </h3>

                    <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {clinic.address}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          For Doctors Section
          الصورة خلفية كاملة (absolute) والكلام فوقها (relative)
          ============================================ */}
      <section className="bg-slate-50/60 pb-10 pt-0 transition-colors duration-300 dark:bg-slate-950 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* الكونتينر: relative */}
          <div className="relative min-h-[340px] overflow-hidden rounded-3xl bg-blue-900 shadow-xl shadow-blue-900/20 lg:min-h-[280px]">
            {/* الصورة: absolute تغطي الكونتينر كله */}
            <img
              src="/doctor.jpeg"
              alt={
                isArabic
                  ? "طبيب أسنان يستخدم منصة DentalCare"
                  : "Dentist using the DentalCare platform"
              }
              className="absolute inset-0 h-full w-full object-cover object-[25%_center] lg:object-center"
            />

            {/* طبقة تغميق: على الموبايل تغطي كله، وعلى الشاشات الكبيرة تتدرج من جهة الكلام */}
            <div className="absolute inset-0 bg-blue-950/70 lg:bg-gradient-to-l lg:from-blue-950/70 lg:via-blue-950/20 lg:to-transparent" />

            {/* المحتوى: relative فوق الصورة */}
            <div className="relative z-10 flex min-h-[340px] items-center p-6 lg:min-h-[280px] lg:p-8">
              {/* على اليمين دايمًا (المساحة الفاضية في الصورة) */}
              <div className="w-full text-center lg:mr-0 lg:w-1/2 lg:text-start xl:w-5/12 lg:ml-auto">
                <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {isArabic ? "لأطباء الأسنان" : "For Dentists"}
                </span>

                <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                  {isArabic
                    ? "انضم إلى منصتنا كطبيب"
                    : "Join our platform as a doctor"}
                </h2>

                <p className="mb-4 text-sm text-blue-100">
                  {isArabic
                    ? "وفّر وقتك وابدأ في استقبال مرضاك بسهولة مع أدواتنا الذكية."
                    : "Save your time and start welcoming your patients easily with our smart tools."}
                </p>

                {/* المميزات */}
                <div className="mb-5 flex flex-col items-center gap-2 lg:items-start">
                  {doctorFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
                        <feature.icon className="h-4 w-4" />
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* الأزرار */}
                <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <Link
                    to="/doctor/register"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-500"
                  >
                    <Stethoscope className="h-4 w-4" />
                    {isArabic ? "اشترك كطبيب" : "Subscribe as a Doctor"}
                  </Link>

                  <Link
                    to="/about"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    {isArabic ? "معرفة المزيد" : "Learn more"}
                    <ArrowIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Clinic Details Modal
          ============================================ */}
      {isModalOpen && selectedClinic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeClinicModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {isArabic ? "تفاصيل العيادة" : "Clinic Details"}
              </h3>

              <button
                type="button"
                onClick={closeClinicModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 dark:from-slate-800 dark:to-slate-800 dark:text-blue-400">
                  {selectedClinic.logo_url ? (
                    <img
                      src={selectedClinic.logo_url}
                      alt={selectedClinic.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Stethoscope className="h-8 w-8" />
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selectedClinic.name}
                  </h4>
                </div>
              </div>

              {selectedClinic.address && (
                <p className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                  {selectedClinic.address}
                </p>
              )}

              <div className="mb-6">
                <h5 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {isArabic ? "نبذة عن العيادة" : "About the clinic"}
                </h5>

                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {selectedClinic.description ||
                    (isArabic
                      ? "لا يوجد وصف متاح لهذه العيادة حاليًا."
                      : "No description available for this clinic yet.")}
                </p>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                {selectedClinic.phone && (
                  <a
                    href={`tel:${selectedClinic.phone}`}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedClinic.phone}
                    </span>
                  </a>
                )}

                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />

                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedClinic.whatsapp}
                    </span>
                  </a>
                )}

                {selectedClinic.facebook && (
                  <a
                    href={selectedClinic.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Facebook className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isArabic ? "صفحة الفيسبوك" : "Facebook page"}
                    </span>
                  </a>
                )}

                {selectedClinic.address && googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isArabic
                        ? "فتح في Google Maps"
                        : "Open in Google Maps"}
                    </span>
                  </a>
                )}
              </div>

              {/* Patient Login */}
              <div className="mt-6">
                <Link
                  to={`/patient/login?clinic_id=${selectedClinic.id}`}
                  onClick={closeClinicModal}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700"
                >
                  <UserRound className="h-4 w-4" />

                  {isArabic
                    ? "تسجيل دخول المريض"
                    : "Patient Login"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;