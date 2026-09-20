import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
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
import DoctorSettings from "./DoctorSettings";
import Subscription from "./Subscription";

import Patients from "./Patients";
import PatientDetails from "./PatientDetails";
import PrescriptionPrint from "./PrescriptionPrint";
import Appointments from "./Appointments";
import DoctorServices from "./Services";
import ClinicProfile from "./ClinicProfile";
import Reviews from "./Reviews";
import DoctorNotifications from "./DoctorNotifications";
import Payments from "./Payments";

// Patient Pages
import PatientRegister from "./PatientRegister";
import PatientLogin from "./PatientLogin";
import PatientDashboard from "./PatientDashboard";
//import PatientAppointments from "./PatientAppointments";
import PatientNotifications from "./PatientNotifications";
import PatientPayments from "./PatientPayments";

// ============================================================
// مسارات الداشبورد بتاعت الدكتور (كل مسارات /doctor/* ما عدا
// صفحات تسجيل الدخول/إنشاء الحساب)، وكمان صفحة داشبورد المريض
// الجديدة (/patient/dashboard) عندهم هيدر وSidebar خاص بيهم.
// الـ Navbar العام مايترندرش خالص في الـ DOM في الصفحات دي (مش
// بس بيرجع null من جواه) عشان نضمن إنه مايغطيش أي حاجة زي
// السايدبار الثابت (fixed) اللي فوقه في الـ z-index.
// ============================================================
const DOCTOR_STANDALONE_LAYOUT_PATHS = ["/doctor/register", "/doctor/login"];

const STANDALONE_DASHBOARD_PATHS = ["/patient/dashboard"];

const isStandaloneDashboardPath = (pathname: string) =>
  (pathname.startsWith("/doctor/") &&
    !DOCTOR_STANDALONE_LAYOUT_PATHS.includes(pathname)) ||
  STANDALONE_DASHBOARD_PATHS.includes(pathname);

// ============================================================
// AppLayout: بيقرر يعرض الـ Navbar والـ Footer العامين ولا لأ
// حسب المسار الحالي. لازم يكون جوه الـ Router عشان يقدر
// يستخدم useLocation.
// ============================================================
const AppLayout = () => {
  const location = useLocation();
  const hideGlobalChrome = isStandaloneDashboardPath(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      {!hideGlobalChrome && (
        <div className="print:hidden">
          <Navbar />
        </div>
      )}

      <main className="flex-1">
        <Routes>

          {/* ==================== PUBLIC ROUTES ==================== */}

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

          {/* ==================== DOCTOR ROUTES ==================== */}

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

          <Route
            path="/doctor/payments"
            element={<Payments />}
          />

          <Route
            path="/doctor/subscription"
            element={<Subscription />}
          />

          {/* ==================== PATIENT ROUTES ==================== */}
          {/*
            ملاحظة: صفحة الحجز الخاصة بالمريض بقت جوه
            /patient/appointments بتبويباتها الأربعة
            (مواعيدي - حجز موعد - العيادات - عروض خاصة)
            فبالتالي شلنا Patientbookappointment والراوت
            الخاص بيها ("/patient/book" و "/offers")
            عشان محتوى مكرر خلاص.
          */}

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

         // <Route
           // path="/patient/appointments"
           // element={<PatientAppointments />}
          />

          <Route
            path="/patient/notifications"
            element={<PatientNotifications />}
          />

          <Route
            path="/patient/payments"
            element={<PatientPayments />}
          />

          {/* أي رابط قديم بيوجه لـ /patient/book أو /offers يرجع تلقائيًا لصفحة المواعيد */}
          <Route
            path="/patient/book"
            element={<Navigate to="/patient/appointments" replace />}
          />

          <Route
            path="/offers"
            element={<Navigate to="/patient/appointments" replace />}
          />

          {/* ==================== UNKNOWN ROUTE ==================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </main>

      {!hideGlobalChrome && (
        <div className="print:hidden">
          <Footer />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;








