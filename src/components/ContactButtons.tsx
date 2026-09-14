import { Phone, MessageCircle, Facebook, MapPin } from "lucide-react";

const ContactButtons = ({ clinic }: { clinic: any }) => {
  const whatsappUrl = `https://wa.me/${clinic.whatsapp}`;
  const phoneUrl = `tel:${clinic.phone}`;
  const facebookUrl = clinic.facebook;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.address}, ${clinic.city}, ${clinic.governorate}`)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {/* Call Button */}
        <a
          href={phoneUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-lg shadow-lg shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Phone className="w-5 h-5" />
          <span>اتصل بالعيادة</span>
        </a>
        
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-green-500 text-white font-semibold text-lg shadow-lg shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageCircle className="w-5 h-5" />
          <span>مراسلة على واتساب</span>
        </a>
        
        {/* Facebook Button */}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Facebook className="w-5 h-5" />
          <span>زيارة صفحة الفيسبوك</span>
        </a>
        
        {/* Directions Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-800 text-white font-semibold text-lg shadow-lg shadow-slate-800/25 hover:shadow-2xl hover:shadow-slate-800/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <MapPin className="w-5 h-5" />
          <span>الحصول على الاتجاهات</span>
        </a>
      </div>
    </div>
  );
};

export default ContactButtons;