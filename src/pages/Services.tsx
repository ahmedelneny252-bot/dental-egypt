import { Link } from "react-router-dom";
import { clinics, allServices } from "../data/clinics";
import ServiceCard from "../components/ServiceCard";
import { CheckCircle, Phone, ArrowRight } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: "sparkles",
      title: "تبييض الأسنان",
      description: "تبييض احترافي بآخر التقنيات لابتسامة مشرقة وواثقة باستخدام مواد آمنة وفعالة تدوم طويلاً.",
      benefit: "نتائج فورية تدوم حتى عامين مع العناية المناسبة",
    },
    {
      icon: "shield",
      title: "وقاية من التسوس",
      description: "علاجات وقائية شاملة تشمل تنظيف عميق، فلوريد، وحشوات وقائية لحماية أسنانك من التسوس والأمراض.",
      benefit: "تقليل خطر التسوس بنسبة تصل إلى 80% مع المتابعة الدورية",
    },
    {
      icon: "heart",
      title: "زراعة الأسنان",
      description: "زراعة أسنان متقدمة باستخدام أحدث التقنيات الطبية لضمان نتائج طبيعية ودائمة تشبه الأسنان الطبيعية.",
      benefit: "معدل نجاح يتجاوز 95% مع ضمان مدى الحياة على الزراعة",
    },
    {
      icon: "smile",
      title: "تقويم الأسنان",
      description: "حلول تقويمية متنوعة تشمل التقويم الشفاف والمعدني والسرياني لتصحيح ترتيب الأسنان وتحسين الابتسامة.",
      benefit: "خيارات مرنة تناسب جميع الأعمار والاحتياجات الجمالية والوظيفية",
    },
    {
      icon: "clock",
      title: "طوارئ الأسنان",
      description: "خدمة طوارئ على مدار الساعة لحالات الألم الشديد، الكسور، والالتهابات الحادة التي تحتاج تدخلاً فورياً.",
      benefit: "استجابة فورية خلال 30 دقيقة من الاتصال بخدمة الطوارئ",
    },
    {
      icon: "award",
      title: "تجميل الأسنان",
      description: "خدمات تجميلية متقدمة تشمل الفينير، الترميمات التجميلية، وتصميم الابتسامة الرقمية لابتسامة هولايوود مثالية.",
      benefit: "تحليل رقمي للابتسامة لضمان نتائج متناسقة مع ملامح الوجه",
    },
    {
      icon: "users",
      title: "طب أسنان الأطفال",
      description: "رعاية متخصصة للأطفال من عمر سنة إلى المراهقة مع بيئة مريحة وآمنة وتقنيات مناسبة للأعمار الصغيرة.",
      benefit: "نهج وقائي يركز على التعليم وبناء عادات صحية منذ الصغر",
    },
    {
      icon: "stethoscope",
      title: "علاج جذور الأسنان",
      description: "إزالة الأنسجة الملتهبة من داخل السن وتعقينها وحشوها بمواد خاصة لإنقاذ السن من الخلع.",
      benefit: "الحفاظ على السن الطبيعي وتجنب الحاجة للخلع أو الزراعة",
    },
    {
      icon: "shield-check",
      title: "جراحة الفم",
      description: "إجراءات جراحية متخصصة تشمل خلع الأسنان المدفونة، زراعة العظام، وعلاج تشوهات الفك والوجه.",
      benefit: "إجراء جراحي دقيق باستخدام أحدث التقنيات لضمان التعافي السريع",
    },
  ];

  // Get clinics that offer each service
  const servicesWithClinics = services.map((service) => {
    const clinicsOffering = clinics.filter((clinic) =>
      clinic.services.some((s) => s.includes(service.title))
    );
    return { ...service, clinicsOffering };
  });

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50/50">
      {/* Header */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              خدماتنا
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              اكتشف مجموعة شاملة من خدمات طب الأسنان التي نقدمها من خلال شبكة عياداتنا الموثوقة
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-10">
            جميع خدمات طب الأسنان
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesWithClinics.map((service, index) => (
              <div key={index} className="group">
                <ServiceCard
                  title={service.title}
                  description={service.description}
                  icon={service.icon.toLowerCase()}
                />
                {service.clinicsOffering.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-100">
                    <p className="text-sm font-medium text-teal-700 mb-2">
                      متوفر في {service.clinicsOffering.length} عيادة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.clinicsOffering
                        .slice(0, 3)
                        .map((clinic) => (
                          <Link
                            key={clinic.id}
                            to={`/clinics/${clinic.id}`}
                            className="px-3 py-1 rounded-full bg-white text-teal-600 text-xs font-medium border border-teal-200 hover:bg-teal-100 transition-colors"
                          >
                            {clinic.name}
                          </Link>
                        ))}
                      {service.clinicsOffering.length > 3 && (
                        <span className="px-3 py-1 rounded-full bg-white text-teal-600 text-xs font-medium border border-teal-200 hover:bg-teal-100 transition-colors">
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
      <section className="bg-white border-t border-slate-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-8">
            كيف يعمل دنتال كير؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center mb-4">
                <Link to="/" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">ابحث</h3>
              <p className="text-slate-500">
                استخدم محرك البحث المتقدم لدينا للعثور على العيادات حسب الموقع، التخصص، أو التقييم
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">قارن</h3>
              <p className="text-slate-500">
                قارن بين العيادات من حيث الخدمات، الأسعار، التقييمات، وساعات العمل
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">تواصل</h3>
              <p className="text-slate-500">
                تواصل مباشرة مع العيادة عبر الهاتف أو الواتساب لحجز موعدك
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 py-16 md:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            مستعد لاكتشاف خدماتنا؟
          </h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            ابحث عن العيادة التي تقدم الخدمة التي تحتاجها واحجز موعدك الآن
          </p>
          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-teal-700 font-semibold text-lg shadow-xl shadow-teal-900/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            ابحث عن عيادة
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;