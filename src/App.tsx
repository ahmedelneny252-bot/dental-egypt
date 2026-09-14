import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import ClinicDetail from "./pages/ClinicDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import DoctorDashboard from "./DoctorDashboard";
import DoctorRegister from "./DoctorRegister";
import DoctorLogin from "./DoctorLogin";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/clinics" element={<Clinics />} />

            <Route
              path="/clinics/:id"
              element={<ClinicDetail />}
            />

            <Route path="/about" element={<About />} />

            <Route path="/contact" element={<Contact />} />

            <Route path="/services" element={<Services />} />

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
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;