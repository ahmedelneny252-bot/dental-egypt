import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X, ChevronDown, Star, Users, MapPin, Stethoscope } from "lucide-react";
import { clinics, governorates, allServices } from "../data/clinics";
import ClinicCard from "../components/ClinicCard";
import Filters from "../components/Filters";

const Clinics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Filter clinics
  const filteredClinics = useMemo(() => {
    let result = [...clinics];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(query) ||
          clinic.doctorName.toLowerCase().includes(query) ||
          clinic.city.toLowerCase().includes(query) ||
          clinic.governorate.toLowerCase().includes(query) ||
          clinic.services.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Governorate filter
    if (selectedGovernorate) {
      result = result.filter((clinic) => clinic.governorate === selectedGovernorate);
    }

    // City filter
    if (selectedCity) {
      result = result.filter((clinic) => clinic.city === selectedCity);
    }

    // Service filter
    if (selectedService) {
      result = result.filter((clinic) => clinic.services.includes(selectedService));
    }

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, selectedGovernorate, selectedCity, selectedService, sortBy]);

  const hasActiveFilters = selectedGovernorate || selectedCity || selectedService || sortBy !== "default";

  const clearFilters = () => {
    setSelectedGovernorate("");
    setSelectedCity("");
    setSelectedService("");
    setSortBy("default");
  };

  const clearAll = () => {
    setSearchQuery("");
    clearFilters();
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50/50">
      {/* Page Header */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              عيادات الأسنان
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              اكتشف أفضل عيادات الأسنان في مصر، قارن الخدمات والتقييمات، واحجز موعدك بسهولة
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto mb-8">
            <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-1 p-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <Search className="w-5 h-5 text-teal-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="ابحث عن عيادة، طبيب، مدينة، أو خدمة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-slate-700 placeholder:text-slate-400 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      setSearchParams({ search: searchQuery });
                    } else {
                      setSearchParams({});
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  ابحث
                </button>
              </div>
            </div>
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  showFilters
                    ? "bg-teal-500 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:border-teal-200"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>الفلاتر</span>
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  مسح الفلاتر
                </button>
              )}
            </div>

            <div className="text-sm text-slate-500">
              {filteredClinics.length} عيادة متاحة
            </div>
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      {showFilters && (
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Filters
              selectedGovernorate={selectedGovernorate}
              setSelectedGovernorate={setSelectedGovernorate}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              sortBy={sortBy}
              setSortBy={setSortBy}
              governorates={governorates}
              services={allServices}
            />
          </div>
        </section>
      )}

      {/* Results */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredClinics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                لا توجد عيادات مطابقة
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                لم نتمكن من العثور على عيادات تطابق معايير البحث. جرب تغيير الفلاتر أو البحث بكلمات مختلفة.
              </p>
              <button
                onClick={clearAll}
                className="px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Clinics;