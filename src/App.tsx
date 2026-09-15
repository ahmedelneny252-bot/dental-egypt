import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Public Pages
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import ClinicDetail from "./pages/ClinicDetail";
import BookAppointment from "./pages/BookAppointment";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PublicServices from "./pages/Services";

// Doctor Pages
import DoctorDashboard from "./DoctorDashboard";
import DoctorRegister from "./DoctorRegister";
import DoctorLogin from "./DoctorLogin";

import Patients from "./Patients";
import PatientDetails from "./PatientDetails";
import PrescriptionPrint from "./PrescriptionPrint";
import Appointments from "./Appointments";
import DoctorServices from "./Services";
import ClinicProfile from "./ClinicProfile";
import Reviews from "./Reviews";
import DoctorNotifications from "./DoctorNotifications";

// Patient Pages
import PatientRegister from "./PatientRegister";
import PatientLogin from "./PatientLogin";
import PatientAppointments from "./PatientAppointments";
import PatientNotifications from "./PatientNotifications";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">

        <div className="print:hidden">
          <Navbar />
        </div>

        <main className="flex-1">
          <Routes>

            {/* Public Routes */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/clinics"
              element={<Clinics />}
            />

            <Route
              path="/clinics/:id"
              element={<ClinicDetail />}
            />

            <Route
              path="/clinics/:id/book"
              element={<BookAppointment />}
            />

            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/contact"
              element={<Contact />}
            />

            <Route
              path="/services"
              element={<PublicServices />}
            />

            {/* Doctor Routes */}

            <Route
              path="/doctor/register"
              element={<DoctorRegister />}
            />

            <Route
              path="/doctor/login"
              element={<DoctorLogin />}
            />

            <Route
              path="/doctor/dashboard"
              element={<DoctorDashboard />}
            />

            <Route
              path="/doctor/patients"
              element={<Patients />}
            />

            <Route
              path="/doctor/patients/:id"
              element={<PatientDetails />}
            />

            {/* IMPORTANT: Prescription Print Route */}

            <Route
              path="/doctor/prescriptions/:id/print"
              element={<PrescriptionPrint />}
            />

            <Route
              path="/doctor/appointments"
              element={<Appointments />}
            />

            <Route
              path="/doctor/services"
              element={<DoctorServices />}
            />

            <Route
              path="/doctor/clinic-profile"
              element={<ClinicProfile />}
            />

            <Route
              path="/doctor/reviews"
              element={<Reviews />}
            />

            <Route
              path="/doctor/notifications"
              element={<DoctorNotifications />}
            />

            {/* Patient Routes */}

            <Route
              path="/patient/register"
              element={<PatientRegister />}
            />

            <Route
              path="/patient/login"
              element={<PatientLogin />}
            />

            <Route
              path="/patient/appointments"
              element={<PatientAppointments />}
            />

            <Route
              path="/patient/notifications"
              element={<PatientNotifications />}
            />

            {/* Unknown Route */}

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </main>

        <div className="print:hidden">
          <Footer />
        </div>

      </div>
    </Router>
  );
}

export default App;













