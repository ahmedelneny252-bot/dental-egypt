import { Search, MapPin, User, Stethoscope } from "lucide-react";

const SearchBar = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
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
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            ابحث
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;