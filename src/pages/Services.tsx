import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clinics } from "../data/clinics";
import ServiceCard from "../components/ServiceCard";
import {
  CheckCircle,
  Phone,
  Search,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { translations, type Language } from "../i18n";

const Services = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("dentalcare-language");
    return savedLanguage === "en" ? "en" : "ar";
  });

  const isArabic = language === "ar";

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem("dentalcare-language");

      setLanguage(savedLanguage === "en" ? "en" : "ar");
    };

    window.addEventListener(
      "dentalcare-language-change",
      handleLanguageChange
    );

    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        handleLanguageChange
      );

      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  const services = [
    {
      icon: "sparkles",
      title: {
        ar: "تبييض الأسنان",
        en: "Teeth Whitening",
      },
      description: {
        ar: "تبييض احترافي بآخر التقنيات لابتسامة مشرقة وواثقة باستخدام مواد آمنة وفعالة تدوم طويلاً.",
        en: "Professional teeth whitening using the latest techniques and safe, effective materials for a bright and confident smile.",
      },
      benefit: {
        ar: "نتائج فورية تدوم حتى عامين مع العناية المناسبة",
        en: "Immediate results that can last up to two years with proper care",
      },
    },
    {
      icon: "shield",
      title: {
        ar: "وقاية من التسوس",
        en: "Cavity Prevention",
      },
      description: {
        ar: "علاجات وقائية شاملة تشمل تنظيف عميق، فلوريد، وحشوات وقائية لحماية أسنانك من التسوس والأمراض.",
        en: "Comprehensive preventive treatments including deep cleaning, fluoride, and preventive fillings to protect your teeth.",
      },
      benefit: {
        ar: "تقليل خطر التسوس مع المتابعة الدورية",
        en: "Reduce the risk of cavities with regular dental care",
      },
    },
    {
      icon: "heart",
      title: {
        ar: "زراعة الأسنان",
        en: "Dental Implants",
      },
      description: {
        ar: "زراعة أسنان متقدمة باستخدام أحدث التقنيات الطبية لضمان نتائج طبيعية ودائمة تشبه الأسنان الطبيعية.",
        en: "Advanced dental implants using modern medical techniques to provide natural-looking and long-lasting results.",
      },
      benefit: {
        ar: "نتائج طبيعية ودائمة مع العناية والمتابعة المناسبة",
        en: "Natural and long-lasting results with proper care and follow-up",
      },
    },
    {
      icon: "smile",
      title: {
        ar: "تقويم الأسنان",
        en: "Orthodontics",
      },
      description: {
        ar: "حلول تقويمية متنوعة تشمل التقويم الشفاف والمعدني لتصحيح ترتيب الأسنان وتحسين الابتسامة.",
        en: "A variety of orthodontic solutions including clear and metal braces to improve tooth alignment and your smile.",
      },
      benefit: {
        ar: "خيارات مرنة تناسب مختلف الأعمار والاحتياجات",
        en: "Flexible options suitable for different ages and needs",
      },
    },
    {
      icon: "clock",
      title: {
        ar: "طوارئ الأسنان",
        en: "Dental Emergencies",
      },
      description: {
        ar: "خدمة طوارئ لحالات الألم الشديد، الكسور، والالتهابات الحادة التي تحتاج تدخلاً سريعاً.",
        en: "Emergency dental care for severe pain, fractures, and acute infections that require prompt attention.",
      },
      benefit: {
        ar: "رعاية سريعة للحالات التي تحتاج إلى تدخل عاجل",
        en: "Fast care for dental conditions requiring urgent attention",
      },
    },
    {
      icon: "award",
      title: {
        ar: "تجميل الأسنان",
        en: "Cosmetic Dentistry",
      },
      description: {
        ar: "خدمات تجميلية متقدمة تشمل الفينير، الترميمات التجميلية، وتصميم الابتسامة الرقمية.",
        en: "Advanced cosmetic services including veneers, cosmetic restorations, and digital smile design.",
      },
      benefit: {
        ar: "تصميم ابتسامة متناسق مع ملامح الوجه",
        en: "Smile design tailored to your facial features",
      },
    },
    {
      icon: "users",
      title: {
        ar: "طب أسنان الأطفال",
        en: "Pediatric Dentistry",
      },
      description: {
        ar: "رعاية متخصصة للأطفال من عمر سنة إلى المراهقة مع بيئة مريحة وآمنة وتقنيات مناسبة للأعمار الصغيرة.",
        en: "Specialized dental care for children from infancy through adolescence in a safe and comfortable environment.",
      },
      benefit: {
        ar: "نهج وقائي يساعد الأطفال على بناء عادات صحية منذ الصغر",
        en: "A preventive approach that helps children build healthy habits early",
      },
    },
    {
      icon: "stethoscope",
      title: {
        ar: "علاج جذور الأسنان",
        en: "Root Canal Treatment",
      },
      description: {
        ar: "إزالة الأنسجة الملتهبة من داخل السن وتنظيفها وحشوها بمواد خاصة لإنقاذ السن من الخلع.",
        en: "Removal of infected tissue from inside the tooth, followed by cleaning and filling to preserve the natural tooth.",
      },
      benefit: {
        ar: "الحفاظ على السن الطبيعي وتجنب الحاجة للخلع",
        en: "Preserve the natural tooth and avoid extraction when possible",
      },
    },
    {
      icon: "shield-check",
      title: {
        ar: "جراحة الفم",
        en: "Oral Surgery",
      },
      description: {
        ar: "إجراءات جراحية متخصصة تشمل خلع الأسنان المدفونة، زراعة العظام، وعلاج بعض مشكلات الفك والوجه.",
        en: "Specialized surgical procedures including impacted tooth extraction, bone grafting, and treatment of certain jaw conditions.",
      },
      benefit: {
        ar: "إجراءات دقيقة باستخدام تقنيات حديثة",
        en: "Precise procedures using modern techniques",
      },
    },
  ];

  const servicesWithClinics = services.map((service) => {
    const clinicsOffering = clinics.filter((clinic) =>
      clinic.services.some(
        (serviceName) =>
          serviceName.includes(service.title.ar) ||
          serviceName.includes(service.title.en)
      )
    );

    return {
      ...service,
      clinicsOffering,
    };
  });

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50/50 pt-16 dark:bg-slate-950 lg:pt-20"
    >
      {/* Header */}
      <section className="border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-white md:text-4xl">
              {isArabic ? "خدماتنا" : "Our Services"}
            </h1>

            <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
              {isArabic
                ? "اكتشف مجموعة شاملة من خدمات طب الأسنان التي نقدمها من خلال شبكة عياداتنا الموثوقة"
                : "Discover a comprehensive range of dental services offered through our trusted clinic network"}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
            {isArabic
              ? "جميع خدمات طب الأسنان"
              : "All Dental Services"}
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicesWithClinics.map((service, index) => (
              <div key={index} className="group">
                <ServiceCard
                  title={service.title[language]}
                  description={service.description[language]}
                  icon={service.icon.toLowerCase()}
                />

                {service.clinicsOffering.length > 0 && (
                  <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30">
                    <p className="mb-2 text-sm font-medium text-teal-700 dark:text-teal-300">
                      {isArabic
                        ? `متوفر في ${service.clinicsOffering.length} عيادة`
                        : `Available at ${service.clinicsOffering.length} ${
                            service.clinicsOffering.length === 1
                              ? "clinic"
                              : "clinics"
                          }`}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {service.clinicsOffering
                        .slice(0, 3)
                        .map((clinic) => (
                          <Link
                            key={clinic.id}
                            to={`/clinics/${clinic.id}`}
                            className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-400 dark:hover:bg-teal-900/40"
                          >
                            {clinic.name}
                          </Link>
                        ))}

                      {service.clinicsOffering.length > 3 && (
                        <span className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-600 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-400">
                          +{service.clinicsOffering.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-100 bg-white py-12 dark:border-slate-800 dark:bg-slate-900 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
            {isArabic
              ? "كيف يعمل دنتال كير؟"
              : "How Does DentalCare Work?"}
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Search */}
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
                <Search className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-white">
                {isArabic ? "ابحث" : "Search"}
              </h3>

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "استخدم محرك البحث المتقدم لدينا للعثور على العيادات حسب الموقع، التخصص، أو التقييم"
                  : "Use our advanced search to find clinics by location, specialty, or rating"}
              </p>
            </div>

            {/* Compare */}
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
                <CheckCircle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-white">
                {isArabic ? "قارن" : "Compare"}
              </h3>

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "قارن بين العيادات من حيث الخدمات، الأسعار، التقييمات، وساعات العمل"
                  : "Compare clinics based on services, prices, ratings, and working hours"}
              </p>
            </div>

            {/* Contact */}
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
                <Phone className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-white">
                {isArabic ? "تواصل" : "Contact"}
              </h3>

              <p className="text-slate-500 dark:text-slate-400">
                {isArabic
                  ? "تواصل مباشرة مع العيادة عبر الهاتف أو الواتساب لحجز موعدك"
                  : "Contact the clinic directly by phone or WhatsApp to book your appointment"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 py-16 md:py-24">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            {isArabic
              ? "مستعد لاكتشاف خدماتنا؟"
              : "Ready to Discover Our Services?"}
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-100">
            {isArabic
              ? "ابحث عن العيادة التي تقدم الخدمة التي تحتاجها واحجز موعدك الآن"
              : "Find a clinic that offers the service you need and book your appointment now"}
          </p>

          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-teal-700 shadow-xl shadow-teal-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
          >
            {isArabic ? "ابحث عن عيادة" : "Find a Clinic"}

            {isArabic ? (
              <ArrowLeft className="h-5 w-5" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;