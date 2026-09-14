const DoctorDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Doctor Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Manage your dental clinic from one place.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Patients</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">128</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Appointments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">24</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Services</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">8</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Subscription</p>
            <p className="mt-2 text-xl font-bold text-teal-600">Pro Plan</p>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Clinic Profile
            </h2>
            <p className="mt-2 text-slate-600">
              Update your clinic name, address, phone, WhatsApp and working
              hours.
            </p>
            <button className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              Manage Clinic
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Appointments
            </h2>
            <p className="mt-2 text-slate-600">
              View and manage your upcoming patient appointments.
            </p>
            <button className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              View Appointments
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Patients
            </h2>
            <p className="mt-2 text-slate-600">
              Manage your patient information and records.
            </p>
            <button className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              View Patients
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Services
            </h2>
            <p className="mt-2 text-slate-600">
              Add and manage the dental services offered by your clinic.
            </p>
            <button className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              Manage Services
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Reviews
            </h2>
            <p className="mt-2 text-slate-600">
              See what patients are saying about your clinic.
            </p>
            <button className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              View Reviews
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Subscription
            </h2>
            <p className="mt-2 text-slate-600">
              Manage your plan and subscription.
            </p>
            <button className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              Manage Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
