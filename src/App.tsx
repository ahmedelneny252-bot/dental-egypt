import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Public
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import ClinicDetail from "./pages/ClinicDetail";
import BookAppointment from "./pages/BookAppointment";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PublicServices from "./pages/Services";

// Doctor
import DoctorDashboard from "./DoctorDashboard";
import DoctorRegister from "./DoctorRegister";
import DoctorLogin from "./DoctorLogin";
import DoctorSettings from "./DoctorSettings";
import Subscription from "./Subscription";
import Patients from "./Patients";
import PatientDetails from "./PatientDetails";
import PrescriptionPrint from "./PrescriptionPrint";
import Appointments from "./Appointments";
import TodayAppointments from "./TodayAppointments";
import DoctorServices from "./Services";
import ClinicProfile from "./ClinicProfile";
import Reviews from "./Reviews";
import DoctorNotifications from "./DoctorNotifications";
import Payments from "./Payments";
import Reports from "./Reports";

// Patient
import PatientRegister from "./PatientRegister";
import PatientLogin from "./PatientLogin";
import PatientDashboard from "./PatientDashboard";
import PatientAppointments from "./PatientAppointments";
import PatientNotifications from "./PatientNotifications";
import PatientPayments from "./PatientPayments";
import PatientMedicalFile from "./PatientMedicalFile";

const DOCTOR_STANDALONE_LAYOUT_PATHS = [
  "/doctor/register",
  "/doctor/login",
];

const STANDALONE_DASHBOARD_PATHS = [
  "/patient/dashboard",
];

const STANDALONE_DASHBOARD_PATTERNS = [
  /^\/clinics\/[^/]+\/book$/,
];

const isStandaloneDashboardPath = (pathname: string) =>
  (pathname.startsWith("/doctor/") &&
    !DOCTOR_STANDALONE_LAYOUT_PATHS.includes(pathname)) ||
  STANDALONE_DASHBOARD_PATHS.includes(pathname) ||
  STANDALONE_DASHBOARD_PATTERNS.some((pattern) =>
    pattern.test(pathname)
  );

function AppLayout() {
  const location = useLocation();

  const isStandalone = isStandaloneDashboardPath(
    location.pathname
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      {!isStandalone && <Navbar />}

      <main>
        <Routes>
          {/* ==================== Public ==================== */}

          <Route path="/" element={<Home />} />

          <Route path="/clinics" element={<Clinics />} />

          <Route
            path="/clinics/:id"
            element={<ClinicDetail />}
          />

          <Route
            path="/clinics/:id/book"
            element={<BookAppointment />}
          />

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />

          <Route
            path="/services"
            element={<PublicServices />}
          />

          {/* ==================== Doctor ==================== */}

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
            path="/doctor/settings"
            element={<DoctorSettings />}
          />

          <Route
            path="/doctor/subscription"
            element={<Subscription />}
          />

          <Route
            path="/doctor/patients"
            element={<Patients />}
          />

          <Route
            path="/doctor/patients/:id"
            element={<PatientDetails />}
          />

          <Route
            path="/doctor/prescriptions/:id/print"
            element={<PrescriptionPrint />}
          />

          {/* صفحة المواعيد الرئيسية */}
          <Route
            path="/doctor/appointments"
            element={<Appointments />}
          />

          {/* مواعيد اليوم - صفحة مستقلة */}
          <Route
            path="/doctor/today-appointments"
            element={<TodayAppointments />}
          />

          {/* مواعيد هذا الأسبوع */}
          <Route
            path="/doctor/week-appointments"
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

          <Route
            path="/doctor/payments"
            element={<Payments />}
          />

          <Route
            path="/doctor/reports"
            element={<Reports />}
          />

          {/* ==================== Patient ==================== */}

          <Route
            path="/patient/register"
            element={<PatientRegister />}
          />

          <Route
            path="/patient/login"
            element={<PatientLogin />}
          />

          <Route
            path="/patient/dashboard"
            element={<PatientDashboard />}
          />

          <Route
            path="/patient/appointments"
            element={<PatientAppointments />}
          />

          <Route
            path="/patient/notifications"
            element={<PatientNotifications />}
          />

          <Route
            path="/patient/payments"
            element={<PatientPayments />}
          />

          {/* Patient Medical File */}
          <Route
            path="/patient/medical-file"
            element={<PatientMedicalFile />}
          />

          {/* ==================== Redirects ==================== */}

          <Route
            path="/patient/book"
            element={
              <Navigate
                to="/patient/appointments"
                replace
              />
            }
          />

          <Route
            path="/offers"
            element={
              <Navigate
                to="/patient/appointments"
                replace
              />
            }
          />

          {/* ==================== 404 ==================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>

      {!isStandalone && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;







