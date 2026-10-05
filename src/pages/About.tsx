import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Users,
  Shield,
  Sparkles,
  Globe,
  Clock,
  CheckCircle,
  Smile,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { translations, type Language } from "../i18n";

const About = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  useEffect(() => {
    const updateLanguage = () => {
      const saved = localStorage.getItem("dentalcare-language");
      setLanguage(saved === "en" ? "en" : "ar");
    };

    window.addEventListener("dentalcare-language-change", updateLanguage);
    window.addEventListener("storage", updateLanguage);

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        updateLanguage
      );
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  const isArabic = language === "ar";
  const t = translations[language];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background pt-16 text-foreground transition-colors"
    >
      {/* Header */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-6 lg:px-8">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
              {isArabic ? "من نحن" : "About Us"}
            </h1>

            <p className="mx-auto max-w-2xl text-muted-foreground">
              {isArabic
                ? "تعرف على رؤيتنا ومهمتنا في دنتال كير"
                : "Learn about our vision and mission at DentalCare"}
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Mission */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
                  <Heart className="h-6 w-6 fill-white text-white" />
                </div>

                <h2 className="text-xl font-bold text-foreground">
                  {isArabic ? "مهمتنا" : "Our Mission"}
                </h2>
              </div>

              <p className="mb-4 leading-relaxed text-muted-foreground">
                {isArabic
                  ? "نهدف إلى ربط المرضى بأفضل عيادات الأسنان في مصر من خلال منصة موثوقة وسهلة الاستخدام، مع توفير معلومات شاملة تساعدهم على اتخاذ قرارات مستنيرة بشأن صحتهم الفموية."
                  : "Our mission is to connect patients with dental clinics across Egypt through a trusted and easy-to-use platform, providing comprehensive information that helps them make informed decisions about their oral health."}
              </p>

              <div className="space-y-3">
                {[
                  isArabic
                    ? "توفير معلومات دقيقة ومحدثة عن العيادات"
                    : "Provide accurate and up-to-date clinic information",

                  isArabic
                    ? "تسهيل عملية البحث والحجز"
                    : "Make searching and booking easier",

                  isArabic
                    ? "ضمان الشفافية والمصداقية"
                    : "Promote transparency and trust",

                  isArabic
                    ? "تحسين تجربة المريض في مجال طب الأسنان"
                    : "Improve the patient experience in dental care",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
                  <Users className="h-6 w-6 fill-white text-white" />
                </div>

                <h2 className="text-xl font-bold text-foreground">
                  {isArabic ? "رؤيتنا" : "Our Vision"}
                </h2>
              </div>

              <p className="mb-4 leading-relaxed text-muted-foreground">
                {isArabic
                  ? "أن نكون المنصة الرائدة في مجال طب الأسنان في مصر والشرق الأوسط، ونحدث تحولاً إيجابياً في كيفية الوصول إلى خدمات الأسنان عالية الجودة."
                  : "To become a leading dental care platform in Egypt and the Middle East, creating a positive transformation in how people access high-quality dental services."}
              </p>

              <div className="space-y-3">
                {[
                  {
                    icon: Globe,
                    text: isArabic
                      ? "التوسع إلى جميع محافظات مصر"
                      : "Expand to all Egyptian governorates",
                  },
                  {
                    icon: Clock,
                    text: isArabic
                      ? "توفير خدمة على مدار الساعة"
                      : "Provide a service available around the clock",
                  },
                  {
                    icon: Sparkles,
                    text: isArabic
                      ? "دمج أحدث التقنيات والذكاء الاصطناعي"
                      : "Integrate modern technologies and artificial intelligence",
                  },
                  {
                    icon: Shield,
                    text: isArabic
                      ? "ضمان أعلى معايير الجودة والسلامة"
                      : "Maintain high standards of quality and safety",
                  },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                    <span className="text-sm text-muted-foreground">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
            {isArabic
              ? "لماذا تختار دنتال كير؟"
              : "Why Choose DentalCare?"}
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Patients */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
                  <Smile className="h-5 w-5 text-teal-500" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {isArabic ? "للمرضى" : "For Patients"}
                </h3>
              </div>

              <ul className="space-y-3 text-muted-foreground">
                {[
                  isArabic
                    ? "بحث سهل وسريع عن العيادات"
                    : "Easy and fast clinic search",

                  isArabic
                    ? "مقارنة الخدمات والتقييمات"
                    : "Compare services and reviews",

                  isArabic
                    ? "معلومات تفصيلية عن الأطباء والخدمات"
                    : "Detailed information about doctors and services",

                  isArabic
                    ? "الاتصال المباشر عبر الهاتف أو الواتساب"
                    : "Direct contact by phone or WhatsApp",

                  isArabic
                    ? "الحصول على الاتجاهات بسهولة"
                    : "Get directions easily",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-3 w-3 flex-shrink-0 text-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Clinics */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
                  <Stethoscope className="h-5 w-5 text-teal-500" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {isArabic ? "للعيادات" : "For Clinics"}
                </h3>
              </div>

              <ul className="space-y-3 text-muted-foreground">
                {[
                  isArabic
                    ? "زيادة الظهور والوصول إلى المرضى"
                    : "Increase visibility and reach patients",

                  isArabic
                    ? "عرض الخدمات والتخصصات بدقة"
                    : "Showcase services and specialties accurately",

                  isArabic
                    ? "بناء الثقة من خلال التقييمات الحقيقية"
                    : "Build trust through genuine reviews",

                  isArabic
                    ? "تسهيل عملية التواصل مع المرضى"
                    : "Make communication with patients easier",

                  isArabic
                    ? "تحليل البيانات لتحسين الخدمات"
                    : "Use data to improve services",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-3 w-3 flex-shrink-0 text-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
                  <Shield className="h-5 w-5 text-teal-500" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  {isArabic ? "مميزات المنصة" : "Platform Features"}
                </h3>
              </div>

              <ul className="space-y-3 text-muted-foreground">
                {[
                  isArabic
                    ? "بيانات محدثة ودقيقة"
                    : "Accurate and up-to-date data",

                  isArabic
                    ? "واجهة مستخدم سلسة وسهلة"
                    : "Simple and smooth user interface",

                  isArabic
                    ? "دعم فني متواصل"
                    : "Continuous technical support",

                  isArabic
                    ? "متوافق مع جميع الأجهزة"
                    : "Compatible with all devices",

                  isArabic
                    ? "أمان وخصوصية عالية"
                    : "High security and privacy",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-3 w-3 flex-shrink-0 text-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
              ? "مستعد لاكتشاف أفضل عيادات الأسنان؟"
              : "Ready to Discover Dental Clinics?"}
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-100">
            {isArabic
              ? "ابدأ رحلتك الآن مع دنتال كير واعثر على العيادة المناسبة لاحتياجاتك"
              : "Start your journey with DentalCare and find the right clinic for your needs"}
          </p>

          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-teal-700 shadow-xl shadow-teal-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
          >
            {t.common.findClinic}

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

export default About;