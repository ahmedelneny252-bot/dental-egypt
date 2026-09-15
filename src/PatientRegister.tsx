import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const PatientRegister = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizeEgyptianPhone = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");

    if (cleaned.startsWith("+20")) {
      return cleaned;
    }

    if (cleaned.startsWith("20")) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith("0")) {
      return `+20${cleaned.substring(1)}`;
    }

    return cleaned;
  };

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    const normalizedPhone =
      normalizeEgyptianPhone(phone);

    setLoading(true);

    /*
     * Create an internal email for Supabase Auth.
     *
     * The patient never sees or enters this email.
     */
    const internalEmail = `patient_${crypto.randomUUID()}@dentalcare.local`;

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email: internalEmail,
        password,
      });

    if (signUpError) {
      console.error(signUpError);
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(
        "Could not create your account."
      );
      setLoading(false);
      return;
    }

    /*
     * Create patient record.
     */
    const { error: patientError } =
      await supabase
        .from("patients")
        .insert({
          user_id: data.user.id,
          name: name.trim(),
          phone: normalizedPhone,
          email: null,
          login_email: internalEmail,
          medical_notes: null,
        });

    if (patientError) {
      console.error(patientError);

      setError(
        "Your account was created, but your patient profile could not be created. Please contact support."
      );

      setLoading(false);
      return;
    }

    setSuccess(
      "Patient account created successfully!"
    );

    setTimeout(() => {
      navigate("/patient/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 pb-12 pt-28">
      <div className="mx-auto max-w-md">

        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-slate-900">
            Create Patient Account
          </h1>

          <p className="mt-2 text-slate-600">
            Create your account to manage your appointments.
          </p>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >

            {/* Name */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

            </div>

            {/* Phone */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="01012345678"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <p className="mt-1 text-xs text-slate-400">
                Egyptian phone numbers are supported.
              </p>

            </div>

            {/* Password */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          <div className="mt-6 text-center">

            <p className="text-sm text-slate-600">
              Already have an account?
            </p>

            <Link
              to="/patient/login"
              className="mt-2 inline-block font-semibold text-teal-600 hover:text-teal-700"
            >
              Patient Login
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PatientRegister;



