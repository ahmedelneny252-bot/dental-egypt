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
      {/* Hero Section */}
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

      {/* Stats Section */}
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

      {/* Real Clinics Section */}
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

      {/* Services Section */}
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

      {/* CTA Section */}
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