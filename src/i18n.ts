export type Language = "ar" | "en";

export const translations = {
  ar: {
    common: {
      home: "الصفحة الرئيسية",
      clinics: "العيادات",
      services: "الخدمات",
      about: "من نحن",
      contact: "اتصل بنا",
      notifications: "الإشعارات",
      findClinic: "ابحث عن عيادة",
      arabic: "العربية",
      english: "English",
      lightMode: "الوضع الفاتح",
      darkMode: "الوضع الداكن",
      back: "العودة",
      loading: "جاري التحميل...",
      error: "حدث خطأ",
      retry: "إعادة المحاولة",
      phone: "الهاتف",
      whatsapp: "واتساب",
      address: "العنوان",
      reviews: "التقييمات",
      new: "جديد",
      details: "التفاصيل",
      dentalClinic: "عيادة أسنان",
      noReviews: "لا توجد تقييمات حتى الآن",
      noReviewsShort: "لا توجد تقييمات",
      bookAppointment: "احجز موعد",
      bookAppointmentNow: "احجز موعدك الآن",
      submit: "إرسال",
      cancel: "إلغاء",
      save: "حفظ",
      close: "إغلاق",
      search: "بحث",
      noResults: "لا توجد نتائج",
    },

    clinic: {
      searchTitle: "ابحث عن عيادة أسنان",
      searchDescription:
        "ابحث عن العيادات المتاحة واحجز موعدك بسهولة",
      searchPlaceholder:
        "ابحث باسم العيادة أو العنوان أو رقم الهاتف...",
      showing: "عرض",
      of: "من",
      clinic: "عيادة",
      noClinics: "لا توجد عيادات بعد",
      noClinicsDescription:
        "لم يتم العثور على أي عيادة في قاعدة البيانات.",
      noMatchingClinics:
        "لا توجد عيادات تطابق البحث",
      noMatchingClinicsDescription:
        "حاول البحث باسم مختلف.",
      resetSearch: "إعادة تعيين البحث",

      notFound: "العيادة غير موجودة",
      notFoundDescription:
        "عذراً، لم نتمكن من تحميل بيانات هذه العيادة.",

      aboutClinic: "نبذة عن العيادة",
      noDescription:
        "لم تقم العيادة بإضافة نبذة تعريفية حتى الآن.",

      availableServices: "الخدمات المتاحة",
      servicesDescription:
        "سيتم عرض خدمات العيادة هنا عند إضافتها.",
      noServices: "لا توجد خدمات مضافة حتى الآن.",

      contactClinic: "تواصل مع العيادة",

      bookingDescription:
        "يمكنك إرسال طلب حجز للعيادة وسيتم مراجعته من إدارة العيادة.",
    },

    home: {
      welcome: "مرحباً بك في DentalCare",
      findYourClinic: "ابحث عن عيادتك",
    },

    appointment: {
      bookTitle: "حجز موعد",
      appointmentDate: "تاريخ الموعد",
      appointmentTime: "وقت الموعد",
      notes: "ملاحظات",
      status: "الحالة",
      confirm: "تأكيد الحجز",
      booking: "جاري الحجز...",
      success: "تم حجز الموعد بنجاح",
      failed: "فشل حجز الموعد",
    },

    auth: {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      logout: "تسجيل الخروج",
    },

    dashboard: {
      dashboard: "لوحة التحكم",
      patients: "المرضى",
      appointments: "المواعيد",
      clinicProfile: "ملف العيادة",
      doctorServices: "الخدمات",
      payments: "المدفوعات",
      subscription: "الاشتراك",
      reviews: "التقييمات",
    },
  },

  en: {
    common: {
      home: "Home",
      clinics: "Clinics",
      services: "Services",
      about: "About Us",
      contact: "Contact",
      notifications: "Notifications",
      findClinic: "Find a Clinic",
      arabic: "العربية",
      english: "English",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      back: "Back",
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      phone: "Phone",
      whatsapp: "WhatsApp",
      address: "Address",
      reviews: "Reviews",
      new: "New",
      details: "Details",
      dentalClinic: "Dental Clinic",
      noReviews: "No reviews yet",
      noReviewsShort: "No reviews",
      bookAppointment: "Book Appointment",
      bookAppointmentNow: "Book Your Appointment Now",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      close: "Close",
      search: "Search",
      noResults: "No results",
    },

    clinic: {
      searchTitle: "Find a Dental Clinic",
      searchDescription:
        "Find available clinics and book your appointment easily",
      searchPlaceholder:
        "Search by clinic name, address, or phone number...",
      showing: "Showing",
      of: "of",
      clinic: "clinics",
      noClinics: "No clinics yet",
      noClinicsDescription:
        "No clinics were found in the database.",
      noMatchingClinics:
        "No clinics match your search",
      noMatchingClinicsDescription:
        "Try searching for a different name.",
      resetSearch: "Reset Search",

      notFound: "Clinic Not Found",
      notFoundDescription:
        "Sorry, we couldn't load this clinic's information.",

      aboutClinic: "About the Clinic",
      noDescription:
        "The clinic has not added a description yet.",

      availableServices: "Available Services",
      servicesDescription:
        "Clinic services will appear here when they are added.",
      noServices: "No services have been added yet.",

      contactClinic: "Contact the Clinic",

      bookingDescription:
        "You can send an appointment request to the clinic and it will be reviewed by the clinic management.",
    },

    home: {
      welcome: "Welcome to DentalCare",
      findYourClinic: "Find Your Clinic",
    },

    appointment: {
      bookTitle: "Book an Appointment",
      appointmentDate: "Appointment Date",
      appointmentTime: "Appointment Time",
      notes: "Notes",
      status: "Status",
      confirm: "Confirm Appointment",
      booking: "Booking...",
      success: "Appointment booked successfully",
      failed: "Failed to book the appointment",
    },

    auth: {
      login: "Login",
      register: "Create Account",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      logout: "Logout",
    },

    dashboard: {
      dashboard: "Dashboard",
      patients: "Patients",
      appointments: "Appointments",
      clinicProfile: "Clinic Profile",
      doctorServices: "Services",
      payments: "Payments",
      subscription: "Subscription",
      reviews: "Reviews",
    },
  },
} as const;

export type Translation = typeof translations.ar;