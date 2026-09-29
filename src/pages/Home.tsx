import { useEffect, useState } from "react";
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
  CreditCard,
  ShieldPlus,
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
  rating?: number | null;
  doctors_count?: number | null;
  services_count?: number | null;
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState("");
  const [isArabic, setIsArabic] = useState(
    localStorage.getItem("dentalcare-language") !== "en"
  );

  const [clinics, setClinics] = useState<SupabaseClinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  // ✅ بيانات المودال (نافذة تفاصيل العيادة)
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

  // ✅ منع تمرير الصفحة اللي وراء المودال لما يبقى مفتوح
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  useEffect(() => {
    const loadClinics = async () => {
      setLoadingClinics(true);

      const { data, error } = await supabase
        .from("clinics")
        .select(
          "id, name, logo_url, phone, whatsapp, facebook, address, description, slug, latitude, longitude"
        )
        .order("name", { ascending: true })
        .limit(4);

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

  // بيانات تجريبية تظهر لحد ما العيادات الحقيقية تتحمل من قاعدة البيانات
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
      rating: 4.8,
      doctors_count: 5,
      services_count: 12,
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
      rating: 4.6,
      doctors_count: 3,
      services_count: 8,
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
      rating: 4.7,
      doctors_count: 4,
      services_count: 10,
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
      rating: 4.5,
      doctors_count: 3,
      services_count: 7,
    },
  ];

  const clinicsToShow = clinics.length > 0 ? clinics : fallbackClinics;

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
    {
      icon: ShieldCheck,
      label: isArabic
        ? "بدون عمولات عالية"
        : "No high commissions",
    },
  ];

  // ✅ فتح مودال تفاصيل العيادة بدل الانتقال لصفحة تانية
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

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="bg-white pt-16 transition-colors duration-300 dark:bg-slate-950 lg:pt-20"
    >
      {/* ============================================
          Hero Section
          ============================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:min-h-[560px] lg:px-8 lg:py-0">

          {/* الصورة — absolute على الشمال، بتملا نص عرض القسم بارتفاعه بالكامل (ديسكتوب بس، زي التصميم الأصلي) */}
          <div className="absolute inset-y-0 left-0 hidden w-1/2 lg:block">
            <img
              src="/dental-care.jpg"
              alt={isArabic ? "عيادة الأسنان" : "Dental clinic"}
              className="h-full w-full object-cover"
            />

            {/* تدرّج تحت */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-slate-950" />

            {/* تدرّج على الشمال */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-slate-950" />

            {/* تدرّج على اليمين */}
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-slate-950" />

            {/* تدرّج فوق */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-50 to-transparent dark:from-slate-900" />

            <div className="absolute bottom-8 right-8 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  +400 {isArabic ? "عيادة" : "clinics"}
                </p>

                <p className="text-xs text-slate-400">
                  {isArabic ? "على المنصة" : "on the platform"}
                </p>
              </div>
            </div>
          </div>

          {/* الكلام — relative على اليمين، بياخد نص عرض القسم على الديسكتوب عشان الصورة ماتغطيش عليه.
              lg:ml-auto بتثبته على اليمين فعليًا في اللغتين (عربي وإنجليزي)، عشان لما اللغة
              تتغير لإنجليزي (dir يبقى ltr) الكلام ميرجعش يتحط على الشمال فوق الصورة. */}
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

              {/* Search bar: input | region dropdown | button */}
              <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isArabic
                        ? "ابحث بالعيادة، الطبيب، أو الخدمة..."
                        : "Search clinic, doctor, or service..."
                    }
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                  />
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

                <Link
                  to="/clinics"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  {isArabic ? "ابحث عن عيادة" : "Find a Clinic"}
                </Link>
              </div>

              {/* Trust points row */}
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
          Featured Clinics
          ============================================ */}
      <section className="bg-slate-50/60 py-16 transition-colors duration-300 dark:bg-slate-950 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {isArabic ? "أشهر العيادات" : "Popular Clinics"}
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

            <Link
              to="/clinics"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {isArabic ? "عرض الكل" : "View all"}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          {loadingClinics ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {clinicsToShow.map((clinic) => (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => openClinicModal(clinic)}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 dark:from-slate-800 dark:to-slate-800 dark:text-blue-400">
                    <Stethoscope className="h-8 w-8" />
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-1 text-sm font-bold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {clinic.rating ?? 4.7}
                    </div>

                    <h3 className="mb-1 truncate text-base font-bold text-slate-800 dark:text-white">
                      {clinic.name}
                    </h3>

                    <p className="mb-3 flex items-center gap-1 truncate text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {clinic.address}
                    </p>

                    <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users2 className="h-3.5 w-3.5" />
                        {clinic.doctors_count ?? 3}{" "}
                        {isArabic ? "أطباء" : "doctors"}
                      </span>

                      <span className="flex items-center gap-1">
                        <ShieldPlus className="h-3.5 w-3.5" />
                        {clinic.services_count ?? 8}{" "}
                        {isArabic ? "خدمة" : "services"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          For Doctors Section
          ============================================ */}
      <section className="bg-white py-16 transition-colors duration-300 dark:bg-slate-900 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 rounded-3xl bg-blue-50/60 p-8 dark:bg-slate-800/40 lg:grid-cols-[220px_1fr_240px] lg:gap-8 lg:p-12">

            {/* العمود الأيمن: قائمة المميزات الجانبية */}
            <div className="order-3 flex flex-col gap-4 lg:order-1">
              <span className="hidden self-end rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 lg:inline-block">
                {isArabic ? "لأطباء الأسنان" : "For Dentists"}
              </span>

              {doctorFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-end gap-3 lg:justify-start"
                >
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 lg:order-2">
                    {feature.label}
                  </span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 lg:order-1">
                    <feature.icon className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>

            {/* العمود الأوسط: العنوان والوصف والأزرار */}
            <div className="order-2 text-center lg:text-right">
              <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 lg:hidden">
                {isArabic ? "لأطباء الأسنان" : "For Dentists"}
              </span>

              <h2 className="mb-3 text-3xl font-bold text-slate-800 dark:text-white">
                {isArabic
                  ? "انضم إلى منصتنا كطبيب"
                  : "Join our platform as a doctor"}
              </h2>

              <p className="mb-6 text-slate-500 dark:text-slate-300">
                {isArabic
                  ? "وفّر وقتك وابدأ في استقبال مرضاك بسهولة مع أدواتنا الذكية."
                  : "Save your time and start welcoming your patients easily with our smart tools."}
              </p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/doctor/register"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700"
                >
                  <Stethoscope className="h-4 w-4" />
                  {isArabic ? "اشترك كطبيب" : "Subscribe as a Doctor"}
                </Link>

                <Link
                  to="/about"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {isArabic ? "معرفة المزيد" : "Learn more"}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* العمود الأيسر: صورة الطبيب (بديل - استبدلها بصورتك) */}
            <div className="order-1 mx-auto flex aspect-[3/4] w-40 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-600/20 sm:w-48 lg:order-3 lg:mx-0">
              <UserRound className="h-20 w-20 text-white/90" />
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
                  <div className="mb-1 flex items-center gap-1 text-sm font-bold text-amber-500">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {selectedClinic.rating ?? 4.7}
                  </div>

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

              <div className="mb-5 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users2 className="h-4 w-4" />
                  {selectedClinic.doctors_count ?? 3}{" "}
                  {isArabic ? "أطباء" : "doctors"}
                </span>

                <span className="flex items-center gap-1">
                  <ShieldPlus className="h-4 w-4" />
                  {selectedClinic.services_count ?? 8}{" "}
                  {isArabic ? "خدمة" : "services"}
                </span>
              </div>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;