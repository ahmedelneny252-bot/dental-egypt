import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const PatientLogin = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!phone.trim() || !password) {
      setError(
        "Please enter your phone number and password."
      );
      return;
    }

    setLoading(true);

    const normalizedPhone =
      normalizeEgyptianPhone(phone);

    /*
     * Find the patient using their phone number.
     */
    const { data: patient, error: patientError } =
      await supabase
        .from("patients")
        .select("id, login_email")
        .eq("phone", normalizedPhone)
        .maybeSingle();

    if (patientError) {
      console.error(
        "Patient lookup error:",
        patientError
      );

      setError(
        "Could not find your patient account."
      );

      setLoading(false);
      return;
    }

    if (!patient) {
      setError(
        "No patient account was found with this phone number."
      );

      setLoading(false);
      return;
    }

    if (!patient.login_email) {
      setError(
        "Your patient account is missing login information. Please contact support."
      );

      setLoading(false);
      return;
    }

    /*
     * Login to Supabase Auth using the internal email.
     *
     * The patient never sees or enters this email.
     */
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: patient.login_email,
        password,
      });

    if (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      setError(
        "Invalid phone number or password."
      );

      setLoading(false);
      return;
    }

    navigate("/patient/appointments");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 pb-12 pt-28">

      <div className="mx-auto max-w-md">

        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-slate-900">
            Patient Login
          </h1>

          <p className="mt-2 text-slate-600">
            Login using your phone number and password.
          </p>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

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
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          <div className="mt-6 text-center">

            <p className="text-sm text-slate-600">
              Don't have an account?
            </p>

            <Link
              to="/patient/register"
              className="mt-2 inline-block font-semibold text-teal-600 hover:text-teal-700"
            >
              Create Patient Account
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PatientLogin;






