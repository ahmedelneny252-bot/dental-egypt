import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  ShieldCheck,
  Clock,
  Stethoscope,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { translations, type Language } from "../i18n";

const Index = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("dentalcare-language");
    return saved === "en" ? "en" : "ar";
  });

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const updateSettings = () => {
      const savedLanguage =
        localStorage.getItem("dentalcare-language");

      setLanguage(savedLanguage === "en" ? "en" : "ar");

      setIsDark(
        document.documentElement.classList.contains("dark")
      );
    };

    window.addEventListener(
      "dentalcare-language-change",
      updateSettings
    );

    window.addEventListener("storage", updateSettings);

    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.classList.contains("dark")
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener(
        "dentalcare-language-change",
        updateSettings
      );

      window.removeEventListener("storage", updateSettings);

      observer.disconnect();
    };
  }, []);

  const isArabic = language === "ar";
  const t = translations[language];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-white text-slate-900"
      }`}
    >
      {/* Hero */}
      <section
        className={`relative overflow-hidden transition-colors duration-300 ${
          isDark
            ? "bg-slate-950"
            : "bg-white"
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-br from-teal-950/60 via-slate-950 to-teal-950/20"
              : "bg-gradient-to-br from-teal-50 via-white to-teal-50/40"
          }`}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Hero Text */}
            <div
              className={
                isArabic ? "text-right" : "text-left"
              }
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-500">
                <Stethoscope className="h-4 w-4" />

                {isArabic
                  ? "رعاية أسنان أسهل وأفضل"
                  : "Better & Easier Dental Care"}
              </div>

              <h1
                className={`mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                <span className="text-teal-500">
                  DentalCare
                </span>

                <br />

                {isArabic
                  ? "رعايتك تبدأ من هنا"
                  : "Your Care Starts Here"}
              </h1>

              <p
                className={`mb-8 max-w-2xl text-lg leading-8 sm:text-xl ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                {isArabic
                  ? "ابحث عن عيادة الأسنان المناسبة لك، تعرف على خدماتها، واحجز موعدك بسهولة من مكان واحد."
                  : "Find the right dental clinic, explore its services, and book your appointment easily — all in one place."}
              </p>

              <div
                className={`flex flex-col gap-4 sm:flex-row ${
                  isArabic
                    ? "sm:justify-end"
                    : "sm:justify-start"
                }`}
              >
                <Link
                  to="/clinics"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:scale-[1.02]"
                >
                  <Search className="h-5 w-5" />

                  {t.common.findClinic}
                </Link>

                <Link
                  to="/services"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold transition ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {t.common.services}

                  {isArabic ? (
                    <ArrowLeft className="h-5 w-5" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                </Link>
              </div>
            </div>

            {/* Hero Card */}
            <div className="relative">
              <div className="mx-auto max-w-md">
                <div
                  className={`rounded-3xl border p-6 shadow-2xl transition-colors duration-300 ${
                    isDark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10">
                      <Stethoscope className="h-7 w-7 text-teal-500" />
                    </div>

                    <div
                      className={
                        isArabic
                          ? "text-right"
                          : "text-left"
                      }
                    >
                      <h2
                        className={`text-xl font-bold ${
                          isDark
                            ? "text-white"
                            : "text-slate-900"
                        }`}
                      >
                        {isArabic
                          ? "عيادتك القادمة"
                          : "Your Next Visit"}
                      </h2>

                      <p
                        className={
                          isDark
                            ? "text-sm text-slate-400"
                            : "text-sm text-slate-500"
                        }
                      >
                        {isArabic
                          ? "كل شيء في مكان واحد"
                          : "Everything in one place"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">

                    {/* Date */}
                    <div
                      className={`rounded-xl p-4 ${
                        isDark
                          ? "bg-slate-800/70"
                          : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-teal-500" />

                        <div
                          className={
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }
                        >
                          <p
                            className={
                              isDark
                                ? "text-sm text-slate-400"
                                : "text-sm text-slate-500"
                            }
                          >
                            {t.appointment.appointmentDate}
                          </p>

                          <p
                            className={
                              isDark
                                ? "font-semibold text-white"
                                : "font-semibold text-slate-900"
                            }
                          >
                            {isArabic
                              ? "احجز موعدك بسهولة"
                              : "Book easily"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div
                      className={`rounded-xl p-4 ${
                        isDark
                          ? "bg-slate-800/70"
                          : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-teal-500" />

                        <div
                          className={
                            isArabic
                              ? "text-right"
                              : "text-left"
                          }
                        >
                          <p
                            className={
                              isDark
                                ? "text-sm text-slate-400"
                                : "text-sm text-slate-500"
                            }
                          >
                            {t.appointment.appointmentTime}
                          </p>

                          <p
                            className={
                              isDark
                                ? "font-semibold text-white"
                                : "font-semibold text-slate-900"
                            }
                          >
                            {isArabic
                              ? "اختر الوقت المناسب لك"
                              : "Choose a convenient time"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Security */}
                    <div className="rounded-xl bg-teal-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-teal-500" />

                        <p
                          className={
                            isDark
                              ? "text-sm font-medium text-slate-200"
                              : "text-sm font-medium text-slate-700"
                          }
                        >
                          {isArabic
                            ? "إدارة مواعيدك بسهولة وأمان"
                            : "Manage your appointments easily and securely"}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className={`border-t transition-colors duration-300 ${
          isDark
            ? "border-slate-800 bg-slate-900/50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2
              className={`mb-4 text-3xl font-bold ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {isArabic
                ? "كل ما تحتاجه في مكان واحد"
                : "Everything You Need in One Place"}
            </h2>

            <p
              className={
                isDark
                  ? "text-slate-400"
                  : "text-slate-600"
              }
            >
              {isArabic
                ? "DentalCare يساعدك على الوصول إلى خدمات الأسنان وإدارة مواعيدك بسهولة."
                : "DentalCare helps you discover dental services and manage your appointments with ease."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Feature 1 */}
            <div
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
                <Search className="h-6 w-6 text-teal-500" />
              </div>

              <h3
                className={`mb-3 text-xl font-semibold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {isArabic
                  ? "ابحث عن العيادات"
                  : "Find Clinics"}
              </h3>

              <p
                className={
                  isDark
                    ? "leading-7 text-slate-400"
                    : "leading-7 text-slate-600"
                }
              >
                {isArabic
                  ? "ابحث عن العيادات المتاحة وتعرف على بياناتها وخدماتها."
                  : "Search available clinics and explore their information and services."}
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
                <Calendar className="h-6 w-6 text-teal-500" />
              </div>

              <h3
                className={`mb-3 text-xl font-semibold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {isArabic
                  ? "احجز موعدك"
                  : "Book Appointments"}
              </h3>

              <p
                className={
                  isDark
                    ? "leading-7 text-slate-400"
                    : "leading-7 text-slate-600"
                }
              >
                {isArabic
                  ? "اختر التاريخ والوقت المناسبين لك وأرسل طلب الحجز بسهولة."
                  : "Choose a suitable date and time and send your appointment request easily."}
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
                <ShieldCheck className="h-6 w-6 text-teal-500" />
              </div>

              <h3
                className={`mb-3 text-xl font-semibold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {isArabic
                  ? "إدارة آمنة"
                  : "Secure Management"}
              </h3>

              <p
                className={
                  isDark
                    ? "leading-7 text-slate-400"
                    : "leading-7 text-slate-600"
                }
              >
                {isArabic
                  ? "تابع مواعيدك وإشعاراتك وبياناتك من حسابك بسهولة."
                  : "Manage your appointments, notifications, and information from your account."}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-teal-500 to-teal-600">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">

          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {isArabic
              ? "جاهز تبدأ؟ ابحث عن عيادتك الآن"
              : "Ready to Get Started? Find Your Clinic"}
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-white/80">
            {isArabic
              ? "اكتشف العيادات المتاحة واحجز موعدك في خطوات بسيطة."
              : "Discover available clinics and book your appointment in just a few simple steps."}
          </p>

          <Link
            to="/clinics"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 font-semibold shadow-sm transition hover:scale-[1.02] ${
              isDark
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-900"
            }`}
          >
            <Search className="h-5 w-5" />

            {t.common.findClinic}
          </Link>

        </div>
      </section>
    </div>
  );
};

export default Index;