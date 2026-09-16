
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Patient = {
  id: string;
  name: string;
};

type Payment = {
  id: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
  patient: {
    name: string;
  } | null;
};

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [clinicId, setClinicId] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getClinic = async () => {
    setLoading(true);
    setError("");

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

    await Promise.all([
      loadPatients(profile.clinic_id),
      loadPayments(profile.clinic_id),
    ]);

    setLoading(false);
  };

  const loadPatients = async (clinicIdValue: string) => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name")
      .eq("clinic_id", clinicIdValue)
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setPatients(data || []);
  };

  const loadPayments = async (clinicIdValue: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        patient_id,
        amount,
        payment_method,
        payment_date,
        notes,
        created_at,
        patient:patients (
          name
        )
      `)
      .eq("clinic_id", clinicIdValue)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    const formattedPayments: Payment[] = (data || []).map((payment) => ({
      id: payment.id,
      patient_id: payment.patient_id,
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      notes: payment.notes,
      created_at: payment.created_at,
      patient: Array.isArray(payment.patient)
        ? payment.patient[0] || null
        : payment.patient || null,
    }));

    setPayments(formattedPayments);
  };

  useEffect(() => {
    getClinic();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!clinicId) {
      setError("Clinic not found.");
      return;
    }

    if (!patientId) {
      setError("Please select a patient.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const { error } = await supabase.from("payments").insert({
      clinic_id: clinicId,
      patient_id: patientId,
      amount: Number(amount),
      payment_method: paymentMethod,
      payment_date:
        paymentDate || new Date().toISOString().split("T")[0],
      notes: notes || null,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setSuccess("Payment added successfully.");

    setPatientId("");
    setAmount("");
    setPaymentMethod("Cash");
    setPaymentDate("");
    setNotes("");

    setShowForm(false);

    await loadPayments(clinicId);
  };

  const totalPayments = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading payments...
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
              Payments
            </h1>

            <p className="mt-2 text-slate-600">
              Manage patient payments and clinic revenue.
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
            {showForm ? "Cancel" : "+ Add Payment"}
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

        {/* Statistics */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Payments
            </p>

            <p className="mt-2 text-3xl font-bold text-teal-600">
              {totalPayments.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Payment Records
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {payments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Patients
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {patients.length}
            </p>
          </div>

        </div>

        {/* Add Payment Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-2xl font-semibold text-slate-900">
              Add New Payment
            </h2>

            <form
              onSubmit={handleAddPayment}
              className="grid gap-4 md:grid-cols-2"
            >

              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
              >
                <option value="">
                  Select Patient
                </option>

                {patients.map((patient) => (
                  <option
                    key={patient.id}
                    value={patient.id}
                  >
                    {patient.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-500"
              >
                <option value="Cash">
                  Cash
                </option>

                <option value="Card">
                  Card
                </option>

                <option value="Vodafone Cash">
                  Vodafone Cash
                </option>

                <option value="Instapay">
                  Instapay
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              <input
                type="date"
                value={paymentDate}
                onChange={(e) =>
                  setPaymentDate(e.target.value)
                }
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
              />

              <textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                className="min-h-28 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 md:col-span-2"
              />

              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 md:col-span-2"
              >
                Add Payment
              </button>

            </form>
          </div>
        )}

        {/* Payments List */}
        <div className="rounded-2xl bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Payment History
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center">

              <p className="text-slate-500">
                No payments yet.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Click "Add Payment" to record the first payment.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">
                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Method
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Notes
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-slate-100"
                    >

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {payment.patient?.name || "-"}
                      </td>

                      <td className="px-6 py-4 font-semibold text-teal-600">
                        {Number(payment.amount).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {payment.payment_method || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {payment.payment_date || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {payment.notes || "-"}
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

export default Payments;


