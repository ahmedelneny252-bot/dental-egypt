import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [clinicId, setClinicId] = useState("");

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get clinic ID
  const getClinic = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/doctor/login";
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (error || !profile?.clinic_id) {
      console.error(error);
      setError("Could not load clinic information.");
      setLoading(false);
      return;
    }

    setClinicId(profile.clinic_id);

    await loadServices(profile.clinic_id);
  };

  // Load services
  const loadServices = async (clinicIdValue: string) => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, price, duration")
      .eq("clinic_id", clinicIdValue)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    getClinic();
  }, []);

  // Add service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!clinicId) {
      setError("Clinic not found.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter service name.");
      return;
    }

    if (!price) {
      setError("Please enter service price.");
      return;
    }

    const { error } = await supabase.from("services").insert({
      clinic_id: clinicId,
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      duration: duration ? Number(duration) : null,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setSuccess("Service added successfully!");

    setName("");
    setDescription("");
    setPrice("");
    setDuration("");

    setShowForm(false);

    await loadServices(clinicId);
  };

  // Delete service
  const handleDeleteService = async (serviceId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("clinic_id", clinicId);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setSuccess("Service deleted successfully!");

    await loadServices(clinicId);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center pt-24">
        <div className="rounded-2xl bg-white p-10 shadow-lg">
          <p className="text-lg font-semibold text-slate-900">
            Loading services...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 pb-12 pt-32">
      <div className="mx-auto w-full max-w-7xl">

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Services
              </h1>

              <p className="mt-3 text-lg text-slate-600">
                Add and manage your clinic services.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setError("");
                setSuccess("");
              }}
              className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-teal-700"
            >
              + Add Service
            </button>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-green-700">
            {success}
          </div>
        )}

        {/* Add Service Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">

            <div className="mb-8 flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Add New Service
                </h2>

                <p className="mt-2 text-slate-600">
                  Adding services is optional. You can skip this section.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

            </div>

            <form
              onSubmit={handleAddService}
              className="grid gap-6 md:grid-cols-2"
            >

              {/* Service Name */}
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Service Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dental Cleaning"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 500"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Duration (minutes)
                </label>

                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500"
                />
              </div>

              {/* Submit */}
              <div className="md:col-span-2">

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 px-6 py-4 text-lg font-semibold text-white shadow-md hover:bg-teal-700"
                >
                  Add Service
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Services List */}
        <div className="rounded-2xl bg-white shadow-md">

          <div className="border-b border-slate-200 p-8">

            <h2 className="text-2xl font-bold text-slate-900">
              Your Services
            </h2>

            <p className="mt-2 text-slate-600">
              Services are optional. You can leave this section empty.
            </p>

          </div>

          {/* No Services */}
          {services.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <span className="text-2xl">🦷</span>
              </div>

              <p className="text-lg font-semibold text-slate-700">
                No services added yet
              </p>

              <p className="mt-2 text-slate-500">
                Add services only if you need them.
              </p>

            </div>
          ) : (

            /* Services Table */
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Service
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Description
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Duration
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {services.map((service) => (

                    <tr
                      key={service.id}
                      className="border-t border-slate-100"
                    >

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {service.name}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {service.description || "-"}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {service.price} EGP
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {service.duration
                          ? `${service.duration} min`
                          : "-"}
                      </td>

                      <td className="px-6 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteService(service.id)
                          }
                          className="rounded-lg bg-red-50 px-4 py-2 font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Services;

