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
} from "lucide-react";

const About = () => {
  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50/50">
      {/* Header */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              من نحن
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              تعرف على رؤيتنا ومهمتنا في دنتال كير
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">مهمتنا</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                نهدف إلى ربط المرضى بأفضل عيادات الأسنان في مصر من خلال منصة موثوقة وسهلة الاستخدام، مع توفير معلومات شاملة تساعدهم على اتخاذ قرارات مستنيرة بشأن صحتهم الفموية.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">توفير معلومات دقيقة ومحدثة عن العيادات</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">تسهيل عملية البحث والحجز</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">ضمان الشفافية والمصداقية</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">تحسين تجربة المريض في مجال طب الأسنان</span>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white fill-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">رؤيتنا</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                أن نكون المنصة الرائدة في مجال طب الأسنان في مصر والشرق الأوسط، ونحدث تحولاً إيجابياً في كيفية الوصول إلى خدمات الأسنان عالية الجودة.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">التوسع إلى جميع محافظات مصر</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">توفير خدمة على مدار الساعة</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">دمج أحدث التقنيات والذكاء الاصطناعي</span>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">ضمان أعلى معايير الجودة والسلامة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white border-t border-slate-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-8">
            لماذا تختار دنتال كير؟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* For Patients */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Smile className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">للمرضى</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>بحث سهل وسريع عن العيادات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>مقارنة الخدمات والتقييمات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>معلومات تفصيلية عن الأطباء والخدمات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>الاتصال المباشر عبر الهاتف أو الواتساب</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>الحصول على الاتجاهات بسهولة</span>
                </li>
              </ul>
            </div>

            {/* For Clinics */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">للعيادات</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>زيادة الظهور والوصول إلى المرضى</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>عرض الخدمات والتخصصات بدقة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>بناء الثقة من خلال التقييمات الحقيقية</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>تسهيل عملية التواصل مع المرضى</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>تحليل البيانات لتحسين الخدمات</span>
                </li>
              </ul>
            </div>

            {/* Platform Features */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">مميزات المنصة</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>بيانات محدثة ودقيقة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>واجهة مستخدم سلسة وسهلة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>دعم فني متواصل</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>متوافق مع جميع الأجهزة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-1 flex-shrink-0" />
                  <span>أمان وخصوصية عالية</span>
                </li>
              </ul>
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
            مستعد لاكتشاف أفضل عيادات الأسنان؟
          </h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            ابدأ رحلتك الآن مع دنتال كير واعثر على العيادة المثالية لاحتياجاتك
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

export default About;