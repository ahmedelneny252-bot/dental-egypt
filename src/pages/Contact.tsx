import { useState } from "react";
import {
  MapPin,
  Phone,
  MessageCircle,
  Facebook,
  Mail,
  Users,
  Shield,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      if (formData.name && formData.email && formData.message) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50/50">
      {/* Header */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              اتصل بنا
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              نحن هنا لمساعدتك في أي استفسار أو طلب
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">
                أرسل لنا رسالة
              </h2>

              {submitStatus === "success" && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريبًا.
                    </span>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      يرجى ملء جميع الحقول المطلوبة والمحاولة مرة أخرى.
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                      placeholder="أدخل بريدك الإلكتروني"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    رقم الهاتف (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                    placeholder="أدخل رقم هاتفك"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الرسالة
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm"
                    rows="5"
                    placeholder="اكتب رسالتك هنا..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-lg shadow-lg shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                    isSubmitting ? "opacity-80" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-b-2 border-white" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      <span>إرسال الرسالة</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Platform Contact */}
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                  تواصل مع المنصة
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">المقر الرئيسي</p>
                      <p className="text-sm text-slate-500">القاهرة، مصر</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">الهاتف</p>
                      <p className="text-sm text-slate-500">0800 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">واتساب</p>
                      <p className="text-sm text-slate-500">01012345678</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">البريد الإلكتروني</p>
                      <p className="text-sm text-slate-500">info@dentalcare-eg.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">وسائل التواصل الاجتماعي</p>
                      <div className="flex gap-3 mt-1">
                        <a href="#" className="hover:text-teal-400 transition-colors">
                          <Facebook className="w-5 h-5" />
                        </a>
                        <a href="#" className="hover:text-teal-400 transition-colors">
                          <Mail className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Contact Us */}
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                  لماذا تتواصل معنا؟
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-700">الدعم والمساعدة</p>
                      <p className="text-sm text-slate-500">
                        فريق الدعم متاح للإجابة على جميع استفساراتك حول المنصة والعيادات
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-700">اقتراحات وتحسينات</p>
                      <p className="text-sm text-slate-500">
                        نسعى دائمًا لتحسين خدماتنا بناءً على ملاحظاتكم واقتراحاتكم
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-700">شراكات وتعاونات</p>
                      <p className="text-sm text-slate-500">
                        نحن مفتوحون للتعاون مع العيادات والمتخصصين في مجال طب الأسنان
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;