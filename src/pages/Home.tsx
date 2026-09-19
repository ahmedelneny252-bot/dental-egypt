import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Smile,
  Shield,
  Clock,
  UserRound,
  Stethoscope,
  CalendarCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import { supabase } from "../supabase";
import SearchBar from "../components/SearchBar";
import ClinicCard from "../components/ClinicCard";
import ServiceCard from "../components/ServiceCard";

type SupabaseClinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const [isArabic, setIsArabic] = useState(
    localStorage.getItem("dentalcare-language") !== "en"
  );

  const [clinics, setClinics] = useState<SupabaseClinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const updateLanguage = () => {
      setIsArabic(
        localStorage.getItem("dentalcare-language") !== "en"
      );
    };

    window.addEventListener(
      "dentalcare-language-change",
      updateLanguage
    );

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

  // ============================================
  // Load Real Clinics From Supabase
  // ============================================

  useEffect(() => {
    const loadClinics = async () => {
      setLoadingClinics(true);

      const { data, error } = await supabase
        .from("clinics")
        .select(
          "id, name, logo_url, phone, whatsapp, address, description, slug"
        )
        .order("name", { ascending: true });

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

  const t = {
    badge: isArabic
      ? "منصة موثوقة لاختيار عيادات الأسنان"
      : "A trusted platform for choosing dental clinics",

    heroTitle: isArabic ? "ابحث عن أفضل" : "Find the best",

    heroClinic: isArabic ? "عيادة أسنان" : "Dental Clinic",

    heroDescription: isArabic
      ? "اكتشف عيادات أسنان موثوقة في مصر، قارن الخدمات، واحجز موعدك بسهولة مع دنتال كير"
      : "Discover trusted dental clinics in Egypt, compare services, and book your appointment easily with Dental Care",

    searchClinic: isArabic ? "ابحث عن عيادة" : "Find a Clinic",

    allClinics: isArabic
      ? "عرض جميع العيادات"
      : "View All Clinics",

    trustedClinics: isArabic
      ? "عيادة موثوقة"
      : "Trusted Clinics",

    happyPatients: isArabic
      ? "مرضى راضين"
      : "Happy Patients",

    patientSatisfaction: isArabic
      ? "رضا المرضى"
      : "Patient Satisfaction",

    availableService: isArabic
      ? "خدمة متاحة"
      : "Service Available",

    topClinicsTitle: isArabic
      ? "عيادات الأسنان"
      : "Dental Clinics",

    topClinicsDescription: isArabic
      ? "اكتشف عيادات الأسنان المتاحة على منصة دنتال كير"
      : "Discover the dental clinics available on DentalCare",

    noClinics: isArabic
      ? "لا توجد عيادات مضافة حاليًا"
      : "No clinics have been added yet",

    servicesTitle: isArabic
      ? "خدماتنا المتكاملة"
      : "Our Comprehensive Services",

    servicesDescription: isArabic
      ? "نقدم مجموعة واسعة من خدمات طب الأسنان باستخدام أحدث التقنيات"
      : "We offer a wide range of dental services using the latest technologies",

    ctaTitle: isArabic
      ? "هل تبحث عن عيادة أسنان موثوقة؟"
      : "Looking for a trusted dental clinic?",

    ctaDescription: isArabic
      ? "ابدأ رحلتك الآن واعثر على أفضل عيادات الأسنان في مصر مع دنتال كير"
      : "Start your journey today and find the best dental clinics in Egypt with Dental Care",

    // ============================================
    // Patient / Doctor Section
    // ============================================

    chooseTitle: isArabic
      ? "كيف تريد استخدام دنتال كير؟"
      : "How would you like to use DentalCare?",

    chooseDescription: isArabic
      ? "اختر الطريقة المناسبة لك وابدأ استخدام المنصة بسهولة"
      : "Choose the option that fits you and get started with DentalCare",

    patientTitle: isArabic
      ? "أنا مريض"
      : "I'm a Patient",

    patientDescription: isArabic
      ? "ابحث عن عيادة، تعرّف على الخدمات، واحجز موعدك بسهولة."
      : "Find a clinic, explore services, and book your appointment easily.",

    patientFeature1: isArabic
      ? "البحث عن أفضل العيادات"
      : "Find dental clinics",

    patientFeature2: isArabic
      ? "حجز المواعيد بسهولة"
      : "Book appointments easily",

    patientFeature3: isArabic
      ? "متابعة مواعيدك وحجوزاتك"
      : "Manage your appointments",

    patientButton: isArabic
      ? "احجز كـ مريض"
      : "Book as a Patient",

    patientLogin: isArabic
      ? "لديك حساب بالفعل؟ تسجيل الدخول"
      : "Already have an account? Login",

    doctorTitle: isArabic
      ? "أنا طبيب"
      : "I'm a Doctor",

    doctorDescription: isArabic
      ? "أنشئ حساب عيادتك، اختر خطة الاشتراك المناسبة، وأدر عيادتك بالكامل."
      : "Create your clinic account, choose your subscription plan, and manage your clinic.",

    doctorFeature1: isArabic
      ? "إدارة المرضى"
      : "Manage patients",

    doctorFeature2: isArabic
      ? "إدارة المواعيد والحجوزات"
      : "Manage appointments",

    doctorFeature3: isArabic
      ? "المدفوعات والوصفات الطبية"
      : "Payments & prescriptions",

    doctorButton: isArabic
      ? "اشترك كطبيب"
      : "Subscribe as a Doctor",

    doctorLogin: isArabic
      ? "لديك حساب بالفعل؟ تسجيل الدخول"
      : "Already have an account? Login",
  };

  // Show only the first 3 real clinics
  const topClinics = clinics.slice(0, 3);

  const stats = [
    {
      icon: Users,
      value: `${clinics.length}+`,
      label: t.trustedClinics,
    },
    {
      icon: Smile,
      value: "10K+",
      label: t.happyPatients,
    },
    {
      icon: Shield,
      value: "99%",
      label: t.patientSatisfaction,
    },
    {
      icon: Clock,
      value: "24/7",
      label: t.availableService,
    },
  ];

  const services = [
    {
      icon: "sparkles",
      title: isArabic ? "تبييض الأسنان" : "Teeth Whitening",
      description: isArabic
        ? "تبييض احترافي بآخر التقنيات لابتسامة مشرقة وواثقة."
        : "Professional whitening using the latest techniques for a brighter, more confident smile.",
    },
    {
      icon: "shield",
      title: isArabic ? "وقاية من التسوس" : "Cavity Prevention",
      description: isArabic
        ? "علاجات وقائية شاملة لحماية أسنانك من التسوس والأمراض."
        : "Comprehensive preventive treatments to protect your teeth from cavities and dental diseases.",
    },
    {
      icon: "heart",
      title: isArabic ? "زراعة الأسنان" : "Dental Implants",
      description: isArabic
        ? "زراعة أسنان متقدمة باستخدام أحدث التقنيات الطبية."
        : "Advanced dental implants using the latest medical technologies.",
    },
    {
      icon: "smile",
      title: isArabic ? "تقويم الأسنان" : "Orthodontics",
      description: isArabic
        ? "حلول تقويمية متنوعة تشمل التقويم الشفاف والمعدني."
        : "Various orthodontic solutions including clear and traditional braces.",
    },
    {
      icon: "clock",
      title: isArabic ? "طوارئ الأسنان" : "Dental Emergencies",
      description: isArabic
        ? "خدمة طوارئ على مدار الساعة لحالات الألم والإصابات."
        : "24/7 emergency dental care for pain, injuries, and urgent cases.",
    },
    {
      icon: "award",
      title: isArabic ? "تجميل الأسنان" : "Cosmetic Dentistry",
      description: isArabic
        ? "خدمات تجميلية متقدمة لابتسامة هوليوود مثالية."
        : "Advanced cosmetic dental services for a beautiful Hollywood smile.",
    },
  ];

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="bg-white pt-16 transition-colors duration-300 dark:bg-slate-950 lg:pt-20"
    >
      {/* ============================================
          Hero Section
      ============================================ */}

      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-teal-950/20">
        <div className="absolute inset-0">
          <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-teal-200/20 blur-3xl dark:bg-teal-500/10" />
          <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl dark:bg-teal-500/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <CheckCircle className="h-4 w-4" />
              {t.badge}
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-slate-800 dark:text-white md:text-5xl lg:text-6xl">
              {t.heroTitle}{" "}
              <span className="bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">
                {t.heroClinic}
              </span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-slate-500 dark:text-slate-300 md:text-xl">
              {t.heroDescription}
            </p>

            {/* Search Bar */}
            <div className="mb-8">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(
                      `/clinics?search=${encodeURIComponent(
                        searchQuery
                      )}`
                    );
                  } else {
                    navigate("/clinics");
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-teal-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/30 active:scale-[0.98]"
              >
                <Search className="h-5 w-5" />
                {t.searchClinic}
              </button>

              <Link
                to="/clinics"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-700 transition-all duration-300 hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-slate-800"
              >
                {t.allClinics}
                <ArrowIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Patient / Doctor Choice Section
      ============================================ */}

      <section className="relative overflow-hidden bg-white py-16 transition-colors duration-300 dark:bg-slate-950 md:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-10 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-900/10" />
          <div className="absolute right-1/4 bottom-10 h-64 w-64 rounded-full bg-slate-100/70 blur-3xl dark:bg-slate-900/40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              <Sparkles className="h-4 w-4" />
              {isArabic ? "ابدأ الآن" : "Get Started"}
            </div>

            <h2 className="mb-4 text-3xl font-bold text-slate-800 dark:text-white md:text-4xl">
              {t.chooseTitle}
            </h2>

            <p className="text-lg text-slate-500 dark:text-slate-400">
              {t.chooseDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Patient Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-teal-900/50 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 md:p-10">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-200/30 blur-2xl transition-transform duration-500 group-hover:scale-125 dark:bg-teal-500/10" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300">
                    <UserRound className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {isArabic ? "للمرضى" : "For Patients"}
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
                      {t.patientTitle}
                    </h3>
                  </div>
                </div>

                <p className="mb-7 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {t.patientDescription}
                </p>

                <div className="mb-8 space-y-4">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300">
                      <Search className="h-4 w-4" />
                    </div>
                    <span>{t.patientFeature1}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <span>{t.patientFeature2}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span>{t.patientFeature3}</span>
                  </div>
                </div>

                <Link
                  to="/patient/register"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.99]"
                >
                  <UserRound className="h-5 w-5" />
                  {t.patientButton}
                  <ArrowIcon className="h-5 w-5" />
                </Link>

                <Link
                  to="/patient/login"
                  className="mt-4 flex items-center justify-center text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  {t.patientLogin}
                </Link>
              </div>
            </div>

            {/* Doctor Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 md:p-10">
              <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-slate-200/50 blur-2xl transition-transform duration-500 group-hover:scale-125 dark:bg-slate-700/20" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-teal-300">
                    <Stethoscope className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {isArabic ? "للأطباء والعيادات" : "For Doctors & Clinics"}
                    </p>

                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
                      {t.doctorTitle}
                    </h3>
                  </div>
                </div>

                <p className="mb-7 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {t.doctorDescription}
                </p>

                <div className="mb-8 space-y-4">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-teal-300">
                      <Users className="h-4 w-4" />
                    </div>
                    <span>{t.doctorFeature1}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-teal-300">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <span>{t.doctorFeature2}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-teal-300">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span>{t.doctorFeature3}</span>
                  </div>
                </div>

                <Link
                  to="/doctor/subscription"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:bg-slate-900 hover:shadow-xl active:scale-[0.99] dark:bg-teal-600 dark:hover:bg-teal-700"
                >
                  <Stethoscope className="h-5 w-5" />
                  {t.doctorButton}
                  <ArrowIcon className="h-5 w-5" />
                </Link>

                <Link
                  to="/doctor/login"
                  className="mt-4 flex items-center justify-center text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  {t.doctorLogin}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Stats Section
      ============================================ */}

      <section className="border-y border-slate-100 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 dark:from-teal-900/30 dark:to-teal-800/30 dark:text-teal-400">
                  <stat.icon className="h-7 w-7" />
                </div>

                <p className="text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
                  {stat.value}
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Real Clinics Section
      ============================================ */}

      <section className="bg-slate-50/50 py-16 transition-colors duration-300 dark:bg-slate-950 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-800 dark:text-white md:text-4xl">
              {t.topClinicsTitle}
            </h2>

            <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
              {t.topClinicsDescription}
            </p>
          </div>

          {loadingClinics ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[430px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : topClinics.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topClinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {t.noClinics}
              </p>
            </div>
          )}

          {clinics.length > 0 && (
            <div className="mt-12 text-center">
              <Link
                to="/clinics"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-teal-600"
              >
                {t.allClinics}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          Services Section
      ============================================ */}

      <section className="bg-white py-16 transition-colors duration-300 dark:bg-slate-900 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-800 dark:text-white md:text-4xl">
              {t.servicesTitle}
            </h2>

            <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
              {t.servicesDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CTA Section
      ============================================ */}

      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 py-16 md:py-24">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            {t.ctaTitle}
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-100">
            {t.ctaDescription}
          </p>

          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-teal-700 shadow-xl shadow-teal-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
          >
            {t.searchClinic}
            <ArrowIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
