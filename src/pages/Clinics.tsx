import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
  slug: string | null;
};

const Clinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadClinics = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("clinics")
        .select(`
          id,
          name,
          logo_url,
          phone,
          whatsapp,
          address,
          description,
          slug
        `)
        .order("name", { ascending: true });

      if (error) {
        console.error("Clinics error:", error);
        setError(error.message);
      } else {
        setClinics(data || []);
      }

      setLoading(false);
    };

    loadClinics();
  }, []);

  const filteredClinics = clinics.filter((clinic) => {
    const searchText = search.toLowerCase();

    return (
      clinic.name.toLowerCase().includes(searchText) ||
      clinic.address?.toLowerCase().includes(searchText)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-24">
        <p className="text-slate-600">
          Loading clinics...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 pt-32">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Find a Dental Clinic
          </h1>

          <p className="mt-3 text-slate-600">
            Find the right dental clinic and explore its services.
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mb-10 max-w-2xl">
          <input
            type="text"
            placeholder="Search by clinic name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}
        {filteredClinics.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No clinics found
            </h2>

            <p className="mt-2 text-slate-500">
              Try another search or check again later.
            </p>
          </div>
        ) : (
          /* Clinics Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {filteredClinics.map((clinic) => (
              <div
                key={clinic.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* Logo */}
                <div className="flex h-48 items-center justify-center bg-slate-100">
                  {clinic.logo_url ? (
                    <img
                      src={clinic.logo_url}
                      alt={clinic.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-3xl font-bold text-teal-700">
                      {clinic.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">

                  <h2 className="text-xl font-bold text-slate-900">
                    {clinic.name}
                  </h2>

                  {clinic.address && (
                    <p className="mt-2 text-sm text-slate-500">
                      📍 {clinic.address}
                    </p>
                  )}

                  {clinic.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {clinic.description}
                    </p>
                  )}

                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="mt-5 inline-block rounded-xl bg-teal-600 px-5 py-2.5 font-medium text-white transition hover:bg-teal-700"
                  >
                    View Clinic
                  </Link>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default Clinics;

