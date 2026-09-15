import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Heart,
  Bell,
} from "lucide-react";
import { supabase } from "../supabase";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  const loadUnreadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { data: patient, error: patientError } =
        await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (patientError || !patient) {
        setUnreadCount(0);
        return;
      }

      const { count, error: notificationError } =
        await supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("patient_id", patient.id)
          .eq("is_read", false);

      if (notificationError) {
        console.error(
          "Notification count error:",
          notificationError
        );
        setUnreadCount(0);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error(
        "Load notifications error:",
        error
      );

      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnreadNotifications();
  }, [location.pathname]);

  useEffect(() => {
    const handleAuthChange = () => {
      loadUnreadNotifications();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event) => {
        handleAuthChange();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    {
      to: "/",
      label: "الصفحة الرئيسية",
    },
    {
      to: "/clinics",
      label: "العيادات",
    },
    {
      to: "/services",
      label: "الخدمات",
    },
    {
      to: "/about",
      label: "من نحن",
    },
    {
      to: "/contact",
      label: "اتصل بنا",
    },
  ];

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-teal-100"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-all duration-300">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                دنتال كير
              </h1>

              <p className="text-xs text-teal-600 font-medium -mt-1">
                DentalCare Egypt
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? "text-teal-600 bg-teal-50"
                    : "text-slate-600 hover:text-teal-600 hover:bg-teal-50/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Notifications */}
            <Link
              to="/patient/notifications"
              className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </Link>

            {/* Find Clinic */}
            <Link
              to="/clinics"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              ابحث عن عيادة
            </Link>

          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() =>
              setIsMobileMenuOpen(
                !isMobileMenuOpen
              )
            }
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-teal-50 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "max-h-[500px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 border-t border-teal-100 bg-white/95 rounded-b-2xl">

            <div className="flex flex-col gap-1">

              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? "text-teal-600 bg-teal-50"
                      : "text-slate-600 hover:text-teal-600 hover:bg-teal-50/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Notifications */}
              <Link
                to="/patient/notifications"
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                className={`relative flex items-center justify-center gap-2 mx-4 mt-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                  location.pathname ===
                  "/patient/notifications"
                    ? "bg-teal-100 text-teal-700"
                    : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                <Bell className="w-5 h-5" />

                <span>
                  الإشعارات
                </span>

                {unreadCount > 0 && (
                  <span className="min-w-6 h-6 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </Link>

              {/* Mobile Find Clinic */}
              <div className="px-4 pt-2">

                <Link
                  to="/clinics"
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base font-semibold shadow-lg shadow-teal-500/25"
                >
                  <Phone className="w-4 h-4" />
                  ابحث عن عيادة
                </Link>

              </div>

            </div>

          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
