import { Facebook, Instagram, Twitter, Linkedin, Heart, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
          {/* Platform Info */}
          <div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">دنتال كير</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              نربطك بأفضل عيادات الأسنان في مصر. اكتشف، قارن، واحجز موعدك بسهولة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  الصفحة الرئيسية
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  العيادات
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  الخدمات
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  من نحن
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  اتصل بنا
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">خدماتنا</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  طب الأسنان العام
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  تقويم الأسنان
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  تبييض الأسنان
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  زراعة الأسنان
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  طب أسنان الأطفال
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-teal-400" />
                <span className="text-slate-400">0800 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <a href="mailto:info@dentalcare-eg.com" className="hover:text-teal-400 transition-colors">
                  info@dentalcare-eg.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-400">@dentalcare_eg</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-teal-900/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} دنتال كير. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;