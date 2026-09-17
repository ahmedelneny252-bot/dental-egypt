
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import {
  Sparkles,
  Clock,
  Award,
  Users,
  Stethoscope,
  ShieldCheck,
  Phone,
  ArrowRight,
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: "sparkles",
      title: "تبييض الأسنان",
      description:
        "تبييض احترافي بآخر التقنيات لابتسامة مشرقة وواثقة باستخدام مواد آمنة وفعالة تدوم طويلاً.",
      benefit: "نتائج فورية تدوم حتى عامين مع العناية المناسبة",
    },
    {
      icon: "shield",
      title: "وقاية من التسوس",
      description:
        "علاجات وقائية شاملة تشمل تنظيف عميق، فلوريد، وحشوات وقائية لحماية أسنانك من التسوس والأمراض.",
      benefit: "تقليل خطر التسوس بنسبة تصل إلى 80% مع المتابعة الدورية",
    },
    {
      icon: "heart",
      title: "زراعة الأسنان",
      description:
        "زراعة أسنان متقدمة باستخدام أحدث التقنيات الطبية لضمان نتائج طبيعية ودائمة تشبه الأسنان الطبيعية.",
      benefit: "معدل نجاح يتجاوز 95% مع ضمان مدى الحياة على الزراعة",
    },
    {
      icon: "smile",
      title: "تقويم الأسنان",
      description:
        "حلول تقويمية متنوعة تشمل التقويم الشفاف والمعدني والسيراميكي لتصحيح ترتيب الأسنان وتحسين الابتسامة.",
      benefit: "خيارات مرنة تناسب جميع الأعمار والاحتياجات الجمالية والوظيفية",
    },
    {
      icon: "clock",
      title: "طوارئ الأسنان",
      description:
        "خدمة طوارئ على مدار الساعة لحالات الألم الشديد، الكسور، والالتهابات الحادة التي تحتاج تدخلاً فورياً.",
      benefit: "استجابة فورية خلال 30 دقيقة من الاتصال بخدمة الطوارئ",
    },
    {
      icon: "award",
      title: "تجميل الأسنان",
      description:
        "خدمات تجميلية متقدمة تشمل الفينير، الترميمات التجميلية، وتصميم الابتسامة الرقمية لابتسامة هوليوود مثالية.",
      benefit: "تحليل رقمي للابتسامة لضمان نتائج متناسقة مع ملامح الوجه",
    },
    {
      icon: "users",
      title: "طب أسنان الأطفال",
      description:
        "رعاية متخصصة للأطفال من عمر سنة إلى المراهقة مع بيئة مريحة وآمنة وتقنيات مناسبة للأعمار الصغيرة.",
      benefit: "نهج وقائي يركز على التعليم وبناء عادات صحية منذ الصغر",
    },
    {
      icon: "stethoscope",
      title: "علاج جذور الأسنان",
      description:
        "إزالة الأنسجة الملتهبة من داخل السن وتعقيمها وحشوها بمواد خاصة لإنقاذ السن من الخلع.",
      benefit: "الحفاظ على السن الطبيعي وتجنب الحاجة للخلع أو الزراعة",
    },
    {
      icon: "shield-check",
      title: "جراحة الفم",
      description:
        "إجراءات جراحية متخصصة تشمل خلع الأسنان المدفونة، زراعة العظام، وعلاج تشوهات الفك والوجه.",
      benefit: "إجراء جراحي دقيق باستخدام أحدث التقنيات لضمان التعافي السريع",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pt-16 lg:pt-20">
      {/* Header */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold text-slate-800 md:text-4xl">
              خدماتنا
            </h1>

            <p className="mx-auto max-w-2xl text-slate-500">
              اكتشف مجموعة شاملة من خدمات طب الأسنان التي نقدمها من خلال شبكة
              عياداتنا الموثوقة
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-slate-800 md:text-3xl">
            جميع خدمات طب الأسنان
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <div key={index} className="group">
                <ServiceCard
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                />

                <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4">
                  <p className="text-sm font-medium text-teal-700">
                    {service.benefit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-100 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-800 md:text-3xl">
            كيف يعمل دنتال كير؟
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Search */}
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100">
                <Sparkles className="h-8 w-8 text-teal-600" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-800">
                ابحث
              </h3>

              <p className="text-slate-500">
                استخدم محرك البحث المتقدم لدينا للعثور على العيادات حسب الموقع
                أو التخصص أو التقييم.
              </p>
            </div>

            {/* Compare */}
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100">
                <Award className="h-8 w-8 text-teal-600" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-800">
                قارن
              </h3>

              <p className="text-slate-500">
                قارن بين العيادات من حيث الخدمات والأسعار والتقييمات وساعات
                العمل.
              </p>
            </div>

            {/* Contact */}
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100">
                <Phone className="h-8 w-8 text-teal-600" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-slate-800">
                تواصل
              </h3>

              <p className="text-slate-500">
                تواصل مباشرة مع العيادة عبر الهاتف أو الواتساب لحجز موعدك.
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
            مستعد لاكتشاف خدماتنا؟
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-100">
            ابحث عن العيادة التي تقدم الخدمة التي تحتاجها واحجز موعدك الآن
          </p>

          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-teal-700 shadow-xl shadow-teal-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
          >
            ابحث عن عيادة
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;

