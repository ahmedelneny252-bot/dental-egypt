import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const DoctorRegister = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Create doctor account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setError("Could not create user.");
      return;
    }

    // Create clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert({
        name: clinicName,
      })
      .select()
      .single();

    if (clinicError) {
      setError(clinicError.message);
      return;
    }

    // Create doctor profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        name,
        email,
        clinic_id: clinic.id,
      });

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setSuccess("Account created successfully!");

    setTimeout(() => {
      navigate("/doctor/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-teal-700 mb-2">
          Doctor Registration
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Create your DentalCare account
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Doctor Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="text"
            placeholder="Clinic Name"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-3"
          />

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700"
          >
            Create Account
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 text-green-600 text-sm">
            {success}
          </p>
        )}

        <div className="mt-6 text-center border-t pt-5">
          <p className="text-gray-500">
            Already have an account?
          </p>

          <Link
            to="/doctor/login"
            className="text-teal-600 font-semibold hover:text-teal-700"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;