import { Sparkles, Shield, Heart, Smile, Clock, Award } from "lucide-react";

const ServiceCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    sparkles: <Sparkles className="w-6 h-6" />,
    shield: <Shield className="w-6 h-6" />,
    heart: <Heart className="w-6 h-6" />,
    smile: <Smile className="w-6 h-6" />,
    clock: <Clock className="w-6 h-6" />,
    award: <Award className="w-6 h-6" />,
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center text-teal-600 mb-4">
        {iconMap[icon] || iconMap.sparkles}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
};

export default ServiceCard;