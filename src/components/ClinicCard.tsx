import { Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
  Facebook,
  ArrowUpRight,
  Heart,
} from "lucide-react";

const ClinicCard = ({ clinic }: { clinic: any }) => {
  const whatsappUrl = `https://wa.me/${clinic.whatsapp}`;
  const phoneUrl = `tel:${clinic.phone}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-slate-200/60 border border-slate-100 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={clinic.image}
          alt={clinic.name}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/60 via-teal-950/10 to-transparent" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 text-teal-700 text-sm font-semibold shadow-md">
          <Star className="w-4 h-4 fill-teal-500 text-teal-500" />
          {clinic.rating.toFixed(1)}
        </div>
        <div className="absolute bottom-4 left-4 bg-teal-500/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm font-semibold">
          {clinic.governorate} · {clinic.city}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-snug mb-1">
              {clinic.name}
            </h3>
            <p className="text-sm text-teal-600 font-medium mb-1">
              {clinic.doctorName}
            </p>
          </div>
          <Heart className="w-5 h-5 text-slate-300 hover:text-red-500 hover:fill-red-500 transition-all duration-200 cursor-pointer" />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
          <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span className="truncate">{clinic.address}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
          <span className="text-amber-400 font-bold">
            <Star className="w-4 h-4 fill-amber-400" />
          </span>
          <span className="font-semibold text-slate-700">{clinic.rating.toFixed(1)}</span>
          <span className="text-slate-400">({clinic.reviewCount} تقييم)</span>
        </div>

        {/* Services */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-400 mb-2">الخدمات المتاحة</p>
          <div className="flex flex-wrap gap-1.5">
            {clinic.services.slice(0, 3).map((service: string) => (
              <span
                key={service}
                className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-medium border border-teal-100"
              >
                {service}
              </span>
            ))}
            {clinic.services.length > 3 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                +{clinic.services.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* ID */}
        <p className="text-xs text-slate-400 mb-4">رقم العيادة: #{clinic.id}</p>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100">
          <a
            href={phoneUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-semibold"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <Link
            to={`/clinics/${clinic.id}`}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors text-sm font-semibold"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;