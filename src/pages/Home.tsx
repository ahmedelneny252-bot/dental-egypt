import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  Star,
  MapPin,
  ArrowRight,
  CheckCircle,
  Users,
  Smile,
  Shield,
  Clock,
} from "lucide-react";
import { clinics } from "../data/clinics";
import SearchBar from "../components/SearchBar";
import ClinicCard from "../components/ClinicCard";
import ServiceCard from "../components/ServiceCard";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const topClinics = [...clinics]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const stats = [
    { icon: Users, value: "200+", label: "عيادة موثوقة" },
    { icon: Smile, value: "10K+", label: "مرضى راضين" },
    { icon: Shield, value: "99%", label: "رضا المرضى" },
    { icon: Clock, value: "24/7", label: "خدمة متاحة" },
  ];

  const services = [
    {
      icon: "sparkles",
      title: "تبييض الأسنان",
      description: "تبييض احترافي بآخر التقنيات لابتسامة مشرقة وواثقة.",
    },
    {
      icon: "shield",
      title: "وقاية من التسوس",
      description: "علاجات وقائية شاملة لحماية أسنانك من التسوس والأمراض.",
    },
    {
      icon: "heart",
      title: "زراعة الأسنان",
      description: "زراعة أسنان متقدمة باستخدام أحدث التقنيات الطبية.",
    },
    {
      icon: "smile",
      title: "تقويم الأسنان",
      description: "حلول تقويمية متنوعة تشمل التقويم الشفاف والمعدني.",
    },
    {
      icon: "clock",
      title: "طوارئ الأسنان",
      description: "خدمة طوارئ على مدار الساعة لحالات الألم والإصابات.",
    },
    {
      icon: "award",
      title: "تجميل الأسنان",
      description: "خدمات تجميلية متقدمة لابتسامة هولايوود مثالية.",
    },
  ];

  return (
    <div className="pt-16 lg:pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4" />
              منصة موثوقة لاختيار عيادات الأسنان
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6">
              ابحث عن أفضل{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">
                عيادة أسنان
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
              اكتشف عيادات أسنان موثوقة في مصر، قارن الخدمات، واحجز موعدك بسهولة مع دنتال كير
            </p>
            
            {/* Search Bar */}
            <div className="mb-8">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/clinics?search=${encodeURIComponent(searchQuery)}`);
                  } else {
                    navigate("/clinics");
                  }
                }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-lg shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                ابحث عن عيادة
              </button>
              <Link
                to="/clinics"
                className="px-8 py-4 rounded-xl bg-white text-slate-700 font-semibold text-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-300 flex items-center gap-2"
              >
                عرض جميع العيادات
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center text-teal-600 mx-auto mb-3">
                  <stat.icon className="w-7 h-7" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Clinics Section */}
      <section className="bg-slate-50/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              أفضل العيادات المميزة
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              اكتشف أعرق العيادات التي اختارها آلاف المرضى
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topClinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/clinics"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300"
            >
              عرض جميع العيادات
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              خدماتنا المتكاملة
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              نقدم مجموعة واسعة من خدمات طب الأسنان باستخدام أحدث التقنيات
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 py-16 md:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            هل تبحث عن عيادة أسنان موثوقة؟
          </h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            ابدأ رحلتك الآن واعثر على أفضل عيادات الأسنان في مصر مع دنتال كير
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

export default Home;