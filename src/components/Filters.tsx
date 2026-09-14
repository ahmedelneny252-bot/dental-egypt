import { useState } from "react";
import { ChevronDown, Check, Globe, MapPin, Stethoscope, Heart } from "lucide-react";

const Filters = ({ 
  selectedGovernorate, 
  setSelectedGovernorate,
  selectedCity,
  setSelectedCity,
  selectedService,
  setSelectedService,
  sortBy,
  setSortBy,
  governorates,
  services
}: {
  selectedGovernorate: string;
  setSelectedGovernorate: (g: string) => void;
  selectedCity: string;
  setSelectedCity: (c: string) => void;
  selectedService: string;
  setSelectedService: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  governorates: string[];
  services: string[];
}) => {
  const [isGovernorateOpen, setIsGovernorateOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const cities = selectedGovernorate 
    ? ["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "الغربية", "المنوفية", "الشرقية", "الاسماعيلية", "بني سويف", "الفيوم", "منيا القمح", "أسوان", "أسيوط", "سوهاج", "قنا", "الأقصر", "الإسماعيلية", "السويس", "بورسعيد", "دمياط", "كفر الشيخ"]
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Governorate Filter */}
        <div className="relative">
          <button
            onClick={() => setIsGovernorateOpen(!isGovernorateOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700">
                {selectedGovernorate || "اختر المحافظة"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isGovernorateOpen ? "rotate-180" : ""}`} />
          </button>
          {isGovernorateOpen && (
            <div className="absolute left-0 right-0 mt-1 w-full max-h-60 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-100 z-20">
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg mb-2">
                  <Globe className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium text-teal-700">اختر المحافظة</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedGovernorate("");
                      setSelectedCity("");
                      setIsGovernorateOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      !selectedGovernorate ? "font-medium text-teal-600" : "text-slate-600"
                    }`}
                  >
                    جميع المحافظات
                  </button>
                  {governorates.map((gov) => (
                    <button
                      key={gov}
                      onClick={() => {
                        setSelectedGovernorate(gov);
                        setSelectedCity("");
                        setIsGovernorateOpen(false);
                      }}
                      className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                        selectedGovernorate === gov ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                      }`}
                    >
                      {gov}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* City Filter */}
        <div className="relative">
          <button
            onClick={() => setIsCityOpen(!isCityOpen)}
            disabled={!selectedGovernorate}
            className={`w-full flex items-center justify-between p-3 rounded-lg ${selectedGovernorate ? "bg-slate-50 hover:bg-slate-100" : "bg-slate-100/50"} transition-colors text-left pointer-events-${selectedGovernorate ? "all" : "none"} opacity-${selectedGovernorate ? "100" : "50"}`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700">
                {selectedCity || "اختر المدينة"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCityOpen ? "rotate-180" : ""}`} />
          </button>
          {isCityOpen && selectedGovernorate && (
            <div className="absolute left-0 right-0 mt-1 w-full max-h-60 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-100 z-20">
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg mb-2">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium text-teal-700">اختر المدينة</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCity("");
                      setIsCityOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      !selectedCity ? "font-medium text-teal-600" : "text-slate-600"
                    }`}
                  >
                    جميع المدن
                  </button>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsCityOpen(false);
                      }}
                      className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                        selectedCity === city ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Service Filter */}
        <div className="relative">
          <button
            onClick={() => setIsServiceOpen(!isServiceOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700">
                {selectedService || "اختر الخدمة"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isServiceOpen ? "rotate-180" : ""}`} />
          </button>
          {isServiceOpen && (
            <div className="absolute left-0 right-0 mt-1 w-full max-h-60 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-100 z-20">
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg mb-2">
                  <Stethoscope className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium text-teal-700">اختر الخدمة</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedService("");
                      setIsServiceOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      !selectedService ? "font-medium text-teal-600" : "text-slate-600"
                    }`}
                  >
                    جميع الخدمات
                  </button>
                  {services.map((service) => (
                    <button
                      key={service}
                      onClick={() => {
                        setSelectedService(service);
                        setIsServiceOpen(false);
                      }}
                      className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                        selectedService === service ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700">
                {sortBy === "rating" ? "الأعلى تقييمًا" : sortBy === "reviews" ? "الأكثر تقييمًا" : sortBy === "name" ? "الأبجدية" : "الترتيب الافتراضي"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
          </button>
          {isSortOpen && (
            <div className="absolute left-0 right-0 mt-1 w-full max-h-44 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-100 z-20">
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg mb-2">
                  <Heart className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium text-teal-700">ترتيب حسب</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSortBy("default");
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      sortBy === "default" ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                    }`}
                  >
                    الافتراضي
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("rating");
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      sortBy === "rating" ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                    }`}
                  >
                    الأعلى تقييمًا
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("reviews");
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      sortBy === "reviews" ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                    }`}
                  >
                    الأكثر تقييمًا
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("name");
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-start p-2 rounded-lg text-left text-sm hover:bg-teal-50 transition-colors ${
                      sortBy === "name" ? "font-medium text-teal-600 bg-teal-50" : "text-slate-600"
                    }`}
                  >
                    الأبجدية
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filters;