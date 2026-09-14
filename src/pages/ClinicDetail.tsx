import { useParams, Link } from "react-router-dom";
import { clinics } from "../data/clinics";
import {
  MapPin,
  Phone,
  MessageCircle,
  Facebook,
  MapPin as MapPinIcon,
  Star,
  Clock,
  CheckCircle,
  ArrowLeft,
  Heart,
} from "lucide-react";
import ContactButtons from "../components/ContactButtons";
import Rating from "../components/Rating";

const ClinicDetail = () => {
  const { id } = useParams<{ id: string }>();
  const clinic = clinics.find((c) => c.id === Number(id));

  if (!clinic) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Star className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 mb-3">
            العيادة غير موجودة
          </h2>
          <p className="text-slate-500 mb-8">
            عذراً، لم نتمكن من العثور على هذه العيادة.
          </p>
          <Link
            to="/clinics"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى العيادات
          </Link>
        </div>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${clinic.whatsapp}`;
  const phoneUrl = `tel:${clinic.phone}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.address}, ${clinic.city}, ${clinic.governorate}`)}`;

  const days = [
    { key: "saturday", label: "السبت" },
    { key: "sunday", label: "الأحد" },
    { key: "monday", label: "الإثنين" },
    { key: "tuesday", label: "الثلاثاء" },
    { key: "wednesday", label: "الأربعاء" },
    { key: "thursday", label: "الخميس" },
    { key: "friday", label: "الجمعة" },
  ];

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50/50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to="/clinics"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة إلى العيادات
        </Link>
      </div>

      {/* Hero Image */}
      <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        <img
          src={clinic.image}
          alt={clinic.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        
        {/* Floating Info Card */}
        <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-10">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
                  {clinic.name}
                </h1>
                <p className="text-teal-600 font-medium mb-2">{clinic.doctorName}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    {clinic.address}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {clinic.rating.toFixed(1)} ({clinic.reviewCount})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={phoneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/25"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-500/25"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a
                  href={clinic.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                نبذة عن العيادة
              </h2>
              <p className="text-slate-600 leading-relaxed">{clinic.description}</p>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">العنوان</p>
                    <p className="text-sm text-slate-500">{clinic.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">المدينة / المحافظة</p>
                    <p className="text-sm text-slate-500">{clinic.city}، {clinic.governorate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">رقم الهاتف</p>
                    <p className="text-sm text-slate-500">{clinic.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">واتساب</p>
                    <p className="text-sm text-slate-500">{clinic.whatsapp}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">
                الخدمات المتاحة
              </h2>
              <div className="flex flex-wrap gap-3">
                {clinic.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-medium border border-teal-100 hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Working Hours Section */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">
                ساعات العمل
              </h2>
              <div className="space-y-3">
                {days.map((day) => {
                  const hours = clinic.workingHours[day.key as keyof typeof clinic.workingHours];
                  return (
                    <div
                      key={day.key}
                      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-teal-500" />
                        <span className="font-medium text-slate-700">{day.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {hours.isOpen ? (
                          <>
                            <span className="text-sm text-slate-600 font-medium">
                              {hours.open} - {hours.close}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              مفتوح
                            </span>
                          </>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                            مغلق
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Contact */}
          <div className="space-y-6">
            {/* Rating Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">تقييم العيادة</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">
                    {clinic.rating.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-500">
                    من {clinic.reviewCount} تقييم
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 w-8">{star} نجوم</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                        style={{
                          width: `${(star / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Buttons */}
            <ContactButtons clinic={clinic} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClinicDetail;