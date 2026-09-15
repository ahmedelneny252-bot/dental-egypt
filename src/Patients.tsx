import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
};

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [clinicId, setClinicId] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get doctor's clinic
  const getClinic = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/doctor/login";
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      setError("Could not load clinic information.");
      setLoading(false);
      return;
    }

    if (!profile?.clinic_id) {
      setError("No clinic is connected to this doctor.");
      setLoading(false);
      return;
    }

    setClinicId(profile.clinic_id);

    await loadPatients(profile.clinic_id);
  };

  // Load patients
  const loadPatients = async (clinicIdValue: string) => {
    const { data, error: patientsError } = await supabase
      .from("patients")
      .select(
        "id, name, phone, age, gender, address, medical_notes, created_at"
      )
      .eq("clinic_id", clinicIdValue)
      .order("created_at", { ascending: false });

    if (patientsError) {
      console.error(patientsError);
      setError(patientsError.message);
      setLoading(false);
      return;
    }

    setPatients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    getClinic();
  }, []);

  // Add patient
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!clinicId) {
      setError("Clinic not found.");
      return;
    }

    const { error: insertError } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinicId,
        name,
        phone: phone || null,
        age: age ? Number(age) : null,
        gender: gender || null,
        address: address || null,
        medical_notes: medicalNotes || null,
      });

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
      return;
    }

    setSuccess("Patient added successfully!");

    // Clear form
    setName("");
    setPhone("");
    setAge("");
    setGender("");
    setAddress("");
    setMedicalNotes("");

    setShowForm(false);

    // Reload patients
    await loadPatients(clinicId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28">
        <p className="text-slate-600">
          Loading patients...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-12 px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Patients
            </h1>

            <p className="mt-2 text-slate-600">
              Manage your clinic patients.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
          >
            {showForm ? "Cancel" : "+ Add Patient"}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-600">
            {success}
          </div>
        )}

        {/* Add Patient Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900">
              Add New Patient
            </h2>

            <form
              onSubmit={handleAddPatient}
              className="grid gap-4 md:grid-cols-2"
            >

              <input
                type="text"
                placeholder="Patient Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <input
                type="number"
                placeholder="Age"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
              >
                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>
              </select>

              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <textarea
                placeholder="Medical Notes"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="min-h-32 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 md:col-span-2"
              />

              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 md:col-span-2"
              >
                Add Patient
              </button>

            </form>
          </div>
        )}

        {/* Patients List */}
        <div className="rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Patient List
            </h2>
          </div>

          {patients.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500">
                No patients yet.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Click "Add Patient" to add your first patient.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Name
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Phone
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Age
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Gender
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Address
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Medical Notes
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {patients.map((patient) => (

                    <tr
                      key={patient.id}
                      className="border-t border-slate-100"
                    >

                      {/* Patient Name */}
                      <td className="px-6 py-4">

                        <Link
                          to={`/doctor/patients/${patient.id}`}
                          className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          {patient.name}
                        </Link>

                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-slate-600">
                        {patient.phone || "-"}
                      </td>

                      {/* Age */}
                      <td className="px-6 py-4 text-slate-600">
                        {patient.age !== null
                          ? patient.age
                          : "-"}
                      </td>

                      {/* Gender */}
                      <td className="px-6 py-4 text-slate-600">
                        {patient.gender || "-"}
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4 text-slate-600">
                        {patient.address || "-"}
                      </td>

                      {/* Medical Notes */}
                      <td className="px-6 py-4 text-slate-600">
                        {patient.medical_notes || "-"}
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

export default Patients;






