export interface Clinic {
  id: number;
  name: string;
  doctorName: string;
  description: string;
  image: string;
  phone: string;
  whatsapp: string;
  facebook: string;
  address: string;
  city: string;
  governorate: string;
  rating: number;
  reviewCount: number;
  services: string[];
  workingHours: {
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
  };
}

export const clinics: Clinic[] = [
  {
    id: 1,
    name: "ابتسامة النهضة للأسنان",
    doctorName: "د. أحمد محمد",
    description:
      "عيادة متخصصة في جميع خدمات الأسنان باستخدام أحدث التقنيات الطبية. نقدم خدمات العناية بالأسنان بأسعار مناسبة وجودة عالية.",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80",
    phone: "01234567890",
    whatsapp: "201234567890",
    facebook: "https://www.facebook.com/abtsamahnada",
    address: "شارع الرئيسي، المنطقة التجارية",
    city: "القاهرة",
    governorate: "القاهرة",
    rating: 4.8,
    reviewCount: 156,
    services: [
      "طب الأسنان العام",
      "تنظيف الأسنان",
      "تبييض الأسنان",
      "حشو الأسنان",
      "علاج جذور الأسنان",
      "تيجان الأسنان",
      "زراعة الأسنان",
    ],
    workingHours: {
      saturday: { open: "09:00", close: "21:00", isOpen: true },
      sunday: { open: "09:00", close: "21:00", isOpen: true },
      monday: { open: "09:00", close: "21:00", isOpen: true },
      tuesday: { open: "09:00", close: "21:00", isOpen: true },
      wednesday: { open: "09:00", close: "21:00", isOpen: true },
      thursday: { open: "09:00", close: "21:00", isOpen: true },
      friday: { open: "10:00", close: "16:00", isOpen: true },
    },
  },
  {
    id: 2,
    name: "عيادة د. سارة للأسنان",
    doctorName: "د. سارة أحمد",
    description:
      "عيادة متخصصة في تقويم الأسنان وتجميلها. نستخدم أحدث التقنيات لتقديم أفضل النتائج لمرضانا.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
    phone: "01098765432",
    whatsapp: "201098765432",
    facebook: "https://www.facebook.com/drsarahdental",
    address: "شارع النيل، وسط البلد",
    city: "القاهرة",
    governorate: "القاهرة",
    rating: 4.9,
    reviewCount: 203,
    services: [
      "تقويم الأسنان",
      "تبييض الأسنان",
      "تيجان الأسنان",
      "جسور الأسنان",
      "طب الأسنان التجميلي",
      "طب الأسنان للأطفال",
    ],
    workingHours: {
      saturday: { open: "10:00", close: "20:00", isOpen: true },
      sunday: { open: "10:00", close: "20:00", isOpen: true },
      monday: { open: "10:00", close: "20:00", isOpen: true },
      tuesday: { open: "10:00", close: "20:00", isOpen: true },
      wednesday: { open: "10:00", close: "20:00", isOpen: true },
      thursday: { open: "10:00", close: "20:00", isOpen: true },
      friday: { open: "12:00", close: "18:00", isOpen: true },
    },
  },
  {
    id: 3,
    name: "مركز الإسكندرية لطب الأسنان",
    doctorName: "د. خالد محمود",
    description:
      "مركز متكامل لعلاج الأسنان في الإسكندرية. نقدم خدمات شاملة تشمل الزراعة والتقويم والعلاج العام.",
    image: "https://images.unsplash.com/photo-1629909614828-1d0a3f1b6c9e?w=800&q=80",
    phone: "01112223333",
    whatsapp: "201112223333",
    facebook: "https://www.facebook.com/alexdental",
    address: "شارع كورنيش البحر، الإسكندرية",
    city: "الإسكندرية",
    governorate: "الإسكندرية",
    rating: 4.7,
    reviewCount: 189,
    services: [
      "زراعة الأسنان",
      "علاج جذور الأسنان",
      "جراحة الفم",
      "تيجان الأسنان",
      "جسور الأسنان",
      "تنظيف الأسنان",
      "طب الأسنان العام",
    ],
    workingHours: {
      saturday: { open: "08:00", close: "22:00", isOpen: true },
      sunday: { open: "08:00", close: "22:00", isOpen: true },
      monday: { open: "08:00", close: "22:00", isOpen: true },
      tuesday: { open: "08:00", close: "22:00", isOpen: true },
      wednesday: { open: "08:00", close: "22:00", isOpen: true },
      thursday: { open: "08:00", close: "22:00", isOpen: true },
      friday: { open: "09:00", close: "14:00", isOpen: true },
    },
  },
  {
    id: 4,
    name: "عيادة الأطفال للأسنان",
    doctorName: "د. نورا حسن",
    description:
      "عيادة متخصصة في طب أسنان الأطفال مع بيئة مريحة وآمنة للأطفال. فريق متخصص في التعامل مع الصغار.",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80",
    phone: "01223334444",
    whatsapp: "201223334444",
    facebook: "https://www.facebook.com/kidsdental",
    address: "شارع الجامعة، مدينة نصر",
    city: "القاهرة",
    governorate: "القاهرة",
    rating: 4.9,
    reviewCount: 134,
    services: [
      "طب أسنان الأطفال",
      " fluoride treatment",
      "حشو الأسنان للأطفال",
      "وقاية من التسوس",
      "تنظيف الأسنان",
    ],
    workingHours: {
      saturday: { open: "09:00", close: "18:00", isOpen: true },
      sunday: { open: "09:00", close: "18:00", isOpen: true },
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      wednesday: { open: "09:00", close: "18:00", isOpen: true },
      thursday: { open: "09:00", close: "18:00", isOpen: true },
      friday: { open: "10:00", close: "14:00", isOpen: true },
    },
  },
  {
    id: 5,
    name: "مركز الهرم لزراعة الأسنان",
    doctorName: "د. محمد علي",
    description:
      "متخصص في زراعة الأسنان والتعويضات. خبرة واسعة في زراعة الأسنان الفورية والتقليدية.",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80",
    phone: "01556667777",
    whatsapp: "201556667777",
    facebook: "https://www.facebook.com/haramdental",
    address: "شارع الهرم، الجيزة",
    city: "الجيزة",
    governorate: "الجيزة",
    rating: 4.6,
    reviewCount: 98,
    services: [
      "زراعة الأسنان",
      "جسور الأسنان",
      "تيجان الأسنان",
      "تعويضات الأسنان",
      "طب الأسنان العام",
    ],
    workingHours: {
      saturday: { open: "10:00", close: "20:00", isOpen: true },
      sunday: { open: "10:00", close: "20:00", isOpen: true },
      monday: { open: "10:00", close: "20:00", isOpen: true },
      tuesday: { open: "10:00", close: "20:00", isOpen: true },
      wednesday: { open: "10:00", close: "20:00", isOpen: true },
      thursday: { open: "10:00", close: "20:00", isOpen: true },
      friday: { open: "12:00", close: "18:00", isOpen: true },
    },
  },
  {
    id: 6,
    name: "عيادة التجميل للأسنان",
    doctorName: "د. ليلى عمر",
    description:
      "عيادة متخصصة في تجميل الأسنان وابتسامة الهولايوود. نقدم خدمات التبييض والتقويم الشفاف.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
    phone: "01119998888",
    whatsapp: "201119998888",
    facebook: "https://www.facebook.com/beautydental",
    address: "الرحاب، القاهرة الجديدة",
    city: "القاهرة",
    governorate: "القاهرة",
    rating: 4.8,
    reviewCount: 167,
    services: [
      "تبييض الأسنان",
      "تقويم الأسنان الشفاف",
      "تيجان الأسنان التجميلية",
      "فينير الأسنان",
      "طب أسنان تجميلي",
    ],
    workingHours: {
      saturday: { open: "10:00", close: "21:00", isOpen: true },
      sunday: { open: "10:00", close: "21:00", isOpen: true },
      monday: { open: "10:00", close: "21:00", isOpen: true },
      tuesday: { open: "10:00", close: "21:00", isOpen: true },
      wednesday: { open: "10:00", close: "21:00", isOpen: true },
      thursday: { open: "10:00", close: "21:00", isOpen: true },
      friday: { open: "14:00", close: "20:00", isOpen: true },
    },
  },
];

export const governorates = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الغربية",
  "المنوفية",
  "الشرقية",
  "الاسماعيلية",
  "بني سويف",
  "الفيوم",
  "منيا القمح",
  "أسوان",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "الإسماعيلية",
  "السويس",
  "بورسعيد",
  "دمياط",
  "كفر الشيخ",
];

export const allServices = [
  "طب الأسنان العام",
  "تنظيف الأسنان",
  "تبييض الأسنان",
  "حشو الأسنان",
  "علاج جذور الأسنان",
  "تيجان الأسنان",
  "جسور الأسنان",
  "زراعة الأسنان",
  "تقويم الأسنان",
  "طب أسنان الأطفال",
  "طب أسنان تجميلي",
  "جراحة الفم",
];