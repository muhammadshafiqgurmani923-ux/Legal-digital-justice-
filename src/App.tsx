import React, { useState, useEffect, useMemo } from "react";
import { 
  Scale, 
  Phone, 
  MapPin, 
  Clock, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  ChevronRight, 
  ChevronLeft, 
  User, 
  FileText, 
  X, 
  Lock, 
  LogOut, 
  Trash2, 
  Printer, 
  Briefcase, 
  Shield, 
  Check, 
  Star, 
  MessageSquare, 
  Send, 
  Search, 
  Plus,
  Moon,
  Sun,
  Eye,
  CheckCircle2,
  Mic,
  Square,
  Sparkles,
  Loader2,
  Play,
  Pause
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations, TranslationSet } from "./translations";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie } from "recharts";
import { auth, googleAuthProvider } from "./lib/firebase.ts";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ConsultationRequest {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  urgency: "Urgent" | "Normal";
  details: string;
  status: "Pending" | "Scheduled" | "Completed";
  notes?: string;
  documents?: string;
  timestamp: string;
  statusHistory?: Array<{
    id: number;
    consultationId: string;
    status: string;
    notes?: string;
    timestamp: string;
  }>;
}

interface CustomReview {
  id: string;
  author: string;
  role: string;
  text: string;
  rating: number;
  date: string;
}

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const chamberPhotos = [
  {
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
    titleEn: "Main Legal Library & Citations Room",
    titleUr: "بنیادی قانون لائبریری اور حوالہ جات کا کمرہ",
    descEn: "Chamber archive hosting 5,000+ classical law journals, acts, supreme court cases and federal digests.",
    descUr: "چیمبر لائبریری جس میں پانچ ہزار سے زائد سپریم کورٹ کیسز اور وفاقی جرائد موجود ہیں۔"
  },
  {
    url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800",
    titleEn: "Advocate Consultation Office Desk",
    titleUr: "ایڈووکیٹ مشاورتی ڈیسک",
    descEn: "A secure and private room designed for premium strategy sessions and client testimony review.",
    descUr: "ایک محفوظ اور نجی کمرہ جو سائلین کے ساتھ اہم قانونی حکمت عملی اور گواہی کے جائزے کے لیے مخصوص ہے۔"
  },
  {
    url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=800",
    titleEn: "Case Compilation Desk",
    titleUr: "کیس ریسرچ اور کمپائلیشن",
    descEn: "Where legal briefs are meticulously parsed, cataloged, and finalized for high court dockets.",
    descUr: "جہاں عدالتی چیمبر اور ہائی کورٹ کی دائر فائلوں کو تفصیل سے تیار کیا جاتا ہے۔"
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    titleEn: "Chambers Conference & Counseling Hall",
    titleUr: "چیمبرز کانفرنس اور کونسلنگ ہال",
    descEn: "Fully equipped with modern digital facilities for remote case hearings, corporate mediation and client counseling.",
    descUr: "جدید ڈیجیٹل سہولیات سے لیس ہال جو آن لائن عدالتی سماعتوں اور کارپوریٹ ثالثی کے لیے موزوں ہے۔"
  }
];

interface ChecklistItem {
  id: string;
  nameEn: string;
  nameUr: string;
  checked: boolean;
  isCustom?: boolean;
}

const getCaseDocuments = (documentsStr?: string): ChecklistItem[] => {
  const defaultItems: ChecklistItem[] = [
    { id: "doc-1", nameEn: "Power of Attorney (Wakalatnama)", nameUr: "وکالت نامہ", checked: false },
    { id: "doc-2", nameEn: "Fard (Land Revenue Record / Patwari Copy)", nameUr: "فرد ملکیت / پٹواری نقل", checked: false },
    { id: "doc-3", nameEn: "Copy of National Identity Card (CNIC)", nameUr: "شناختی کارڈ کی کاپی", checked: false },
    { id: "doc-4", nameEn: "Plaint / Written Statement (Daawa / Jawab)", nameUr: "دعویٰ / جواب دعویٰ", checked: false },
    { id: "doc-5", nameEn: "Evidence / Attested Stamp Papers", nameUr: "ثبوتی دستاویزات / اقرار نامہ", checked: false },
  ];
  if (!documentsStr) return defaultItems;
  try {
    const parsed = JSON.parse(documentsStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse case documents:", e);
  }
  return defaultItems;
};

const getWhatsAppUrl = (item: ConsultationRequest, lang: "en" | "ur") => {
  let cleanPhone = item.phone.replace(/\D/g, "");
  // Standardize Pakistani numbers (e.g. 03001234567 -> 923001234567)
  if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
    cleanPhone = "92" + cleanPhone.substring(1);
  } else if (cleanPhone.length === 10 && !cleanPhone.startsWith("92")) {
    cleanPhone = "92" + cleanPhone;
  }
  
  const text = lang === 'en'
    ? `Dear ${item.name}, thank you for choosing Gurmani & Associates Chambers. Your consultation request for "${item.service}" has been processed. Your session date is scheduled for ${item.date}. (Ticket ID: ${item.id}, Status: ${item.status})`
    : `محترم ${item.name}، گرمانی اینڈ ایسوسی ایٹس لیگل چیمبرز کا انتخاب کرنے کا شکریہ۔ سروس "${item.service}" کے لیے آپ کی درخواست موصول ہو گئی ہے۔ آپ کا وقت ${item.date} مقرر کیا گیا ہے۔ (ٹکٹ نمبر: ${item.id}، اسٹیٹس: ${item.status})`;
    
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

const WhatsAppIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Pre-seeded consultation requests to keep the lawyer dashboard engaging immediately
const initialConsultations: ConsultationRequest[] = [
  {
    id: "JD-2026-01",
    name: "Muhammad Latif Ansari",
    phone: "03007654321",
    service: "Criminal Defense & Appeals",
    date: getTodayString(),
    urgency: "Urgent",
    details: "Seeking immediate bail application hearing at the High Court Bench in the matter of false FIR filed regarding business transaction dispute.",
    status: "Pending",
    notes: "Requires urgent files review of High Court case diary on Friday afternoon.",
    timestamp: "2026-06-18T10:14:00"
  },
  {
    id: "JD-2026-02",
    name: "Sardar Abdul Ghani",
    phone: "03335559876",
    service: "Civil Suits & Land Disputes",
    date: getTomorrowString(),
    urgency: "Normal",
    details: "Need land partition deed verification and drafting of a stay order request regarding ancestral farmland in Tehsil Multan.",
    status: "Scheduled",
    notes: "Client advised to bring original Patwari copy of fard registry.",
    timestamp: "2026-06-18T14:30:00"
  },
  {
    id: "JD-2026-03",
    name: "Dr. Amna Shah",
    phone: "03219988776",
    service: "Corporate & Tax Consultation",
    date: "2026-06-28",
    urgency: "Normal",
    details: "Registration of new medical diagnostics company with SECP and setting up commercial trademark contracts.",
    status: "Completed",
    notes: "Company setup forms registered successfully with direct registration receipt.",
    timestamp: "2026-06-19T09:12:00"
  }
];

// Initial reviews
const initialReviews: CustomReview[] = [
  {
    id: "rev-1",
    author: "Mian Bashir Ahmad",
    role: "Land Owner (Civil Litigation Winner)",
    text: "Gurmani Sahib contested my land partition case in the High Court with absolute genius. His presentation on revenue logs and Pakistani precedents got us a stay order on day one.",
    rating: 5,
    date: "2026-05-15"
  },
  {
    id: "rev-2",
    author: "Sardar Saleem Jan",
    role: "Business Owner",
    text: "Our corporate company had a long tax resolution issue. He represented us at appellate tribunals and saved our reputation. Very professional counsel.",
    rating: 5,
    date: "2026-06-01"
  },
  {
    id: "rev-3",
    author: "Kaneez Fatima",
    role: "Khula & Custody Petitioner",
    text: "Advocate Shafiq Gurmani secured the custody of my two children in a very difficult custody case. He fought tirelessly and showed deep empathy throughout.",
    rating: 5,
    date: "2026-06-10"
  }
];

export default function App() {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [reviews, setReviews] = useState<CustomReview[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);

  // Firebase auth states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Form States
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [reqService, setReqService] = useState("");
  const [prefDate, setPrefDate] = useState("");
  const [caseDetails, setCaseDetails] = useState("");
  const [urgency, setUrgency] = useState<"Urgent" | "Normal">("Normal");
  const [formError, setFormError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState("");

  // Review states
  const [reviewName, setReviewName] = useState("");
  const [reviewRole, setReviewRole] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Admin States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("All");
  const [filterService, setFilterService] = useState<string>("All");
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<ConsultationRequest | null>(null);

  // Case Note Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingError, setRecordingError] = useState("");

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerIntervalRef = React.useRef<any | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Daily Court Docket States
  const [docketSelectedDate, setDocketSelectedDate] = useState<string | null>(null);
  const [docketSortBy, setDocketSortBy] = useState<"Date" | "Urgency" | "Client">("Date");
  const [docketSearchQuery, setDocketSearchQuery] = useState("");
  const [newDocName, setNewDocName] = useState("");

  // Chamber Photo Gallery States
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [isCarouselAutoPlaying, setIsCarouselAutoPlaying] = useState(true);

  // Auto-play Chamber Photo Carousel with a 5-second interval
  useEffect(() => {
    if (!isCarouselAutoPlaying) return;
    const timer = setInterval(() => {
      setActivePhotoIdx(prev => (prev === chamberPhotos.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarouselAutoPlaying]);

  // Calendar displayed month/year states (initialize to current date 2026-06-30)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // 0-indexed, June is 5

  const goToPrevMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const getMonthName = (monthIdx: number) => {
    const monthsEn = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthsUr = [
      "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
      "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"
    ];
    return lang === 'en' ? monthsEn[monthIdx] : monthsUr[monthIdx];
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    
    const cells: Array<{ dateStr: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d });
    }
    return cells;
  }, [calendarYear, calendarMonth]);

  // Dynamic filter lists for court docket matching selected calendar date or Today & Tomorrow
  const docketConsultations = useMemo(() => {
    const todayStr = getTodayString();
    const tomorrowStr = getTomorrowString();

    let filtered = consultations.filter(item => {
      if (docketSelectedDate) {
        return item.date === docketSelectedDate;
      }
      return item.date === todayStr || item.date === tomorrowStr;
    });

    if (docketSearchQuery.trim()) {
      const q = docketSearchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.phone.includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (docketSortBy === "Urgency") {
        if (a.urgency === "Urgent" && b.urgency !== "Urgent") return -1;
        if (a.urgency !== "Urgent" && b.urgency === "Urgent") return 1;
        return a.date.localeCompare(b.date);
      } else if (docketSortBy === "Client") {
        return a.name.localeCompare(b.name);
      } else {
        const dComp = a.date.localeCompare(b.date);
        if (dComp !== 0) return dComp;
        return b.timestamp.localeCompare(a.timestamp);
      }
    });

    return filtered;
  }, [consultations, docketSelectedDate, docketSortBy, docketSearchQuery]);

  const handleCreateQuickDocket = (dateOffset: 0 | 1) => {
    const dateStr = dateOffset === 0 ? getTodayString() : getTomorrowString();
    const dateLabel = dateOffset === 0 ? "Today" : "Tomorrow";
    const numSuffix = Math.floor(1000 + Math.random() * 9000);
    const newRef = `JD-DOCKET-${numSuffix}`;
    
    const sampleNames = ["Malik Jahangir", "Zainab Bibi", "Sardar Mumtaz Gurmani", "Farzana Kausar", "Sikandar Hayat"];
    const sampleServices = [
      "Criminal Defense & Appeals",
      "Civil Suits & Land Disputes",
      "Family, Custody & Marriage Law",
      "Corporate compliance & Tax"
    ];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)] + ` (Quick ${dateLabel} Test)`;
    const service = sampleServices[Math.floor(Math.random() * sampleServices.length)];
    const urgencyVal: "Urgent" | "Normal" = Math.random() > 0.4 ? "Urgent" : "Normal";
    const phone = "0300" + Math.floor(1000000 + Math.random() * 9000000);

    const sampleDetails = dateOffset === 0 
      ? "Urgent court appearance and stay execution verification requested for today by early morning registry counsel."
      : "Required property partition contract draft review and certification scheduled for tomorrow morning chambers briefing.";

    const newRequest: ConsultationRequest = {
      id: newRef,
      name,
      phone,
      service,
      date: dateStr,
      urgency: urgencyVal,
      details: sampleDetails,
      status: "Scheduled",
      timestamp: new Date().toISOString()
    };

    const updated = [newRequest, ...consultations];
    saveRequestsToStorage(updated);
    
    setNotification(lang === 'en' 
      ? `Quick docket booked for ${dateLabel}: ${newRef}`
      : `عارضی کیس درج کرلیا گیا برائے ${dateLabel === 'Today' ? 'آج' : 'کل'}: ${newRef}`);
    setTimeout(() => setNotification(null), 5000);
  };
  
  // Quick notifications to show on consultation submission
  const [notification, setNotification] = useState<string | null>(null);

  const t: TranslationSet = translations[lang];

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          // Sync with database
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
        } catch (err) {
          console.error("Auth sync failed:", err);
        }
      } else {
        setCurrentUser(null);
        setAuthToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch consultations & reviews from Express API / Cloud SQL
  const loadData = async () => {
    try {
      // Load reviews
      const reviewsRes = await fetch("/api/reviews");
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }

      // Load consultations
      const headers: HeadersInit = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      const consultationsRes = await fetch("/api/consultations", { headers });
      if (consultationsRes.ok) {
        const consultationsData = await consultationsRes.json();
        setConsultations(consultationsData);
      }
    } catch (err) {
      console.error("Failed to load data from database:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [authToken]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error("Google Sign-In failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  };

  // Backwards compatibility save helpers for quick test dockets
  const saveRequestsToStorage = async (updatedList: ConsultationRequest[]) => {
    setConsultations(updatedList);
    localStorage.setItem("justice_consultations", JSON.stringify(updatedList));
  };

  // Switch Language handler
  const handleLangToggle = (targetLang: 'en' | 'ur') => {
    setLang(targetLang);
  };

  // Date limit for consultation calendar (no past dates)
  const todayString = new Date().toISOString().split("T")[0];

  // Handle consultation form submission
  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !reqService || !prefDate) {
      setFormError(t.formValidationError);
      return;
    }

    // Basic Pakistan phone validation (must be numeric digits of a valid Pakistan length range)
    const phoneDigits = clientPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      setFormError(lang === 'en' 
        ? "Please mention a valid 10-12 digit mobile contact number." 
        : "براہ کرم سائل کا درست 10 سے 12 ہندسوں کا موبائل نمبر درج کریں۔");
      return;
    }

    setFormError("");

    const ticketNumber = `JD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: ConsultationRequest = {
      id: ticketNumber,
      name: clientName,
      phone: clientPhone,
      service: reqService,
      date: prefDate,
      urgency: urgency,
      details: caseDetails.trim() || "No further details specified.",
      status: "Pending",
      timestamp: new Date().toISOString()
    };

    // POST to our Cloud SQL database via Express
    fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newRequest,
        uid: currentUser?.uid || null
      })
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("API error");
      })
      .then(savedRequest => {
        setConsultations(prev => [savedRequest, ...prev]);
      })
      .catch(err => {
        console.warn("API write failed, using local fallback", err);
        setConsultations(prev => [newRequest, ...prev]);
      });

    setGeneratedTicket(ticketNumber);
    setShowSuccessModal(true);

    // Show temporary notification toast on screen top
    setNotification(lang === 'en' 
      ? `Successfully registered petition reference: ${ticketNumber}` 
      : `درخواست کامیابی سے درج ہوئی۔ ٹوکن نمبر: ${ticketNumber}`);
    setTimeout(() => setNotification(null), 6000);

    // Reset Form Fields
    setClientName("");
    setClientPhone("");
    setReqService("");
    setPrefDate("");
    setCaseDetails("");
    setUrgency("Normal");
  };

  // Handle submitting a review
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) {
      setReviewError(lang === 'en' ? "Please provide your Name and Review text." : "براہ کرم اپنا نام اور تبصرے کی تحریر لازمی پر کریں۔");
      return;
    }

    const newRev: CustomReview = {
      id: `rev-${Date.now()}`,
      author: reviewName,
      role: reviewRole.trim() || (lang === 'en' ? "Verified Chamber Client" : "تصدیق شدہ سائل"),
      text: reviewText,
      rating: reviewRating,
      date: new Date().toISOString().split("T")[0]
    };

    // POST to our Cloud SQL database via Express
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newRev,
        uid: currentUser?.uid || null
      })
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("API error");
      })
      .then(savedRev => {
        setReviews(prev => [savedRev, ...prev]);
      })
      .catch(err => {
        console.warn("API write failed, using local fallback", err);
        setReviews(prev => [newRev, ...prev]);
      });

    setReviewSuccess(true);
    setReviewName("");
    setReviewRole("");
    setReviewText("");
    setReviewRating(5);
    setReviewError("");

    setTimeout(() => {
      setReviewSuccess(false);
    }, 4000);
  };

  // Authentication Logic
  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Use part of the required phone number '03260238939' as password (e.g., '38939')
    if (adminPassword === "38939" || adminPassword === "office38939" || adminPassword === "admin") {
      setIsAdminAuthenticated(true);
      setAdminError("");
    } else {
      setAdminError(t.adminWrongPassword);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    setSelectedRequestDetails(null);
  };

  // List of active legal services for render
  const servicesList = [
    {
      id: 1,
      title: t.service1Title,
      desc: t.service1Desc,
      icon: Scale,
      points: [
        "High Court Bail Applications",
        "FIR Quashment Writs",
        "NAB/FIA Defense Appeals",
        "Trial Court Adjudications"
      ]
    },
    {
      id: 2,
      title: t.service2Title,
      desc: t.service2Desc,
      icon: Briefcase,
      points: [
        "Land Partition (Taqseem-e-Arazi)",
        "Revenue Log Correction (Fard-Patwar)",
        "Stay Order Retainers",
        "Specific Performance"
      ]
    },
    {
      id: 3,
      title: t.service3Title,
      desc: t.service3Desc,
      icon: Shield,
      points: [
        "Custody Petitions & Guardian Applets",
        "Khula Appeals & Custom Arbitration",
        "Recovery of Dower & Maintenance",
        "Writ of Habeas Corpus for Custody"
      ]
    },
    {
      id: 4,
      title: t.service4Title,
      desc: t.service4Desc,
      icon: FileText,
      points: [
        "SECP Private Company Incorporation",
        "FBR Active Taxpayer Vetting",
        "Partnership Deed Drafting",
        "Trademarks & IP Claims"
      ]
    },
    {
      id: 5,
      title: t.service5Title,
      desc: t.service5Desc,
      icon: Scale,
      points: [
        "Constitutional Enforcement Writs",
        "Mandamus & Quo Warranto Suits",
        "Civil Servant Services Writs",
        "Human Rights Protection"
      ]
    },
    {
      id: 6,
      title: t.service6Title,
      desc: t.service6Desc,
      icon: MapPin,
      points: [
        "Registry Vetting & Verification",
        "Power of Attorney Drafting",
        "Commercial Lease Legal Opinions",
        "Sale Deeds Drafting"
      ]
    }
  ];

  // Filtering Logic for Admin Console
  const filteredConsultations = useMemo(() => {
    return consultations.filter(item => {
      // Search matching
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Urgency filtering
      const matchesUrgency = 
        filterUrgency === "All" ||
        (filterUrgency === "Urgent" && item.urgency === "Urgent") ||
        (filterUrgency === "Normal" && item.urgency === "Normal");

      // Service category filtering
      const matchesService = 
        filterService === "All" ||
        item.service.toLowerCase().includes(filterService.toLowerCase());

      return matchesSearch && matchesUrgency && matchesService;
    });
  }, [consultations, searchQuery, filterUrgency, filterService]);

  // Overall status distribution data for Recharts Pie Chart
  const statusDistributionData = useMemo(() => {
    const counts = { Pending: 0, Scheduled: 0, Completed: 0 };
    consultations.forEach(item => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      } else {
        counts[item.status] = (counts[item.status] || 0) + 1;
      }
    });

    return [
      { name: lang === 'en' ? "Pending" : "زیر التوا", value: counts.Pending, color: "#f59e0b" },
      { name: lang === 'en' ? "Scheduled" : "شیڈولڈ", value: counts.Scheduled, color: "#3b82f6" },
      { name: lang === 'en' ? "Completed" : "مکمل شدہ", value: counts.Completed, color: "#10b981" }
    ];
  }, [consultations, lang]);

  // Filtered status distribution data for Recharts Bar Chart
  const filteredStatusDistributionData = useMemo(() => {
    const counts = { Pending: 0, Scheduled: 0, Completed: 0 };
    filteredConsultations.forEach(item => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      } else {
        counts[item.status] = (counts[item.status] || 0) + 1;
      }
    });

    return [
      { name: lang === 'en' ? "Pending" : "زیر التوا", value: counts.Pending, color: "#f59e0b" },
      { name: lang === 'en' ? "Scheduled" : "شیڈولڈ", value: counts.Scheduled, color: "#3b82f6" },
      { name: lang === 'en' ? "Completed" : "مکمل شدہ", value: counts.Completed, color: "#10b981" }
    ];
  }, [filteredConsultations, lang]);

  // Update Status of consultation request
  const updateRequestStatus = async (id: string, newStatus: "Pending" | "Scheduled" | "Completed") => {
    try {
      const changeNotes = window.prompt(
        lang === 'en' 
          ? `Enter progress details or notes for this status update (or click OK to use default):` 
          : `کیس کی پیشرفت کے بارے میں وضاحتی نوٹ لکھیں (یا ڈیفالٹ کے لیے اوکے دبائیں):`
      );
      if (changeNotes === null) {
        return; // user cancelled the update
      }

      const res = await fetch(`/api/consultations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changeNotes: changeNotes.trim() || undefined })
      });
      if (res.ok) {
        const updatedRequest = await res.json();
        setConsultations(prev => prev.map(c => c.id === id ? updatedRequest : c));
        if (selectedRequestDetails && selectedRequestDetails.id === id) {
          setSelectedRequestDetails(updatedRequest);
        }
      }
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  };

  // Add internal lawyer notes
  const updateRequestNotes = async (id: string, notesText: string) => {
    try {
      const res = await fetch(`/api/consultations/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText })
      });
      if (res.ok) {
        const updatedRequest = await res.json();
        setConsultations(prev => prev.map(c => c.id === id ? updatedRequest : c));
        if (selectedRequestDetails && selectedRequestDetails.id === id) {
          setSelectedRequestDetails(updatedRequest);
        }
      }
    } catch (err) {
      console.error("Failed to update notes on server:", err);
    }
  };

  // Add/Update document checklist items
  const updateRequestDocuments = async (id: string, docsJSON: string) => {
    try {
      const res = await fetch(`/api/consultations/${id}/documents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: docsJSON })
      });
      if (res.ok) {
        const updatedRequest = await res.json();
        setConsultations(prev => prev.map(c => c.id === id ? updatedRequest : c));
        if (selectedRequestDetails && selectedRequestDetails.id === id) {
          setSelectedRequestDetails(updatedRequest);
        }
      }
    } catch (err) {
      console.error("Failed to update documents on server:", err);
    }
  };

  const toggleDocumentCheck = (docId: string) => {
    if (!selectedRequestDetails) return;
    const currentDocs = getCaseDocuments(selectedRequestDetails.documents);
    const updatedDocs = currentDocs.map(doc => doc.id === docId ? { ...doc, checked: !doc.checked } : doc);
    updateRequestDocuments(selectedRequestDetails.id, JSON.stringify(updatedDocs));
  };

  const addCustomDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestDetails || !newDocName.trim()) return;
    const currentDocs = getCaseDocuments(selectedRequestDetails.documents);
    const newDoc: ChecklistItem = {
      id: `custom-${Date.now()}`,
      nameEn: newDocName.trim(),
      nameUr: newDocName.trim(),
      checked: false,
      isCustom: true
    };
    const updatedDocs = [...currentDocs, newDoc];
    updateRequestDocuments(selectedRequestDetails.id, JSON.stringify(updatedDocs));
    setNewDocName("");
  };

  const deleteCustomDocument = (docId: string) => {
    if (!selectedRequestDetails) return;
    const currentDocs = getCaseDocuments(selectedRequestDetails.documents);
    const updatedDocs = currentDocs.filter(doc => doc.id !== docId);
    updateRequestDocuments(selectedRequestDetails.id, JSON.stringify(updatedDocs));
  };

  // Start recording client-side audio via MediaRecorder
  const startRecordingAudio = async () => {
    setRecordingError("");
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine a supported mimeType
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/ogg";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ""; // default browser supported format
      }

      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType }) 
        : new MediaRecorder(stream);
        
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone device
        stream.getTracks().forEach(track => track.stop());
        
        // Process collected chunks
        await handleAudioUpload(selectedRequestDetails?.id, mimeType || mediaRecorder.mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Failed to access microphone:", err);
      setRecordingError(lang === 'en' 
        ? "Microphone access denied or unsupported. Please check browser permissions."
        : "مائیکروفون تک رسائی ممکن نہیں۔ براہ کرم براؤزر کی اجازتیں چیک کریں۔"
      );
    }
  };

  // Stop recording
  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Convert the recorded audio to Base64 and send to Gemini API
  const handleAudioUpload = async (consultationId: string | undefined, mimeType: string) => {
    if (!consultationId) return;
    if (audioChunksRef.current.length === 0) {
      setRecordingError(lang === 'en' ? "No audio recorded." : "کوئی آڈیو ریکارڈ نہیں کی گئی۔");
      return;
    }

    setRecordingLoading(true);
    setRecordingError("");

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Strip out the data:audio/...;base64, prefix
        const base64Data = base64String.split(",")[1];

        try {
          const res = await fetch(`/api/consultations/${consultationId}/audio-note`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: mimeType
            })
          });

          if (res.ok) {
            const data = await res.json();
            // Update local consultation lists with the updated notes returned from server
            setConsultations(prev => prev.map(c => c.id === consultationId ? data.consultation : c));
            setSelectedRequestDetails(data.consultation);
          } else {
            const errData = await res.json();
            setRecordingError(errData.error || (lang === 'en' ? "Failed to transcribe audio." : "آڈیو ٹرانسکرائب کرنے میں ناکامی۔"));
          }
        } catch (postErr: any) {
          console.error("Error calling audio-note API:", postErr);
          setRecordingError(postErr.message);
        } finally {
          setRecordingLoading(false);
        }
      };
    } catch (err: any) {
      console.error("Error reading audio data:", err);
      setRecordingError(err.message);
      setRecordingLoading(false);
    }
  };

  // Cancel/Delete Request
  const deleteRequest = async (id: string) => {
    if (window.confirm(lang === 'en' ? "Are you sure you want to archive this docket petition?" : "کیا آپ واقعی اس سائل کی درخواست آرکائیو کرنا چاہتے ہیں؟")) {
      try {
        const res = await fetch(`/api/consultations/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setConsultations(prev => prev.filter(c => c.id !== id));
          setSelectedRequestDetails(null);
        }
      } catch (err) {
        console.error("Failed to delete request on server:", err);
      }
    }
  };

  // Generate and Download Consolidated Pending Dockets Report as a highly polished PDF
  const exportPendingDocketsPDF = () => {
    const pendingList = consultations.filter(c => c.status === "Pending");
    
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.width || 297;
      const pageHeight = doc.internal.pageSize.height || 210;

      // Primary Branding Colors: Navy (#0d1633) and Premium Gold (#cfb53b)
      const navyColor = [13, 22, 51];
      const goldColor = [207, 181, 59];

      // Elegant top header bar
      doc.setFillColor(13, 22, 51);
      doc.rect(0, 0, pageWidth, 12, "F");
      doc.setFillColor(207, 181, 59);
      doc.rect(0, 12, pageWidth, 2.5, "F");

      // Header Letterhead style
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(13, 22, 51);
      doc.text("GURMANI & ASSOCIATES CHAMBERS", pageWidth / 2, 26, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("ADVOCATE MUHAMMAD SHAFIQ GURMANI (HIGH COURT, PAKISTAN)", pageWidth / 2, 32, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(207, 181, 59);
      doc.text("JUSTICE DIGITAL DESK — CONSOLIDATED PENDING DOCKETS", pageWidth / 2, 40, { align: "center" });

      // Thin separator
      doc.setDrawColor(207, 181, 59);
      doc.setLineWidth(0.5);
      doc.line(15, 46, pageWidth - 15, 46);

      // Metadata section
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`DATE GENERATED: ${new Date().toLocaleString()}`, 15, 52);
      doc.text(`TOTAL PENDING DOCKETS: ${pendingList.length}`, 15, 57);

      doc.setTextColor(185, 28, 28); // Red warning for confidential
      doc.text("CLASSIFICATION: CONFIDENTIAL / ATTORNEY-CLIENT PRIVILEGED", pageWidth - 15, 52, { align: "right" });

      // Columns Configuration
      const headers = [
        ["Ticket ID", "Client Name", "Phone Number", "Service Practice Area", "Session Date", "Urgency", "Details & Brief Case Particulars"]
      ];

      // Map rows
      const body = pendingList.length > 0 
        ? pendingList.map(item => [
            item.id,
            item.name,
            item.phone,
            item.service,
            item.date,
            item.urgency,
            item.details
          ])
        : [["-", "No Pending Dockets Recorded", "-", "-", "-", "-", "There are currently no pending dockets found in the system registry."]];

      // Generate AutoTable
      autoTable(doc, {
        startY: 62,
        head: headers,
        body: body,
        theme: "striped",
        headStyles: {
          fillColor: [13, 22, 51],
          textColor: [207, 181, 59],
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: "bold", textColor: [194, 120, 3], halign: "center" }, // ID
          1: { cellWidth: 42, fontStyle: "bold" }, // Name
          2: { cellWidth: 32, fontStyle: "normal", halign: "center" }, // Phone
          3: { cellWidth: 48 }, // Service
          4: { cellWidth: 28, halign: "center" }, // Date
          5: { cellWidth: 22, halign: "center" }, // Urgency
          6: { cellWidth: "auto" } // Details
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 4.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: (data) => {
          // Highlight Urgent urgency in red text or background
          if (data.column.index === 5 && data.cell.text[0] === "Urgent") {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = "bold";
          }
        },
        margin: { left: 15, right: 15 },
      });

      // Footer signature box
      const finalY = (doc as any).lastAutoTable.finalY + 18;
      if (finalY < pageHeight - 30) {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Advocate Muhammad Shafiq Gurmani", pageWidth - 15, finalY, { align: "right" });

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Gurmani & Associates Chambers Seal", pageWidth - 15, finalY + 4.5, { align: "right" });
      }

      // Add a thin footer line on each page and Page Numbers
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Justice Digital Desk — Dedicated to Legal Excellence & Attorney-Client Privilege", 15, pageHeight - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 7, { align: "right" });
      }

      // Trigger automatic secure file download
      doc.save(`Pending_Dockets_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  // Generate and Download detailed individual Case History & notes Portfolio as a highly polished PDF
  const exportCaseHistoryPDF = (request: ConsultationRequest) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.width || 210;
      const pageHeight = doc.internal.pageSize.height || 297;

      // Primary colors of Gurmani Chambers
      const navyColor = [1, 20, 34]; // #011422
      const goldColor = [207, 181, 59]; // #cfb53b
      const skyColor = [2, 132, 199]; // #0284c7

      // Top header band
      doc.setFillColor(1, 20, 34);
      doc.rect(0, 0, pageWidth, 12, "F");
      doc.setFillColor(207, 181, 59);
      doc.rect(0, 12, pageWidth, 2.5, "F");

      // Letterhead styling
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(1, 20, 34);
      doc.text("GURMANI & ASSOCIATES CHAMBERS", pageWidth / 2, 25, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("ADVOCATE MUHAMMAD SHAFIQ GURMANI (HIGH COURT, PAKISTAN)", pageWidth / 2, 31, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(207, 181, 59);
      doc.text("CASE HISTORY FILE & COMPLIANCE RECORD", pageWidth / 2, 38, { align: "center" });

      // Separator line
      doc.setDrawColor(207, 181, 59);
      doc.setLineWidth(0.4);
      doc.line(15, 43, pageWidth - 15, 43);

      // Metadata Header Row
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      doc.text("CONFIDENTIAL / ATTORNEY-CLIENT PRIVILEGED RECORD", 15, 48);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`EXTRACTED: ${new Date().toLocaleString()}`, pageWidth - 15, 48, { align: "right" });

      // Title Section 1: CASE METADATA
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(1, 20, 34);
      doc.text("1. CASE METADATA BRIEF", 15, 55);

      // Metadata Table rows
      const metaRows = [
        ["Ticket / Case ID", request.id, "Case Status", request.status],
        ["Client Full Name", request.name, "Urgency Priority", request.urgency],
        ["Contact Phone", request.phone, "Scheduled Date", request.date],
        ["Practice Area", request.service, "Registered Date", new Date(request.timestamp || Date.now()).toLocaleDateString()]
      ];

      autoTable(doc, {
        startY: 58,
        body: metaRows,
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: 3.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: "bold", textColor: [71, 85, 105], fillColor: [248, 250, 252] },
          1: { cellWidth: 55, fontStyle: "bold", textColor: [15, 23, 42] },
          2: { cellWidth: 35, fontStyle: "bold", textColor: [71, 85, 105], fillColor: [248, 250, 252] },
          3: { cellWidth: 55, fontStyle: "bold", textColor: [15, 23, 42] }
        },
        margin: { left: 15, right: 15 }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 8;

      // Section 2: BRIEF CASE STATEMENT & PARTICULARS
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(1, 20, 34);
      doc.text("2. BRIEF CASE STATEMENT & CLIENT PARTICULARS", 15, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        body: [[request.details || "No details provided."]],
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          fontStyle: "italic",
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { fillColor: [248, 250, 252], lineColor: [2, 132, 199], lineWidth: { left: 1.2, top: 0, right: 0, bottom: 0 } }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Section 3: INTERNAL ADVOCATE NOTES
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(1, 20, 34);
      doc.text("3. INTERNAL ADVOCATE CASE NOTES", 15, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        body: [[request.notes || "No internal notes recorded. Double click notes field on digital desk to add notes."]],
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { fillColor: [254, 252, 232], lineColor: [207, 181, 59], lineWidth: { left: 1.2, top: 0, right: 0, bottom: 0 } }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Section 4: REQUIRED DOCUMENTS CHECKLIST
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(1, 20, 34);
      doc.text("4. REQUIRED CASE DOCUMENTS CHECKLIST", 15, currentY);

      const docsList = getCaseDocuments(request.documents);
      const docRows = docsList.map((d, idx) => [
        String(idx + 1),
        d.nameEn,
        d.nameUr || "-",
        d.checked ? "VERIFIED (RECEIVED)" : "OUTSTANDING (REQUIRED)"
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [["S.No", "Document Name (English)", "دستاویز کی تفصیل (Urdu)", "Verification Status"]],
        body: docRows,
        theme: "striped",
        headStyles: {
          fillColor: [1, 20, 34],
          textColor: [207, 181, 59],
          fontSize: 8.5,
          fontStyle: "bold"
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 50 },
          3: { cellWidth: 45, halign: "center", fontStyle: "bold" }
        },
        didParseCell: (data) => {
          if (data.column.index === 3) {
            if (data.cell.text[0].startsWith("VERIFIED")) {
              data.cell.styles.textColor = [16, 185, 129]; // emerald-600
            } else {
              data.cell.styles.textColor = [217, 119, 6]; // amber-600
            }
          }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Section 5: CASE LOGS & TIMELINE
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 25;
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(1, 20, 34);
      doc.text("5. STATUS HISTORY & ACTION TRAILS", 15, currentY);

      const historyList = request.statusHistory || [];
      const historyRows = historyList.length > 0 
        ? historyList.map((h, idx) => [
            String(idx + 1),
            new Date(h.timestamp).toLocaleString(),
            h.status,
            h.notes || "-"
          ])
        : [["-", "-", "No historical state transitions recorded.", "-"]];

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Step", "Timestamp of Activity", "Assigned Status", "Recorded Remarks / Audit Notes"]],
        body: historyRows,
        theme: "striped",
        headStyles: {
          fillColor: [1, 20, 34],
          textColor: [207, 181, 59],
          fontSize: 8.5,
          fontStyle: "bold"
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 45, halign: "center" },
          2: { cellWidth: 35, halign: "center", fontStyle: "bold" },
          3: { cellWidth: "auto" }
        },
        margin: { left: 15, right: 15 }
      });

      // Signature / Certified box on last page
      const lastY = (doc as any).lastAutoTable.finalY + 15;
      let signatureY = lastY;
      if (signatureY > pageHeight - 35) {
        doc.addPage();
        signatureY = 25;
      }

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Advocate Muhammad Shafiq Gurmani", pageWidth - 15, signatureY, { align: "right" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Certified Office Registrar Seal & Signature", pageWidth - 15, signatureY + 4.5, { align: "right" });

      // Add thin footer line & page numbers to all pages
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Justice Digital Desk — Gurmani & Associates chambers attorney-client record", 15, pageHeight - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 7, { align: "right" });
      }

      // Download file with a clean client name and ticket ID format
      const formattedName = request.name.replace(/\s+/g, '_');
      doc.save(`Case_History_${request.id}_${formattedName}.pdf`);
    } catch (err) {
      console.error("Failed to generate Case History PDF:", err);
    }
  };

  // Trigger print view for specific consultation entry
  const handlePrint = (request: ConsultationRequest) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${request.id} - ${request.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { border-bottom: 3px double #cfb53b; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .badge { display: inline-block; padding: 4px 10px; background: #fee2e2; color: #b91c1c; font-weight: bold; border-radius: 4px; font-size: 11px; }
            .normal-badge { display: inline-block; padding: 4px 10px; background: #f1f5f9; color: #475569; font-weight: bold; border-radius: 4px; font-size: 11px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .field { margin-bottom: 12px; }
            .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
            .val { font-size: 15px; margin-top: 4px; font-weight: 500; }
            .case-desc { background: #f8fafc; padding: 15px; border-left: 4px solid #1e3a8a; border-radius: 4px; line-height: 1.6; }
            .seal { margin-top: 60px; text-align: right; font-style: italic; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; color: #0f172a;">JUSTICE DIGITAL DESK</h2>
            <p style="margin: 5px 0 0 0; color: #cfb53b; font-size: 14px; letter-spacing: 1px;">M. SHAFIQ GURMANI - ADVOCATE HIGH COURT</p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h3>Judicial Intake Docket: ${request.id}</h3>
            ${request.urgency === "Urgent" ? `<span class="badge">IMMEDIATE ATTENTION</span>` : `<span class="normal-badge">REGULAR REVIEW</span>`}
          </div>
          <div class="grid">
            <div class="field">
              <div class="label">Client Name</div>
              <div class="val">${request.name}</div>
            </div>
            <div class="field">
              <div class="label">Contact Number</div>
              <div class="val">${request.phone}</div>
            </div>
            <div class="field">
              <div class="label">Practice Category Requested</div>
              <div class="val">${request.service}</div>
            </div>
            <div class="field">
              <div class="label">Requested Briefing Date</div>
              <div class="val">${request.date}</div>
            </div>
          </div>
          <div class="field" style="margin-top: 25px;">
            <div class="label">Brief Case Statement & Particulars</div>
            <p class="case-desc">${request.details}</p>
          </div>
          <div class="field" style="margin-top: 25px;">
            <div class="label">Internal Advocate Follow-Up Notes</div>
            <p style="border: 1px dashed #cbd5e1; padding: 15px; border-radius: 4px; min-height: 80px;">${request.notes || 'No follow-up notes written.'}</p>
          </div>
          <div class="seal">
            <p style="margin-bottom: 40px;">Certified by Registry Staff</p>
            <p>__________________________</p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 5px;">M. Shafiq Gurmani (Advocate High Court)</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Dynamic WhatsApp prefill content based on language and current input
  const whatsAppUrl = useMemo(() => {
    let baseMsg = "";
    if (lang === "en") {
      baseMsg = `Assalam-o-Alaikum Advocate Muhammad Shafiq Gurmani, I visited your Justice Digital Desk and require urgent legal briefing. Contact: ${clientName || 'Client'} (Phone: ${clientPhone || '03260238939'}). Please share available schedule for consultations.`;
    } else {
      baseMsg = `السلام علیکم ایڈووکیٹ محمد شفیق گورمانی صاحب، میں نے آپ کے جسٹس ڈیجیٹل ڈیسک پر وزٹ کیا ہے اور مجھے آپ سے فوری قانونی مدد اور مشاورت درکار ہے۔ رابطہ کار: ${clientName || 'سائل'} (نمبر: ${clientPhone || '03260238939'})۔ براہ مہربانی دستیابی کا وقت بتائیں۔`;
    }
    return `https://wa.me/923260238939?text=${encodeURIComponent(baseMsg)}`;
  }, [lang, clientName, clientPhone]);

  return (
    <div 
      className={`min-h-screen bg-[#070b19] text-slate-100 flex flex-col font-sans selection:bg-[#cfb53b]/40 selection:text-white`}
      dir={lang === "ur" ? "rtl" : "ltr"}
      id="main-scaffolding"
    >
      {/* Toast Notification for instant user actions */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-6 left-4 right-4 md:left-auto md:right-6 z-50 max-w-md bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg p-4 shadow-2xl flex items-center gap-3 border border-amber-400"
            id="toast-notification"
          >
            <CheckCircle className="w-6 h-6 flex-shrink-0 animate-bounce text-yellow-200" />
            <div>
              <p className="font-bold text-sm tracking-wider uppercase">Chamber Notice</p>
              <p className="text-xs text-yellow-50 font-medium">{notification}</p>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-auto text-amber-200 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#021829]/95 backdrop-blur-md border-b border-amber-500/25 shadow-lg" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo with animations and gold glow */}
          <div className="flex items-center gap-3" id="app-logo-block">
            <div className="p-2.5 bg-gradient-to-br from-[#094161] to-[#032135] rounded-lg border border-amber-500/30 flex items-center justify-center shadow-md shadow-amber-500/5 hover:border-amber-500/85 transition" id="svg-scale-logo">
              <Scale className="w-7 h-7 text-[#cfb53b] stroke-[1.6] transform hover:rotate-6 transition duration-300" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-serif font-bold tracking-tight text-[#cfb53b] flex items-center gap-2">
                {t.navTitle}
              </h1>
              <p className="text-[10px] md:text-xs text-sky-300/80 font-medium tracking-wide">
                {t.navSubtitle}
              </p>
            </div>
          </div>

          {/* Controls & Quick Info Header */}
          <div className="flex items-center gap-3 md:gap-5" id="nav-controls-block">
            {/* Direct Phone Calling link */}
            <a 
              href="tel:03007324474" 
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded bg-sky-950/40 hover:bg-sky-950/70 transition border border-sky-900/40 text-xs font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-[#cfb53b]" />
              <span className="text-sky-200">{lang === 'en' ? "Office:" : "دفتر:"}</span>
              <span className="font-bold text-[#cfb53b]">0300-7324474</span>
            </a>

            {/* Language Toggle System */}
            <div className="flex bg-[#011422] rounded-md p-1 border border-sky-900/40" id="language-switcher">
              <button
                onClick={() => handleLangToggle('en')}
                className={`px-3 py-1 text-xs rounded font-medium transition duration-200 ${
                  lang === 'en' 
                    ? 'bg-[#cfb53b] text-slate-900 shadow font-semibold' 
                    : 'text-sky-400 hover:text-white'
                }`}
                title="Switch to English"
                id="btn-lang-en"
              >
                English
              </button>
              <button
                onClick={() => handleLangToggle('ur')}
                className={`px-3 py-1 text-xs rounded font-medium transition duration-200 ${
                  lang === 'ur' 
                    ? 'bg-[#cfb53b] text-slate-900 shadow font-semibold' 
                    : 'text-sky-400 hover:text-white'
                }`}
                title="اردو میں تبدیل کریں"
                id="btn-lang-ur"
              >
                اردو
              </button>
            </div>

            {/* Firebase Auth Google Sign In / Sign Out */}
            {currentUser ? (
              <div className="flex items-center gap-2 border border-sky-900/40 bg-sky-950/30 rounded-md p-1 pl-2 animate-fade-in" id="user-profile-badge">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span className="text-xs max-w-[80px] truncate text-sky-200 font-medium">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded hover:bg-sky-900/30 text-sky-400 hover:text-red-400 transition"
                  title="Sign Out"
                  id="btn-sign-out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
                id="btn-google-sign-in"
              >
                <User className="w-3.5 h-3.5" />
                {lang === "en" ? "Sign In with Google" : "گوگل سے لاگ ان"}
              </button>
            )}

            {/* Admin Portal Shortcut Button */}
            <button
              onClick={() => {
                setShowAdminModal(true);
                setAdminError("");
              }}
              className="px-3.5 py-1.5 rounded-md border border-amber-500/30 text-xs font-medium hover:border-amber-500 hover:bg-amber-500/5 text-amber-400 transition"
              id="btn-lawyer-portal"
            >
              <Lock className="w-3.5 h-3.5 inline-block mr-1 ml-1 align-middle" />
              {t.adminLoginBtn}
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0f25] via-[#090d1f] to-[#060a18] py-12 md:py-20 px-4 border-b border-slate-900" id="hero-showcase">
        {/* Abstract background graphics with soft gold and blue glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#cfb53b] text-xs font-medium tracking-widest uppercase mb-6"
            id="hero-badge-container"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t.heroBadge}
          </motion.div>

          {/* Main Title paired with serif/urdu font depending on locale */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-semibold tracking-tight text-white leading-tight ${
              lang === 'ur' ? 'font-urdu leading-relaxed' : 'font-serif'
            }`}
            id="hero-main-title"
          >
            {t.welcomeHeroTitle}
          </motion.h1>

          {/* Underline Flourish */}
          <div className="w-32 h-[3px] bg-gradient-to-r from-transparent via-[#cfb53b] to-transparent mx-auto my-6" />

          {/* Advocate Primary Profile subtext */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <p className="text-amber-400 font-mono text-sm md:text-base font-semibold tracking-wider">
              ✦ {t.heroTagline} ✦
            </p>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-slate-300 text-sm md:text-base lg:text-lg leading-relaxed mb-8 font-light"
            id="hero-subdescription"
          >
            {t.welcomeHeroSubtitle}
          </motion.p>

          {/* Direct CTA routes */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-2" id="hero-actions">
            
            {/* Scroll down to form */}
            <a 
              href="#consultation-intake-section"
              className="w-full sm:w-auto px-6 py-3.5 rounded-md bg-[#cfb53b] hover:bg-amber-500 text-slate-900 font-bold transition duration-300 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm"
              id="cta-scroll-form"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {t.ctaConsultation}
            </a>

            {/* Direct WhatsApp assist link with formatted Pakistan support line */}
            <a 
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition duration-300 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm"
              id="cta-whatsapp-link"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-300"></span>
              </span>
              <MessageSquare className="w-4 h-[#cfb53b] flex-shrink-0 text-white" />
              {t.ctaWhatsApp} (0326-0238939)
            </a>

          </div>

        </div>
      </section>

      {/* QUICK STATS ROW */}
      <section className="bg-[#0b1022] border-y border-slate-900 py-6 px-4" id="chamber-assurance-strip">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <p className="text-2xl md:text-3xl font-serif font-bold text-[#cfb53b]">12+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{lang === 'en' ? "Years Active Service" : "سالہ عدالتی تجربہ"}</p>
          </div>
          <div className="p-3 border-l md:border-r border-slate-800">
            <p className="text-2xl md:text-3xl font-serif font-bold text-[#cfb53b]">94%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{lang === 'en' ? "Favorable Judgments" : "کامیاب مقدمات"}</p>
          </div>
          <div className="p-3 border-r md:border-none border-slate-800">
            <p className="text-2xl md:text-3xl font-serif font-bold text-[#cfb53b]">100+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{lang === 'en' ? "Constitutional Writs" : "آئینی رٹ پٹیشنز"}</p>
          </div>
          <div className="p-3">
            <p className="text-2xl md:text-3xl font-serif font-bold text-[#cfb53b]">24/7</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{lang === 'en' ? "Bail Assistance" : "ضمانتی معاونت"}</p>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN BODY CONTENT (Advocate Profile & Legal Services) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow" id="main-content">
        
        {/* ADVOCATE DETAILED BIOGRAPHY CARDS */}
        <section className="mb-16" id="about-counsel-section">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-white relative inline-block">
              {lang === 'en' ? "Chamber Senior Counsel" : "چیمبر کے سینئر وکلاء"}
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 transform translate-y-2" />
            </h3>
            <p className="text-slate-400 text-xs md:text-sm mt-3.5 max-w-2xl mx-auto">
              {lang === 'en' ? "Meet our senior advocates dedicated to high-caliber litigation and absolute client success." : "اعلیٰ درجے کی قانونی پیروی اور موکلین کی حتمی کامیابی کے لیے ہمارے سینئر وکلاء سے ملیں۔"}
            </p>
          </div>

          <div className="space-y-10">
            {/* PROFILE 1: Muhammad Shafiq Gurmani */}
            <div className="bg-gradient-to-br from-[#0c142c] to-[#090d1f] hover:gold-glow rounded-xl border border-slate-800 overflow-hidden shadow-xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Graphic/Conceptual side representing scale layout / office portrait */}
                <div className="lg:col-span-4 bg-gradient-to-b from-[#132044] to-[#080d1e] p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-full bg-slate-950/80 flex items-center justify-center border border-[#cfb53b]/40">
                      <Scale className="w-7 h-7 text-[#cfb53b]" />
                    </div>
                    <div>
                      <span className="text-amber-500 font-mono text-xs uppercase tracking-wider block">{t.profileTitle}</span>
                      <h3 className="text-2xl font-serif font-bold text-white mt-1">{t.profileName}</h3>
                      <p className="text-xs text-[#cfb53b] tracking-wide mt-1">{t.profileDesignation}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-[#cfb53b] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t.educationLabel}</p>
                        <p className="text-xs text-slate-200 mt-0.5">{t.educationValue}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-[#cfb53b] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t.experienceLabel}</p>
                        <p className="text-xs text-slate-200 mt-0.5">{t.experienceValue}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-[#cfb53b] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t.licenceLabel}</p>
                        <p className="text-xs text-slate-200 mt-0.5">{t.licenceValue}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text content side */}
                <div className="lg:col-span-8 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg md:text-xl font-serif font-medium text-[#cfb53b] mb-4">
                      {t.profileSubtitle}
                    </h4>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-light">
                      {t.profileBio}
                    </p>
                    <p className="text-amber-500/80 font-serif italic text-sm md:text-base">
                      &ldquo;{lang === 'en' 
                        ? "The defense of rights is not merely a legal profession, it is a sacred pledge before the law and public integrity." 
                        : "حقوقِ سائل کا دفاع محض ایک پیشہ نہیں، بلکہ آئین، قانون اور دیانتداری کے حضور ایک مقدس عہد ہے۔"}&rdquo;
                    </p>
                  </div>

                  {/* Sub-pillars value statement inside biography */}
                  <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">{t.keyValuesTitle}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 bg-slate-950/60 rounded border border-slate-900">
                        <p className="text-xs font-semibold text-[#cfb53b]">{t.valIntegrity}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{t.valIntegrityDesc}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/60 rounded border border-slate-900">
                        <p className="text-xs font-semibold text-[#cfb53b]">{t.valExcellence}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{t.valExcellenceDesc}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/60 rounded border border-slate-900">
                        <p className="text-xs font-semibold text-[#cfb53b]">{t.valDiligence}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{t.valDiligenceDesc}</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* PROFILE 2: Sarfraz Ahmad Warraich Advocate */}
            <div className="bg-gradient-to-br from-[#0c142c] to-[#090d1f] hover:gold-glow rounded-xl border border-slate-800 overflow-hidden shadow-xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Graphic/Conceptual side representing scale layout / office portrait */}
                <div className="lg:col-span-4 bg-gradient-to-b from-[#132044] to-[#080d1e] p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-full bg-slate-950/80 flex items-center justify-center border border-[#cfb53b]/40">
                      <Scale className="w-7 h-7 text-[#cfb53b]" />
                    </div>
                    <div>
                      <span className="text-amber-500 font-mono text-xs uppercase tracking-wider block">
                        {lang === 'en' ? "Senior Counsel Profile" : "اعلیٰ ماہرِ قانون پروفائل"}
                      </span>
                      <h3 className="text-2xl font-serif font-bold text-white mt-1">
                        Sarfraz Ahmad Warraich
                      </h3>
                      <p className="text-xs text-[#cfb53b] tracking-wide mt-1">
                        {lang === 'en' ? "Advocate High Court" : "ایڈووکیٹ ہائی کورٹ"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-[#cfb53b] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t.educationLabel}</p>
                        <p className="text-xs text-slate-200 mt-0.5">
                          {lang === 'en' ? "LL.B (High Court Advocate Panelist)" : "ایل ایل بی (ہائی کورٹ ایڈووکیٹ پینلسٹ)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-[#cfb53b] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t.experienceLabel}</p>
                        <p className="text-xs text-slate-200 mt-0.5">
                          {lang === 'en' ? "Senior Counsel Standing" : "سینئر قانون دان (ایڈووکیٹ ہائی کورٹ)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-4 h-4 text-[#cfb53b] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{t.licenceLabel}</p>
                        <p className="text-xs text-slate-200 mt-0.5">
                          {lang === 'en' ? "High Courts & District Courts Registry" : "ہائی کورٹس اور ڈسٹرکٹ کورٹس رجسٹری"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text content side */}
                <div className="lg:col-span-8 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg md:text-xl font-serif font-medium text-[#cfb53b] mb-4">
                      {lang === 'en' ? "Distinguished Advocacy & Rigorous Legal Representation" : "انصاف کی غیر متزلزل جدوجہد اور بہترین عدالتی کارکردگی"}
                    </h4>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-light">
                      {lang === 'en' 
                        ? "Advocate Sarfraz Ahmad Warraich is a distinguished senior legal practitioner with extensive court presence in the High Courts of Pakistan. Specializing in constitutional writ petitions, criminal defense, civil appellate litigation, and administrative law, he is dedicated to delivering flawless advocacy, robust courtroom defense, and protecting client interests at all levels of the judiciary."
                        : "ایڈووکیٹ سرفراز احمد وڑائچ ہائی کورٹ کے ممتاز سینئر قانون دان ہیں جنہیں پاکستان کے مختلف ہائی کورٹس میں وکالت کا وسیع تجربہ حاصل ہے۔ وہ آئینی رٹ پٹیشنز، فوجداری دفاع، دیوانی اپیلوں اور انتظامی قوانین کے ماہر ہیں اور سائلین کے بہترین ریلیف کے لیے چیمبرز میں مثالی اور بے خوف پیروی فراہم کرتے ہیں۔"}
                    </p>
                    <p className="text-amber-500/80 font-serif italic text-sm md:text-base">
                      &ldquo;{lang === 'en' 
                        ? "Legal advocacy demands absolute dedication to the rule of law and an uncompromised defense of client liberties." 
                        : "قانونی وکالت قانون کی حکمرانی اور موکل کی آزادیوں کے سمجھوتہ کیے بغیر دفاع کے لیے مکمل لگن کا تقاضا کرتی ہے۔"}&rdquo;
                    </p>
                  </div>

                  {/* Sub-pillars value statement inside biography */}
                  <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">{t.keyValuesTitle}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 bg-slate-950/60 rounded border border-slate-900">
                        <p className="text-xs font-semibold text-[#cfb53b]">{t.valIntegrity}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{t.valIntegrityDesc}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/60 rounded border border-slate-900">
                        <p className="text-xs font-semibold text-[#cfb53b]">{t.valExcellence}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{t.valExcellenceDesc}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/60 rounded border border-slate-900">
                        <p className="text-xs font-semibold text-[#cfb53b]">{t.valDiligence}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{t.valDiligenceDesc}</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </section>

        {/* LEGAL PRACITICE SERVICES SECTION */}
        <section className="mb-16" id="legal-services-section">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-white relative inline-block">
              {t.servicesTitle}
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 transform translate-y-2" />
            </h3>
            <p className="text-slate-400 text-xs md:text-sm mt-3.5 max-w-2xl mx-auto">
              {t.servicesSubtitle}
            </p>
          </div>

          {/* Grid of services cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-cards-grid">
            {servicesList.map((service, index) => {
              const Icon = service.icon;
              const isSelected = selectedService === service.id;

              return (
                <div 
                  key={service.id}
                  onClick={() => setSelectedService(isSelected ? null : service.id)}
                  className={`group bg-[#090e20] p-5 md:p-6 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-[#cfb53b] bg-gradient-to-b from-[#0e1633] to-[#090e20] shadow-xl shadow-amber-500/5 scale-[1.02]' 
                      : 'border-slate-800/80 hover:border-[#cfb53b]/40 hover:scale-[1.01]'
                  }`}
                  id={`service-card-${service.id}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg border transition duration-300 ${
                        isSelected 
                          ? 'bg-[#cfb53b]/15 border-[#cfb53b] text-white' 
                          : 'bg-slate-950/80 border-slate-800 text-amber-500/80 group-hover:bg-[#cfb53b]/10 group-hover:border-[#cfb53b]/60 group-hover:text-[#cfb53b]'
                      }`}>
                        <Icon className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase">
                        {`AREA-0${service.id}`}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base md:text-lg font-serif font-semibold text-[#cfb53b] group-hover:text-amber-400 transition">
                        {service.title}
                      </h4>
                      <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    {/* Expandable practice checklist */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-slate-800 space-y-1.5"
                        >
                          {service.points.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-3 h-3 text-[#cfb53b] flex-shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[11px] text-amber-500/80 font-medium hover:underline">
                      {isSelected 
                        ? (lang === 'en' ? "Collapse Details" : "آرکائیوز پوشیدہ کریں") 
                        : (lang === 'en' ? "Explore Focus Areas" : "ذیلی کارروائی دیکھیں")
                      }
                    </span>
                    <span className="text-slate-500 text-xs">
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* COMBINED INTERACTIVE SECTION: CONSULTATION FORM & MAP CARD */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16" id="consultation-intake-section">
          
          {/* CONSULTATION REGISTRY FORM CONTAINER */}
          <div className="lg:col-span-7 bg-[#090e21] rounded-xl border border-slate-800 p-6 md:p-8 shadow-xl" id="intake-form-widget">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#cfb53b]" />
                {t.consultTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.consultSubtitle}
              </p>
            </div>

            {formError && (
              <div className="mb-5 p-3 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleConsultationSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider mb-1.5">
                    {t.formName} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={lang === 'en' ? "E.g., Mian Muhammad" : "مثال: میاں محمد علی"}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b] font-medium"
                    />
                  </div>
                </div>

                {/* Client Phone Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider mb-1.5">
                    {t.formPhone} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="03260238939"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b] font-mono tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Service Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider mb-1.5">
                    {t.formService} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={reqService}
                    onChange={(e) => setReqService(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b] font-medium"
                  >
                    <option value="">{t.formSelectPlaceholder}</option>
                    <option value="Criminal Defense & Appeals">{t.service1Title}</option>
                    <option value="Civil Suits & Land Disputes">{t.service2Title}</option>
                    <option value="Family, Custody & Marriage Law">{t.service3Title}</option>
                    <option value="Corporate Compliance & Tax">{t.service4Title}</option>
                    <option value="Constitutional Writs (High Court)">{t.service5Title}</option>
                    <option value="Property Verification & Deeds">{t.service6Title}</option>
                  </select>
                </div>

                {/* Preferred Date Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider mb-1.5">
                    {t.formDate} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date"
                    required
                    min={todayString}
                    value={prefDate}
                    onChange={(e) => setPrefDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b] font-mono"
                  />
                </div>
              </div>

              {/* Urgency Level Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider mb-1.5">
                  {t.formUrgency}
                </label>
                <div className="grid grid-cols-2 gap-3" id="urgency-toggles">
                  <button
                    type="button"
                    onClick={() => setUrgency("Normal")}
                    className={`px-4 py-2 text-xs rounded border font-medium ${
                      urgency === "Normal"
                        ? 'bg-[#122245] border-[#cfb53b] text-slate-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {t.formUrgencyNormal}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("Urgent")}
                    className={`px-4 py-2 text-xs rounded border font-medium flex items-center justify-center gap-1.5 ${
                      urgency === "Urgent"
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-350'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t.formUrgencyUrgent}
                  </button>
                </div>
              </div>

              {/* Message Context */}
              <div>
                <label className="block text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider mb-1.5">
                  {t.formMsg}
                </label>
                <textarea
                  rows={4}
                  value={caseDetails}
                  onChange={(e) => setCaseDetails(e.target.value)}
                  placeholder={t.formMsgPlaceholder}
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b] font-medium leading-relaxed"
                />
              </div>

              {/* Submit Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#cfb53b] hover:bg-amber-500 text-slate-950 font-bold rounded text-xs tracking-wider uppercase transition shadow-lg shadow-amber-500/5 duration-200"
                >
                  {t.formSubmitBtn}
                </button>
                
                {/* Immediate WhatsApp trigger */}
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 transition font-bold text-xs uppercase flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  {lang === 'en' ? "Urgent Assist" : "فوری واٹس ایپ"}
                </a>
              </div>

            </form>
          </div>

          {/* PHYSICAL OFFICE & MAP LOCATION CARD */}
          <div className="lg:col-span-5 space-y-6" id="location-widget-container">
            
            {/* Google Map location Block */}
            <div className="bg-[#090e21] rounded-xl border border-slate-800 overflow-hidden shadow-xl" id="google-map-card">
              <div className="p-4 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#cfb53b]" />
                  <span className="text-xs font-bold text-[#cfb53b] uppercase tracking-wider">{t.locationTitle}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">PAKISTAN JURISDICTION</span>
              </div>

              {/* Map embed (Real iframe centered on High Court vicinity) */}
              <div className="h-[260px] w-full bg-slate-950 relative" id="map-iframe-host">
                <iframe 
                  title="Justice Digital Desk Office Map Location"
                  className="w-full h-full border-0 grayscale opacity-80 hover:grayscale-0 transition-all duration-500"
                  src="https://maps.google.com/maps?q=Kachehri%20Chowk,%20Muzaffargarh,%20Pakistan&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Office Details Address bar */}
              <div className="p-5 space-y-4">
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-4.5 h-4.5 text-[#cfb53b] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[11px] uppercase font-bold text-slate-400">{t.addressLabel}</h5>
                    <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">{t.addressValue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-900 pt-3">
                  <Clock className="w-4.5 h-4.5 text-[#cfb53b] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[11px] uppercase font-bold text-slate-400">{t.officeHoursLabel}</h5>
                    <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-mono">{t.officeHoursValue}</p>
                  </div>
                </div>

              </div>

              {/* Chambers Photo Gallery / Trust Carousel */}
              <div className="border-t border-slate-900/80 p-5 space-y-4 bg-[#050814]/40" id="chambers-photo-gallery">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#cfb53b]" />
                    <h4 className="text-[11px] uppercase font-bold text-slate-300 tracking-widest">
                      {lang === 'en' ? "Chamber trust carousel" : "لیگل چیمبر گیلری ڈیسک"}
                    </h4>
                  </div>
                  
                  {/* Carousel Autoplay toggle controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCarouselAutoPlaying(!isCarouselAutoPlaying)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition duration-200 cursor-pointer border ${
                        isCarouselAutoPlaying 
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20" 
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                      }`}
                      title={isCarouselAutoPlaying ? "Pause Auto-play" : "Start Auto-play"}
                      id="btn-carousel-autoplay"
                    >
                      {isCarouselAutoPlaying ? (
                        <>
                          <Pause className="w-3 h-3 animate-pulse" />
                          <span>{lang === 'en' ? "Auto On" : "آٹو آن"}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>{lang === 'en' ? "Auto Off" : "آٹو آف"}</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {lang === 'en' ? "Verified" : "تصدیق شدہ"}
                    </span>
                  </div>
                </div>

                {/* Main Active Photo Frame */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-850 shadow-2xl group">
                  {/* Active Image with transition */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activePhotoIdx}
                      src={chamberPhotos[activePhotoIdx].url}
                      alt={lang === 'en' ? chamberPhotos[activePhotoIdx].titleEn : chamberPhotos[activePhotoIdx].titleUr}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setIsPhotoLightboxOpen(true)}
                    />
                  </AnimatePresence>

                  {/* Glassmorphic Caption Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/85 to-transparent p-3.5 pt-8 text-left">
                    <p className="font-serif text-xs font-bold text-amber-400 tracking-wide flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {lang === 'en' ? chamberPhotos[activePhotoIdx].titleEn : chamberPhotos[activePhotoIdx].titleUr}
                    </p>
                    <p className="text-[10px] text-slate-300 font-medium leading-normal mt-1">
                      {lang === 'en' ? chamberPhotos[activePhotoIdx].descEn : chamberPhotos[activePhotoIdx].descUr}
                    </p>
                  </div>

                  {/* Left / Right Navigation overlays */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx(prev => (prev === 0 ? chamberPhotos.length - 1 : prev - 1));
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 hover:bg-[#cfb53b] text-slate-400 hover:text-slate-950 transition opacity-0 group-hover:opacity-100 cursor-pointer border border-slate-800/50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx(prev => (prev === chamberPhotos.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 hover:bg-[#cfb53b] text-slate-400 hover:text-slate-950 transition opacity-0 group-hover:opacity-100 cursor-pointer border border-slate-800/50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Hover indicator to zoom */}
                  <div 
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-black/70 text-[9px] font-mono font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer" 
                    onClick={() => setIsPhotoLightboxOpen(true)}
                  >
                    <Eye className="w-3 h-3 text-amber-500" />
                    {lang === 'en' ? "ZOOM VIEW" : "بڑا نظارہ"}
                  </div>

                  {/* Progress bar tracking the autoplay interval */}
                  <motion.div
                    key={`${activePhotoIdx}-${isCarouselAutoPlaying}`}
                    initial={{ width: "0%" }}
                    animate={{ width: isCarouselAutoPlaying ? "100%" : "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-[#cfb53b] to-sky-400 z-10"
                  />
                </div>

                {/* Slideshow dots / progress pills */}
                <div className="flex justify-center items-center gap-1.5 pt-1">
                  {chamberPhotos.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setActivePhotoIdx(index);
                        setIsCarouselAutoPlaying(false); // Pause on manual click
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activePhotoIdx === index 
                          ? "w-6 bg-[#cfb53b]" 
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      title={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Thumbnails Row */}
                <div className="grid grid-cols-4 gap-2">
                  {chamberPhotos.map((photo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setActivePhotoIdx(index);
                        setIsCarouselAutoPlaying(false); // Pause on manual click
                      }}
                      className={`relative aspect-video rounded overflow-hidden border transition-all cursor-pointer ${
                        activePhotoIdx === index
                          ? "border-[#cfb53b] ring-2 ring-[#cfb53b]/20 scale-102"
                          : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.titleEn}
                        className="w-full h-full object-cover"
                      />
                      {activePhotoIdx === index && (
                        <div className="absolute inset-0 bg-sky-500/10 mix-blend-color" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Chamber Direct Helplines Grid */}
            <div className="space-y-4" id="quick-contact-panel">
              <div className="p-1 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <p className="text-[10px] font-mono uppercase text-[#cfb53b]/80 tracking-wider px-3 py-1.5 font-bold">
                  {lang === 'en' ? "Direct Chamber Call Desk" : "چیمبر ڈائریکٹ رابطہ لائنز"}
                </p>
              </div>

              {/* Helpline 1: Office Desk */}
              <div className="bg-gradient-to-r from-slate-950 via-[#0d1633] to-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'en' ? "Molvi Law Chamber Helpline" : "مولوی لا چیمبر ہیلپ لائن"}</p>
                  <p className="text-base font-mono font-bold text-amber-400">0300-7324474</p>
                </div>
                <a 
                  href="tel:03007324474"
                  className="w-full sm:w-auto px-4 py-2 rounded bg-[#cfb53b]/10 hover:bg-[#cfb53b]/20 text-[#cfb53b] border border-[#cfb53b]/30 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {lang === 'en' ? "Call Chamber Office" : "چیمبر آفس کال کریں"}
                </a>
              </div>

              {/* Helpline 2: Muhammad Shafiq Gurmani */}
              <div className="bg-gradient-to-r from-slate-950 via-[#0d1633] to-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'en' ? "Advocate Muhammad Shafiq Gurmani" : "ایڈووکیٹ محمد شفیق گورمانی"}</p>
                  <p className="text-base font-mono font-bold text-amber-400">0326-0238939</p>
                </div>
                <a 
                  href="tel:03260238939"
                  className="w-full sm:w-auto px-4 py-2 rounded bg-slate-900 hover:bg-slate-950 text-slate-300 border border-slate-700/60 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {lang === 'en' ? "Call Shafiq Gurmani" : "رابطہ شفیق گورمانی"}
                </a>
              </div>

              {/* Helpline 3: Sarfraz Ahmad Warraich */}
              <div className="bg-gradient-to-r from-slate-950 via-[#0d1633] to-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'en' ? "Sarfraz Ahmad Warraich Advocate" : "سرفراز احمد وڑائچ ایڈووکیٹ"}</p>
                  <p className="text-base font-mono font-bold text-amber-400">0300-7324474</p>
                </div>
                <a 
                  href="tel:03007324474"
                  className="w-full sm:w-auto px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2"
                  id="btn-call-sarfraz"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {lang === 'en' ? "Call Sarfraz Ahmad Waraich" : "کال سرفراز احمد وڑائچ"}
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* REVIEWS SECTION & WRITING REVIEWS CORNER */}
        <section className="mb-16 border-t border-slate-900 pt-16" id="client-reviews-segment">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-white relative inline-block">
              {t.reviewsTitle}
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 transform translate-y-3" />
            </h3>
            <p className="text-slate-400 text-xs md:text-sm mt-4 max-w-2xl mx-auto">
              {t.reviewsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Reviews Grid Display */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4" id="reviews-presentation">
              {reviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="p-5 bg-[#090e20] rounded-xl border border-slate-800/80 hover:border-[#cfb53b]/30 transition flex flex-col justify-between space-y-4"
                  id={`review-item-${rev.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light italic">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white tracking-wide">{rev.author}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rev.role}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{rev.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Client feedback writing form (Interactive Add-review loop) */}
            <div className="lg:col-span-4 bg-[#0a0f25] border border-slate-800 p-6 rounded-xl" id="write-opinion-form">
              <h4 className="text-sm font-serif font-bold text-[#cfb53b] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" />
                {lang === 'en' ? "File Chamber Review" : "رائے درج فرمائیں"}
              </h4>
              <p className="text-slate-400 text-[11px] mb-4">
                {lang === 'en' 
                  ? "Help other prospective clients choose with confidence." 
                  : "آپ کے تعلیمی و عدالتی تاثرات دیگر سائلین کے لیے رہنمائی کا سبب بنتے ہیں۔"}
              </p>

              {reviewError && (
                <p className="text-[11px] text-red-400 bg-red-950/45 p-2 rounded border border-red-500/20 mb-3">{reviewError}</p>
              )}
              {reviewSuccess && (
                <p className="text-[11px] text-emerald-400 bg-emerald-950/45 p-2 rounded border border-emerald-500/20 mb-3 font-medium">
                  ✓ {lang === 'en' ? "Thank you for reviewing! Posted successfully." : "آپ کا تہہ دل سے شکریہ! آپ کا ریکارڈ کامیابی سے شامل ہو گیا۔"}
                </p>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                <div>
                  <input 
                    type="text" 
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder={lang === 'en' ? "Your Name" : "آپ کا نام"}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b]"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={reviewRole}
                    onChange={(e) => setReviewRole(e.target.value)}
                    placeholder={lang === 'en' ? "Your Profession / Case Role" : "عہدہ / کیس کا کردار (مثلاً: تاجر)"}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{lang === 'en' ? "Rating Assigned" : "درجہ بندی (ستارے)"}</label>
                  <select 
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-amber-400 focus:outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                  </select>
                </div>
                <div>
                  <textarea 
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={lang === 'en' ? "Write your honest feedback here..." : "اپنے الفاظ یہاں درج کریں..."}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-[11px] rounded transition duration-200 uppercase tracking-widest"
                >
                  {lang === 'en' ? "Publish Testimonial" : "تبصرہ شائع کریں"}
                </button>
              </form>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER AREA */}
      <footer className="bg-[#011422] border-t border-sky-950/60 py-12 px-4" id="app-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8" id="footer-branding-channels">
          
          {/* Trademark block */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Scale className="w-5 h-5 text-[#cfb53b]" />
              <span className="font-serif font-bold text-white tracking-widest">{t.navTitle}</span>
            </div>
            <p className="text-sky-300/60 text-xs leading-relaxed max-w-sm">
              {lang === 'en' 
                ? "Fierce advocacy, absolute compliance verification, and client care in high-profile civil actions, criminal bail, and property defense disputes." 
                : "ہم اعلیٰ ترین قانونی چیلنجز، رٹ پٹیشنز، زمین کی تقسیم، اور کرمنل اپیلوں میں اپنے موکلین کے حقوق کی پاسبانی کا فریضہ بخوبی سرانجام دیتے ہیں۔"}
            </p>
          </div>

          {/* Quick legal stats */}
          <div className="space-y-3 text-center md:text-left">
            <h5 className="text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider">{lang === 'en' ? "Professional Credo" : "پیشہ ورانہ ضابطہ اخلاق"}</h5>
            <ul className="text-sky-300/60 text-xs space-y-2">
              <li>• {lang === 'en' ? "Adherence to High Court Bar Rules" : "ہائی کورٹ بار قوانین اور ضابطوں کی مکمل پاسداری"}</li>
              <li>• {lang === 'en' ? "Free initial digital diagnostic tokens" : "پہلی مفت تعلیمی قانونی مدد کی بکنگ خصوصیات"}</li>
              <li>• {lang === 'en' ? "Strict, double-locked secure client databases" : "موکل کے کوائف کی مکمل رازداری کی یقین دہانی"}</li>
            </ul>
          </div>

          {/* Core details footer block */}
          <div className="space-y-4 text-center md:text-left">
            <h5 className="text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider">{lang === 'en' ? "Contact Particulars" : "رابطہ کار تفصیلات"}</h5>
            <div className="text-xs text-sky-200/90 space-y-2 font-mono">
              <p className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[#cfb53b]" />
                <span>0326-0238939</span>
              </p>
              <p className="text-[10px] text-sky-400/60 leading-normal">
                {t.whatsappNotice}
              </p>
              <p className="text-amber-500/80 font-bold uppercase tracking-widest text-[10px]">
                {lang === 'en' ? "M. SHAFIQ GURMANI, ADVOCATE HIGH COURT" : "محمد شفیق گورمانی، ایڈووکیٹ ہائی کورٹ"}
              </p>
            </div>
          </div>

        </div>

        {/* Legal Disclaimer block */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-sky-950/60 text-center space-y-3" id="legal-disclaimers">
          <p className="text-[10px] text-sky-500/60 max-w-4xl mx-auto leading-relaxed">
            {lang === 'en'
              ? "Disclaimer: Under the rules of the Pakistan Bar Council, law firms are prohibited from advertising, soliciting clients, or providing promotional incentives. This platform functions strictly as an intake desk, scheduling directory, and custom organizational utility for the convenience of existing and potential consult clients of Advocate Muhammad Shafiq Gurmani."
              : "دستبرداری: پاکستان بار کونسل کے قوانین کے تحت، وکلاء کے لیے عام تشہیر کرنا ممنوع ہے یہ ڈیجیٹل ڈیسک خالصتاً سائلین کے لیے معلوماتی معاونت، ملاقاتوں کو منظم کرنے اور ذاتی انتظام کے ڈیش بورڈ کی خصوصیت کے طور پر تیار کیا گیا ہے۔"}
          </p>
          <div className="flex justify-center items-center gap-6 pt-2">
            <p className="text-[11px] text-sky-500/40 font-mono">
              © {new Date().getFullYear()} Justice Digital Desk • Developed for Excellence.
            </p>
          </div>
        </div>
      </footer>

      {/* ONLINE CONSULTATION SUCCESS SCREEN (Modal Triggered on Submit) */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            id="success-ticket-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b1227] border border-amber-500 rounded-xl p-6 md:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded"
                id="btn-close-success-header"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white uppercase tracking-wider">
                  {lang === 'en' ? "Token Issued Successfully" : "مشاورت ٹوکن نمبر جاری"}
                </h3>
                <p className="text-[#cfb53b] font-mono text-lg font-bold tracking-widest bg-slate-950 py-1.5 px-4 rounded border border-slate-900 inline-block">
                  {generatedTicket}
                </p>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
                {t.formSuccessMsg}
              </p>

              {/* Action buttons inside Ticket success modal */}
              <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
                <a 
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs uppercase transition tracking-wider flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 fill-white text-white" />
                  {lang === 'en' ? "WhatsApp Reference" : "واٹس ایپ پر پیش کریں"}
                </a>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full sm:w-auto py-2.5 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded text-xs uppercase"
                  id="btn-dismiss-success"
                >
                  {t.formSuccessClose}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECURE LAWYER PORTAL MODAL (Pin check or complete inbox records control) */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="lawyer-portal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#090f23] border border-amber-500/30 rounded-xl max-w-6xl w-full p-5 md:p-8 shadow-2xl relative my-8"
              id="lawyer-portal-container"
            >
              
              {/* Close Button right edge */}
              <button 
                onClick={() => setShowAdminModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded z-10"
                id="btn-close-admin-top"
              >
                <X className="w-5 h-5" />
              </button>

              {/* IF NOT AUTHENTICATED: Show login card */}
              {!isAdminAuthenticated ? (
                <div className="max-w-md mx-auto py-10 space-y-6 text-center" id="lawyer-login-pane">
                  <div className="w-14 h-14 bg-[#cfb53b]/15 border border-[#cfb53b]/40 rounded-full flex items-center justify-center mx-auto text-[#cfb53b]">
                    <Lock className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-white">{t.adminModalTitle}</h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'en' ? "Access is restricted to licensed chambers of Adv. M. Shafiq Gurmani" : "براہ کرم رجسٹرڈ دفتری اہلکار ہی پورٹل کھولیں"}
                    </p>
                  </div>

                  {adminError && (
                    <div className="p-3 bg-red-950/50 border border-red-500/30 rounded text-red-300 text-xs font-medium">
                      {adminError}
                    </div>
                  )}

                  <form onSubmit={handleAdminVerify} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-[#cfb53b] tracking-wider mb-2 text-center sm:text-left">
                        {t.adminPasswordLabel}
                      </label>
                      <input 
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter passcode (e.g. 38939)"
                        className="w-full text-center px-4 py-3 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-[#cfb53b] tracking-widest font-mono text-base font-bold"
                        id="input-passcode"
                      />
                      <p className="text-[10px] text-slate-500 mt-2 text-center leading-normal">
                        💡 {lang === 'en' ? "Developer Tip: Use the master security PIN" : "نصیحت: پورٹل پاس ورڈ نمبر"} <strong className="text-amber-500">38939</strong> {lang === 'en' ? "to authenticate or view." : "درج فرما کر لاگ ان کریں۔"}
                      </p>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-[#cfb53b] hover:bg-amber-500 text-slate-950 font-bold rounded text-xs uppercase tracking-widest transition"
                    >
                      {t.adminLoginSubmit}
                    </button>
                  </form>
                </div>
              ) : (
                /* IF AUTHENTICATED: Show professional Chambers dashboard console */
                <div className="space-y-6" id="chambers-active-console">
                  
                  {/* Top bar indicators */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
                        <Scale className="w-5.5 h-5.5 text-[#cfb53b]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-bold text-[#cfb53b] tracking-wide flex items-center gap-2">
                          {t.adminConsoleTitle}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === 'en' ? "Active Case Petitions from Web Intake Form" : "ویب سائٹ سے حاصل کردہ تمام مشاورتی ڈیٹا"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded bg-[#112347] text-slate-300 font-mono text-xs font-bold border border-slate-800">
                        {filteredConsultations.length} {t.totalRequests}
                      </span>
                      
                      <button
                        onClick={exportPendingDocketsPDF}
                        className="px-4 py-2 bg-[#cfb53b] hover:bg-amber-500 text-slate-950 text-xs font-bold rounded flex items-center gap-1.5 transition"
                        id="btn-export-pending-pdf"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {lang === 'en' ? "Export Pending PDF" : "زیرِ التواء پی ڈی ایف برآمد کریں"}
                      </button>
                      
                      <button
                        onClick={handleAdminLogout}
                        className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/40 text-xs font-bold rounded flex items-center gap-1.5 transition"
                        id="btn-admin-logout"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t.adminLogout}
                      </button>
                    </div>
                  </div>

                  {/* Dashboard filters row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950/60 p-4 rounded-lg border border-slate-900" id="console-filterbar">
                    
                    {/* Live Search bar */}
                    <div className="md:col-span-5 relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'en' ? "Search client name, phone, ticket..." : "نام، مہر، یا ٹوکن تلاش کریں..."}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#0b1226] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b]"
                      />
                    </div>

                    {/* Urgency Filter dropdown */}
                    <div className="md:col-span-3">
                      <select
                        value={filterUrgency}
                        onChange={(e) => setFilterUrgency(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0b1226] border border-slate-800 rounded text-slate-200 focus:outline-none"
                      >
                        <option value="All">{lang === 'en' ? "All Urgency Levels" : "تمام کیس ترجیحات"}</option>
                        <option value="Urgent">{lang === 'en' ? "Immediate Action Only" : "صرف فوری مقدمات"}</option>
                        <option value="Normal">{lang === 'en' ? "Regular Advice" : "عام نوعیت کیسز"}</option>
                      </select>
                    </div>

                    {/* Service Category Filter */}
                    <div className="md:col-span-4">
                      <select
                        value={filterService}
                        onChange={(e) => setFilterService(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0b1226] border border-slate-800 rounded text-slate-200 focus:outline-none"
                      >
                        <option value="All">{lang === 'en' ? "All Practice Areas" : "تمام قانونی شعبہ جات"}</option>
                        <option value="Criminal">{t.service1Title}</option>
                        <option value="Civil">{t.service2Title}</option>
                        <option value="Family">{t.service3Title}</option>
                        <option value="Corporate">{t.service4Title}</option>
                        <option value="Constitutional">{t.service5Title}</option>
                        <option value="Property">{t.service6Title}</option>
                      </select>
                    </div>

                  </div>

                  {/* CHAMBERS STATISTICS & RECHARTS DISTRIBUTION ANALYTICS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gradient-to-br from-[#0c132a] to-[#070b19] border border-amber-500/20 rounded-xl p-5 md:p-6 shadow-xl relative" id="chambers-analytics-dashboard">
                    
                    {/* Left KPI Summary metrics column (1/3 width on wide screen) */}
                    <div className="lg:col-span-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-sm font-serif font-bold text-[#cfb53b] tracking-wide uppercase flex items-center gap-2 text-left">
                          <CheckCircle2 className="w-4 h-4 text-amber-500" />
                          {lang === 'en' ? "Docket Intake Portfolio" : "مجموعی کیس پورٹ فولیو کا تجزیہ"}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-left">
                          {lang === 'en'
                            ? "A comprehensive breakdown of consultation requests categorized by current litigation procedural status."
                            : "انٹیک فارم سے موصول ہونے والی قانونی آراء اور درخواستوں کا موجودہ اسٹیٹس بریک ڈاؤن۔"}
                        </p>
                      </div>

                      {/* KPI List Grid */}
                      <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 pt-2">
                        {statusDistributionData.map((stat, idx) => {
                          const IconComp = stat.name.includes("Pending") || stat.name.includes("زیر") ? AlertTriangle : stat.name.includes("Scheduled") || stat.name.includes("شیڈ") ? Clock : CheckCircle;
                          return (
                            <div 
                              key={idx} 
                              className="bg-slate-950/70 border border-slate-900 rounded-lg p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 hover:border-slate-800 transition duration-300"
                            >
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded bg-[#070b18] text-xs animate-none" style={{ color: stat.color, border: `1px solid ${stat.color}25` }}>
                                  <IconComp className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-[11px] font-medium text-slate-300 leading-none">{stat.name}</span>
                              </div>
                              <div className="flex items-baseline lg:justify-end gap-1">
                                <span className="text-lg lg:text-xl font-mono font-bold text-white tracking-tight">
                                  {stat.value}
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium">
                                  ({consultations.length ? Math.round((stat.value / consultations.length) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Info footer */}
                      <div className="hidden lg:block pt-3 border-t border-slate-900 text-[10px] text-slate-500 leading-normal text-left">
                        <span>🛡️ <strong>{lang === 'en' ? "Privacy Assured" : "ڈیٹا تحفظ"}</strong>: {lang === 'en' ? "Local database files are encrypted and processed client-side for absolute legal privilege." : "مؤکلوں کا تمام ڈیٹا وکالت کے اخلاقی تقاضوں کے تحت خفیہ رکھا جاتا ہے۔"}</span>
                      </div>
                    </div>

                    {/* Middle Column: PieChart of Total Portfolio distribution (1/3 width) */}
                    <div className="lg:col-span-1 bg-slate-950/40 border border-slate-900 rounded-lg p-4 flex flex-col items-center justify-center min-h-[220px]" id="recharts-pie-container">
                      <h5 className="text-xs font-serif font-bold text-slate-300 mb-2 self-start flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {lang === 'en' ? "Case Distribution Share" : "پورٹ فولیو شراکت"}
                      </h5>
                      <div className="w-full h-[150px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {statusDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#070b18', 
                                border: '1px solid rgba(220, 180, 50, 0.25)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: '#f8fafc'
                              }}
                              itemStyle={{ color: '#f8fafc' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Middle textual stats overlay */}
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-mono font-bold text-white leading-none">{consultations.length}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1 scale-90">{lang === 'en' ? "Total" : "کل درخواستیں"}</span>
                        </div>
                      </div>
                      
                      {/* Interactive Legend */}
                      <div className="flex gap-4 text-[10px] text-slate-400 mt-2">
                        {statusDistributionData.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Dynamic BarChart based on active filter criteria (1/3 width) */}
                    <div className="lg:col-span-1 bg-slate-950/40 border border-slate-900 rounded-lg p-4 flex flex-col justify-between min-h-[220px]" id="recharts-bar-container">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-serif font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          {lang === 'en' ? "Active / Filtered Metrics" : "ایکٹو فلٹر بریک ڈاؤن"}
                        </h5>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono font-semibold">
                          {filteredConsultations.length} {lang === 'en' ? "shown" : "ظاہر"}
                        </span>
                      </div>

                      <div className="w-full h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredStatusDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                            <XAxis 
                              dataKey="name" 
                              stroke="#64748b" 
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              fontSize={9}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                              contentStyle={{ 
                                backgroundColor: '#070b18', 
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: '#f8fafc'
                              }}
                              itemStyle={{ color: '#f8fafc' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {filteredStatusDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Active / Filtered Legend */}
                      <div className="flex justify-center gap-4 text-[10px] text-slate-400 mt-2">
                        {filteredStatusDistributionData.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-2 rounded-sm h-2" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[9px] text-center text-slate-505 leading-normal italic mt-2">
                        {lang === 'en' 
                          ? "Displays dynamic counts representing active search & category status" 
                          : "یہ لائیو چارٹ موجودہ سرچ، ترجیحات اور سروس فلٹر کے مطابق تبدیل ہوتا ہے۔"}
                      </p>
                    </div>

                  </div>

                  {/* DAILY COURT DOCKET SECTION */}
                  <div 
                    className="bg-gradient-to-br from-[#0c132a] to-[#070b19] border border-amber-500/30 rounded-xl p-5 md:p-6 shadow-xl relative"
                    id="daily-court-docket-section"
                  >
                    {/* Top title bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#cfb53b]/10 rounded-lg border border-[#cfb53b]/30 flex items-center justify-center animate-pulse">
                          <Clock className="w-5.5 h-5.5 text-[#cfb53b]" />
                        </div>
                        <div>
                          <h4 className="text-base font-serif font-bold text-white flex items-center gap-2 tracking-wide">
                            {lang === 'en' ? "Daily Court Docket" : "روزانہ کا عدالتی ڈاکیٹ / شیڈول"}
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] text-[#cfb53b] font-mono font-bold animate-pulse">
                              {lang === 'en' ? "Today & Tomorrow" : "آج اور کل"}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {lang === 'en' 
                              ? `Chambers active scheduling registry for ${getTodayString()} & ${getTomorrowString()}` 
                              : `آج (${getTodayString()}) اور کل (${getTomorrowString()}) کے لیے چیمبرز کا عدالتی اور مشاورتی کلینڈر`}
                          </p>
                        </div>
                      </div>

                      {/* Controls: Filtering and Sorting */}
                      <div className="flex flex-wrap items-center gap-3 animate-fade-in" id="docket-controls">
                        {/* Date selectors */}
                        <div className="flex bg-[#070b18] p-1 rounded-lg border border-slate-800">
                          <button
                            onClick={() => setDocketSelectedDate(null)}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition duration-200 ${
                              docketSelectedDate === null
                                ? "bg-[#cfb53b] text-slate-950 font-bold"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {lang === 'en' ? "All (Today + Tomorrow)" : "آج + کل"}
                          </button>
                          <button
                            onClick={() => setDocketSelectedDate(getTodayString())}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition duration-200 ${
                              docketSelectedDate === getTodayString()
                                ? "bg-[#cfb53b] text-slate-950 font-bold"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {lang === 'en' ? "Today" : "صرف آج"}
                          </button>
                          <button
                            onClick={() => setDocketSelectedDate(getTomorrowString())}
                            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition duration-200 ${
                              docketSelectedDate === getTomorrowString()
                                ? "bg-[#cfb53b] text-slate-950 font-bold"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {lang === 'en' ? "Tomorrow" : "صرف کل"}
                          </button>
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {lang === 'en' ? "Sort by:" : "ترتیب:"}
                          </span>
                          <select
                            value={docketSortBy}
                            onChange={(e) => setDocketSortBy(e.target.value as any)}
                            className="px-2.5 py-1 text-xs bg-[#070b18] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#cfb53b] font-medium"
                          >
                            <option value="Date">{lang === 'en' ? "Session Date" : "حسبِ تاریخ"}</option>
                            <option value="Urgency">{lang === 'en' ? "Urgency Level" : "اہمیت / ارجنسی"}</option>
                            <option value="Client">{lang === 'en' ? "Client Name" : "سائل کا نام"}</option>
                          </select>
                        </div>

                        {/* PDF Export Button */}
                        <button
                          onClick={exportPendingDocketsPDF}
                          className="px-3.5 py-1.5 bg-[#cfb53b]/10 hover:bg-[#cfb53b]/20 text-[#cfb53b] border border-[#cfb53b]/30 font-bold rounded flex items-center gap-1.5 transition"
                          id="btn-export-docket-pdf"
                          title={lang === 'en' ? "Export Pending Dockets PDF Report" : "زیرِ التواء پی ڈی ایف رپورٹ ڈاؤن لوڈ کریں"}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {lang === 'en' ? "Export Report" : "پی ڈی ایف رپورٹ"}
                        </button>
                      </div>
                    </div>

                    {/* GRID WRAPPER FOR CALENDAR VISUALIZATION AND DOCKET LIST */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Side: Calendar Panel (4 columns) */}
                      <div className="lg:col-span-4 bg-[#070b18]/80 border border-slate-800/80 rounded-xl p-4 space-y-4 shadow-inner" id="docket-calendar-viz">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                          <h5 className="text-xs font-serif font-bold text-[#cfb53b] tracking-wider uppercase flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            {lang === 'en' ? "Interactive Calendar" : "عدالتی کیلنڈر"}
                          </h5>
                          
                          {/* Calendar navigation controls */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={goToPrevMonth}
                              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                              title={lang === 'en' ? "Previous Month" : "پچھلا مہینہ"}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono font-bold text-slate-200 px-1.5 py-0.5 bg-slate-950 rounded border border-slate-900 min-w-[75px] text-center">
                              {getMonthName(calendarMonth)} {calendarYear}
                            </span>
                            <button
                              type="button"
                              onClick={goToNextMonth}
                              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                              title={lang === 'en' ? "Next Month" : "اگلا مہینہ"}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Calendar week header */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>{lang === 'en' ? "Su" : "اتوار"}</span>
                          <span>{lang === 'en' ? "Mo" : "پیر"}</span>
                          <span>{lang === 'en' ? "Tu" : "منگل"}</span>
                          <span>{lang === 'en' ? "We" : "بدھ"}</span>
                          <span>{lang === 'en' ? "Th" : "جمعرات"}</span>
                          <span>{lang === 'en' ? "Fr" : "جمعہ"}</span>
                          <span>{lang === 'en' ? "Sa" : "ہفتہ"}</span>
                        </div>

                        {/* Calendar Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((cell, idx) => {
                            if (!cell.dayNum || !cell.dateStr) {
                              return <div key={`empty-${idx}`} className="aspect-square bg-slate-950/10 rounded border border-transparent" />;
                            }
                            
                            const isToday = cell.dateStr === getTodayString();
                            const isSelected = cell.dateStr === docketSelectedDate;
                            const dayConsultations = consultations.filter(c => c.date === cell.dateStr);
                            const hasHearings = dayConsultations.length > 0;
                            
                            return (
                              <button
                                type="button"
                                key={cell.dateStr}
                                onClick={() => setDocketSelectedDate(cell.dateStr)}
                                className={`aspect-square rounded text-[11px] font-mono font-bold relative flex flex-col items-center justify-center transition border cursor-pointer ${
                                  isSelected
                                    ? "bg-[#cfb53b] text-slate-950 border-[#cfb53b] shadow-lg shadow-amber-500/10 font-black scale-105"
                                    : isToday
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                      : "bg-[#040713]/40 text-slate-300 border-slate-900 hover:border-slate-700 hover:bg-slate-900/60"
                                }`}
                              >
                                <span>{cell.dayNum}</span>
                                {hasHearings && (
                                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                                    isSelected ? "bg-slate-950" : "bg-amber-500 animate-pulse"
                                  }`} title={`${dayConsultations.length} ${lang === 'en' ? "hearing(s)" : "کیسز"}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Calendar Status & Reset Button */}
                        <div className="pt-2.5 border-t border-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400 font-light flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                            {lang === 'en' ? "Has active hearings listed" : "کیس شیڈول ہے"}
                          </div>
                          
                          {docketSelectedDate && (
                            <button
                              type="button"
                              onClick={() => {
                                setDocketSelectedDate(null);
                                setCalendarYear(2026);
                                setCalendarMonth(5); // June 2026
                              }}
                              className="text-[9px] px-2 py-0.5 rounded bg-slate-950 text-[#cfb53b] hover:text-white border border-slate-800 hover:border-[#cfb53b]/30 transition cursor-pointer font-bold uppercase tracking-wider"
                            >
                              {lang === 'en' ? "Reset Filter" : "فلٹر صاف کریں"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Docket list container (8 columns) */}
                      <div className="lg:col-span-8 space-y-5 w-full">
                        {/* DEDICATED SEARCH BAR FOR COURTS DOCKETS */}
                        <div className="bg-[#050916]/60 border border-slate-900/80 rounded-xl p-4 space-y-3" id="docket-search-bar-container">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-slate-505" />
                            </div>
                            <input
                              type="text"
                              value={docketSearchQuery}
                              onChange={(e) => setDocketSearchQuery(e.target.value)}
                              placeholder={lang === 'en' ? "Search docket by Client Name, Ticket ID, or Phone..." : "سائل کا نام، ٹکٹ آئی ڈی، یا فون نمبر سے تلاش کریں..."}
                              className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-[#cfb53b] focus:ring-1 focus:ring-[#cfb53b]/20 font-medium transition"
                              id="docket-search-input"
                            />
                            {docketSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setDocketSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition cursor-pointer"
                                id="btn-clear-docket-search"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Search suggestions/indicator */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              {docketSearchQuery.trim() ? (
                                lang === 'en' 
                                  ? `Filter Active: ${docketConsultations.length} item(s) found` 
                                  : `فعال فلٹر: ${docketConsultations.length} کیسز ملے`
                              ) : (
                                lang === 'en' ? "Real-time index search active" : "حقیقی وقت میں انڈیکس تلاش فعال ہے"
                              )}
                            </span>
                            {docketSearchQuery.trim() && (
                              <button 
                                type="button"
                                onClick={() => setDocketSearchQuery("")}
                                className="text-[#cfb53b] hover:underline font-bold transition cursor-pointer"
                              >
                                {lang === 'en' ? "Clear Search" : "تلاش صاف کریں"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* MAIN DOCKET DISPLAY CONTAINER */}
                    {docketConsultations.length === 0 ? (
                      <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-900 border-dashed animate-fade-in" id="docket-empty-state">
                        <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-300">
                          {docketSearchQuery.trim() 
                            ? (lang === 'en' ? `No matching dockets found` : "کوئی مماثل ریکارڈ نہیں ملا")
                            : (lang === 'en' ? "No hearings or briefings scheduled" : "کوئی باقاعدہ سماعت یا ملاقات طے نہیں ہے")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                          {docketSearchQuery.trim()
                            ? (lang === 'en' 
                              ? `No active cases or tickets found matching your query "${docketSearchQuery}". Try clearing the search or verifying the details.` 
                              : `آپ کی درج کردہ تلاش "${docketSearchQuery}" کے مطابق کوئی کیس نہیں ملا۔ برائے مہربانی الفاظ چیک کریں یا سرچ صاف کریں۔`)
                            : (lang === 'en' 
                              ? "There are no consultation tickets matching the selected range. Click below to instantly schedule standard test dockets."
                              : "نتائج خالی ہیں۔ آپ ٹیسٹنگ کے لیے نیچے دیے گئے بٹنوں سے آج یا کل کا عارضی ٹیسٹ ڈیٹا شامل کر سکتے ہیں۔")}
                        </p>

                        {/* Quick testing button row */}
                        {!docketSearchQuery.trim() ? (
                          <div className="flex justify-center flex-wrap gap-2.5 mt-4">
                            <button
                              onClick={() => handleCreateQuickDocket(0)}
                              className="px-4 py-1.5 bg-[#cfb53b]/10 hover:bg-[#cfb53b]/20 border border-[#cfb53b]/30 text-[#cfb53b] rounded font-bold text-[11px] uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {lang === 'en' ? "Schedule Test for Today" : "آج کا ٹیسٹ کیس درج کریں"}
                            </button>
                            <button
                              onClick={() => handleCreateQuickDocket(1)}
                              className="px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded font-bold text-[11px] uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {lang === 'en' ? "Schedule Test for Tomorrow" : "کل کا ٹیسٹ کیس درج کریں"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDocketSearchQuery("")}
                            className="mt-4 px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[#cfb53b] rounded font-bold text-[11px] uppercase tracking-wide transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            {lang === 'en' ? "Clear Search Filter" : "تلاش صاف کریں"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Quick additions toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-xs gap-3">
                          <span className="text-slate-400 font-medium">
                            {lang === 'en' 
                              ? `Displaying ${docketConsultations.length} hearing record(s) matching focus` 
                              : `منتخب فلٹر کے مطابق کل ${docketConsultations.length} کیسز کی فہرست`}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCreateQuickDocket(0)}
                              className="text-[10px] px-2.5 py-1 bg-[#cfb53b]/5 hover:bg-[#cfb53b]/10 text-amber-400 border border-[#cfb53b]/20 rounded font-semibold transition"
                            >
                              + {lang === 'en' ? "Add Test Today" : "آج کا عارضی کیس"}
                            </button>
                            <button
                              onClick={() => handleCreateQuickDocket(1)}
                              className="text-[10px] px-2.5 py-1 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded font-semibold transition"
                            >
                              + {lang === 'en' ? "Add Test Tomorrow" : "کل کا عارضی کیس"}
                            </button>
                          </div>
                        </div>

                        {/* List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <AnimatePresence mode="popLayout">
                            {docketConsultations.map((item) => {
                              const isToday = item.date === getTodayString();
                              return (
                                <motion.div 
                                  layout
                                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                  transition={{ duration: 0.2 }}
                                  key={item.id}
                                  className={`p-4 rounded-lg border transition duration-300 relative overflow-hidden flex flex-col justify-between ${
                                    item.urgency === "Urgent" 
                                      ? "bg-slate-950/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_22px_rgba(239,68,68,0.45)] hover:border-red-400" 
                                      : "bg-slate-950/80 border-slate-800 hover:border-[#cfb53b]/40"
                                  }`}
                                >
                                  {/* Left indicator ribbon */}
                                  <div className={`absolute top-0 bottom-0 left-0 w-[4px] ${
                                    isToday ? "bg-[#cfb53b]" : "bg-blue-500"
                                  }`} />

                                  <div className="pl-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
                                          {item.id}
                                        </span>
                                        {item.urgency === "Urgent" && (
                                          <span className="px-1.5 py-0.5 rounded bg-red-500/25 border border-red-500/45 text-[8px] text-red-400 font-extrabold tracking-widest animate-pulse uppercase">
                                            {lang === 'en' ? "Urgent" : "ارجنٹ"}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Date indicator badge */}
                                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 ${
                                        isToday 
                                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
                                          : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-amber-400 animate-pulse" : "bg-blue-400"}`} />
                                        {isToday ? (lang === 'en' ? "TODAY" : "آج") : (lang === 'en' ? "TOMORROW" : "کل")}
                                      </span>
                                    </div>

                                    {/* Client Profile and Contact */}
                                    <div className="space-y-1">
                                      <h5 className="text-sm font-semibold text-slate-105 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        {item.name}
                                      </h5>
                                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-emerald-500" />
                                        {item.phone}
                                      </p>
                                      <div className="text-[11px] text-[#cfb53b] bg-[#cfb53b]/5 px-2 py-1 rounded inline-block font-mono tracking-wide mt-1.5 border border-[#cfb53b]/10">
                                        {item.service}
                                      </div>
                                      <p className="text-[11px] text-slate-300 mt-2 line-clamp-3 italic font-light bg-slate-900/40 p-2.5 rounded border border-slate-900 leading-relaxed">
                                        &ldquo;{item.details}&rdquo;
                                      </p>
                                    </div>
                                  </div>

                                  {/* Card Lower Controls */}
                                  <div className="mt-4 pt-3 border-t border-slate-900/80 flex flex-wrap items-center justify-between gap-2 text-xs pl-2">
                                    {/* Status Select */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'en' ? "Status:" : "حالت:"}</span>
                                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-[#050915]" style={{
                                        borderColor: item.status === "Pending" ? "rgba(245, 158, 11, 0.25)" : item.status === "Scheduled" ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)"
                                      }}>
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
                                          backgroundColor: item.status === "Pending" ? "#f59e0b" : item.status === "Scheduled" ? "#3b82f6" : "#10b981"
                                        }} />
                                        <select
                                          value={item.status}
                                          onChange={(e) => updateRequestStatus(item.id, e.target.value as any)}
                                          className="bg-transparent border-none text-[10px] font-bold p-0 focus:ring-0 focus:outline-none cursor-pointer"
                                          style={{
                                            color: item.status === "Pending" ? "#f59e0b" : item.status === "Scheduled" ? "#3b82f6" : "#10b981"
                                          }}
                                        >
                                          <option value="Pending" className="bg-[#050915] text-[#f59e0b] font-semibold">{t.adminStatusPending}</option>
                                          <option value="Scheduled" className="bg-[#050915] text-[#3b82f6] font-semibold">{t.adminStatusScheduled}</option>
                                          <option value="Completed" className="bg-[#050915] text-[#10b981] font-semibold">{t.adminStatusCompleted}</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Quick Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => setSelectedRequestDetails(item)}
                                        className="px-2.5 py-1 bg-[#112347] hover:bg-[#1b356c] border border-slate-800 text-amber-400 text-[10px] rounded font-bold transition"
                                      >
                                        {lang === 'en' ? "Review" : "جائزہ"}
                                      </button>
                                      <a
                                        href={getWhatsAppUrl(item, lang)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={lang === 'en' ? "Confirm via WhatsApp" : "واٹس ایپ پر تصدیق کریں"}
                                        className="p-1.5 bg-emerald-950/25 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 rounded border border-emerald-500/25 flex items-center justify-center transition"
                                      >
                                        <WhatsAppIcon className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        onClick={() => handlePrint(item)}
                                        title={lang === 'en' ? "Print Summary" : "پرنٹ کریں"}
                                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteRequest(item.id)}
                                        title={lang === 'en' ? "Archive Petition" : "خارج کریں"}
                                        className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-950/30"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop view Grid of booked consultations */}
                  <div className="overflow-x-auto border border-slate-900 rounded-lg" id="console-table-host">
                    <table className="w-full text-left bg-slate-950/40 text-xs font-light" dir="ltr">
                      <thead className="bg-[#0d1633] border-b border-slate-900 text-[11px] font-bold text-[#cfb53b] uppercase tracking-wider">
                        <tr>
                          <th className="p-3 text-center">Ticket ID</th>
                          <th className="p-3">Client info</th>
                          <th className="p-3">Required service</th>
                          <th className="p-3">Session Date</th>
                          <th className="p-3 text-center">Urgency</th>
                          <th className="p-3 text-center">Desk Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <AnimatePresence mode="popLayout">
                          {filteredConsultations.length === 0 ? (
                            <motion.tr
                              key="empty-state"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <td colSpan={7} className="p-8 text-center text-slate-505 font-medium italic">
                                {t.adminNoRequests}
                              </td>
                            </motion.tr>
                          ) : (
                            filteredConsultations.map((item) => (
                              <motion.tr 
                                key={item.id} 
                                layout
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.18 }}
                                className="hover:bg-slate-900/60 transition"
                              >
                                
                                <td className="p-3 text-center font-mono font-bold text-amber-500 whitespace-nowrap">
                                  {item.id}
                                </td>

                                <td className="p-3">
                                  <div className="font-semibold text-slate-200">{item.name}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 tracking-wide">{item.phone}</div>
                                </td>

                                <td className="p-3 text-slate-300 max-w-xs truncate">
                                  {item.service}
                                </td>

                                <td className="p-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                                  {item.date}
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.urgency === "Urgent" 
                                      ? "bg-red-500/15 text-red-400 border border-red-500/30" 
                                      : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {item.urgency}
                                  </span>
                                </td>

                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border bg-[#050915] justify-center" style={{
                                    borderColor: item.status === "Pending" ? "rgba(245, 158, 11, 0.25)" : item.status === "Scheduled" ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)"
                                  }}>
                                    <span className="w-2 h-2 rounded-full animate-pulse" style={{
                                      backgroundColor: item.status === "Pending" ? "#f59e0b" : item.status === "Scheduled" ? "#3b82f6" : "#10b981"
                                    }} />
                                    <select
                                      value={item.status}
                                      onChange={(e) => updateRequestStatus(item.id, e.target.value as any)}
                                      className="bg-transparent border-none text-[11px] font-bold p-0 focus:ring-0 focus:outline-none cursor-pointer"
                                      style={{
                                        color: item.status === "Pending" ? "#f59e0b" : item.status === "Scheduled" ? "#3b82f6" : "#10b981"
                                      }}
                                    >
                                      <option value="Pending" className="bg-[#050915] text-[#f59e0b] font-semibold">{t.adminStatusPending}</option>
                                      <option value="Scheduled" className="bg-[#050915] text-[#3b82f6] font-semibold">{t.adminStatusScheduled}</option>
                                      <option value="Completed" className="bg-[#050915] text-[#10b981] font-semibold">{t.adminStatusCompleted}</option>
                                    </select>
                                  </div>
                                </td>

                                <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                                  <button
                                    onClick={() => setSelectedRequestDetails(item)}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-[#112347] border border-slate-800 text-amber-400 rounded-sm font-semibold text-[11px] transition"
                                  >
                                    Open
                                  </button>
                                  <a
                                    href={getWhatsAppUrl(item, lang)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={lang === 'en' ? "Confirm via WhatsApp" : "واٹس ایپ کریں"}
                                    className="p-1 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 rounded border border-emerald-500/25 inline-flex items-center align-middle"
                                  >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handlePrint(item)}
                                    title="Print Intake Docket"
                                    className="p-1 text-slate-400 hover:text-white inline-block align-middle"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteRequest(item.id)}
                                    title="Archive Petition"
                                    className="p-1 text-red-400 hover:text-red-300 inline-block align-middle"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>

                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* ACTIVE DETAILED DRAWER (Displays deep case description and lets lawyer write followup notes) */}
                  <AnimatePresence>
                    {selectedRequestDetails && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-950 p-5 rounded-lg border border-amber-500/40 space-y-4"
                        id="docket-active-panel"
                      >
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                          <div>
                            <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider uppercase block">CASE INTAKE DETAIL BRIEFING</span>
                            <h4 className="text-sm font-serif font-bold text-white">
                              {selectedRequestDetails.name} — {selectedRequestDetails.id}
                            </h4>
                          </div>
                          <button 
                            onClick={() => setSelectedRequestDetails(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                          <div>
                            <p className="text-slate-500 font-bold uppercase text-[10px]">Case Target Category</p>
                            <p className="text-slate-200 mt-1 text-sm">{selectedRequestDetails.service}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-bold uppercase text-[10px]">Client Mobile Number</p>
                            <p className="text-slate-200 mt-1 text-sm font-mono">{selectedRequestDetails.phone}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-bold uppercase text-[10px]">Docket Current Status</p>
                            <div className="inline-block mt-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                              <select
                                value={selectedRequestDetails.status}
                                onChange={(e) => updateRequestStatus(selectedRequestDetails.id, e.target.value as any)}
                                className="bg-transparent border-none text-xs font-bold p-0 focus:ring-0 focus:outline-none cursor-pointer"
                                style={{
                                  color: selectedRequestDetails.status === "Pending" ? "#f59e0b" : selectedRequestDetails.status === "Scheduled" ? "#3b82f6" : "#10b981"
                                }}
                              >
                                <option value="Pending" className="bg-[#050915] text-[#f59e0b] font-semibold">{t.adminStatusPending}</option>
                                <option value="Scheduled" className="bg-[#050915] text-[#3b82f6] font-semibold">{t.adminStatusScheduled}</option>
                                <option value="Completed" className="bg-[#050915] text-[#10b981] font-semibold">{t.adminStatusCompleted}</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs">
                          <p className="text-slate-500 font-bold uppercase text-[10px]">Message Particulars Given</p>
                          <p className="text-slate-300 bg-slate-900/60 p-3 rounded mt-1 border border-slate-900 leading-relaxed max-h-[140px] overflow-y-auto font-light">
                            {selectedRequestDetails.details}
                          </p>
                        </div>

                        {/* Interactive Case notes section */}
                        <div className="text-xs space-y-2">
                          <label className="block text-slate-500 font-bold uppercase text-[10px]">
                            {lang === 'en' ? "Internal Advocate Case Notes (Autosaved instantly)" : "ایڈووکیٹ کے اندرونی نوٹس (فوری آٹو سیو)"}
                          </label>
                          <textarea
                            rows={3}
                            value={selectedRequestDetails.notes || ""}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setSelectedRequestDetails(prev => prev ? { ...prev, notes: newVal } : null);
                            }}
                            onBlur={(e) => updateRequestNotes(selectedRequestDetails.id, e.target.value)}
                            placeholder={lang === 'en' ? "Write internal legal strategy, hearing date confirmations, or required bar archives here..." : "یہاں کیس کی حکمت عملی، تاریخ پیشی یا دیگر تفصیلات درج کریں..."}
                            className="w-full px-3 py-2 bg-[#090e21] border border-slate-800 rounded font-medium focus:outline-none focus:border-[#cfb53b] leading-relaxed"
                          />

                          {/* Spoken case notes audio summary recorder */}
                          <div className="bg-[#040713]/60 border border-slate-900 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in mt-1">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                {isRecording && (
                                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={isRecording ? stopRecordingAudio : startRecordingAudio}
                                  disabled={recordingLoading}
                                  className={`p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    isRecording 
                                      ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                                      : "bg-slate-900 border border-slate-800 text-amber-500 hover:text-amber-400 hover:border-amber-500/50"
                                  }`}
                                  title={isRecording ? (lang === 'en' ? "Stop Recording" : "ریکارڈنگ روکیں") : (lang === 'en' ? "Record Audio Case Note" : "آڈیو کیس نوٹ ریکارڈ کریں")}
                                >
                                  {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              
                              <div>
                                <p className="font-bold text-[11px] text-slate-300">
                                  {isRecording 
                                    ? (lang === 'en' ? "Recording Case Update..." : "کیس اپ ڈیٹ ریکارڈ ہو رہا ہے...") 
                                    : recordingLoading 
                                      ? (lang === 'en' ? "Gemini Transcribing Audio..." : "جیمنائی آڈیو ٹرانسکرائب کر رہا ہے...")
                                      : (lang === 'en' ? "Speak Audio Summary" : "آڈیو خلاصہ ریکارڈ کریں")
                                  }
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                                  {isRecording 
                                    ? `${lang === 'en' ? "Duration" : "وقت"}: ${Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:${(recordingDuration % 60).toString().padStart(2, "0")}`
                                    : recordingLoading
                                      ? (lang === 'en' ? "AI is processing and saving speech summaries..." : "مصنوعی ذہانت آڈیو کا خلاصہ تیار کر کے محفوظ کر رہی ہے...")
                                      : (lang === 'en' ? "Record quick spoken summaries to automatically transcribe via AI." : "آڈیو ریکارڈ کریں جسے جیمنائی خود بخود تحریر میں بدل کر نوٹس میں محفوظ کر دے گا۔")
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {recordingLoading && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[9px] tracking-wide uppercase animate-pulse">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  {lang === 'en' ? "Transcribing" : "تحریر ہو رہی ہے"}
                                </span>
                              )}
                              {isRecording && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[9px] tracking-wide uppercase">
                                  <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                                  {lang === 'en' ? "Live Mic" : "مائیک آن ہے"}
                                </span>
                              )}
                              {!isRecording && !recordingLoading && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase font-semibold">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                  Gemini 3.5
                                </span>
                              )}
                            </div>
                          </div>

                          {recordingError && (
                            <p className="text-[10px] text-red-400 font-medium bg-red-950/25 border border-red-900/40 p-2 rounded leading-relaxed animate-fade-in">
                              {recordingError}
                            </p>
                          )}
                        </div>

                        {/* CASE DOCUMENT CHECKLIST */}
                        <div className="bg-[#050916] border border-slate-900 rounded-xl p-4 space-y-3.5" id="case-documents-checklist">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                                {lang === 'en' ? "Required Case Documents Checklist" : "مطلوبہ قانونی دستاویزات چیک لسٹ"}
                              </h5>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {getCaseDocuments(selectedRequestDetails.documents).filter(d => d.checked).length} / {getCaseDocuments(selectedRequestDetails.documents).length} {lang === 'en' ? "Verified" : "تصدیق شدہ"}
                            </span>
                          </div>

                          {/* Progress bar */}
                          {(() => {
                            const list = getCaseDocuments(selectedRequestDetails.documents);
                            const checkedCount = list.filter(d => d.checked).length;
                            const pct = list.length > 0 ? Math.round((checkedCount / list.length) * 100) : 0;
                            return (
                              <div className="space-y-1">
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#cfb53b] to-amber-500 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-500">
                                  <span>{pct}% {lang === 'en' ? "Complete" : "مکمل"}</span>
                                  <span>{lang === 'en' ? "Mandatory filings for Court dockets" : "عدالتی چیمبر لازمی فائلنگز"}</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Documents grid */}
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {getCaseDocuments(selectedRequestDetails.documents).map((doc) => (
                              <div 
                                key={doc.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition duration-200 ${
                                  doc.checked 
                                    ? "bg-amber-500/5 border-amber-500/20 text-slate-200" 
                                    : "bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400"
                                }`}
                              >
                                <label className="flex items-start gap-2.5 cursor-pointer select-none w-full">
                                  <input 
                                    type="checkbox"
                                    checked={doc.checked}
                                    onChange={() => toggleDocumentCheck(doc.id)}
                                    className="mt-0.5 rounded border-slate-800 text-[#cfb53b] focus:ring-amber-500/20 focus:ring-offset-0 focus:outline-none cursor-pointer accent-[#cfb53b] w-3.5 h-3.5"
                                  />
                                  <div className="text-left">
                                    <span className={`text-[11px] font-medium leading-normal ${doc.checked ? "line-through text-slate-500" : ""}`}>
                                      {lang === 'en' ? doc.nameEn : (doc.nameUr || doc.nameEn)}
                                    </span>
                                    {/* Subtitle with opposite language if standard item */}
                                    {!doc.isCustom && (
                                      <span className="block text-[9px] text-slate-500 font-light leading-tight mt-0.5">
                                        {lang === 'en' ? doc.nameUr : doc.nameEn}
                                      </span>
                                    )}
                                    {doc.isCustom && (
                                      <span className="inline-block text-[8px] bg-slate-900 text-[#cfb53b] px-1.5 py-0.5 rounded border border-slate-800/80 font-mono font-bold ml-1">
                                        CUSTOM
                                      </span>
                                    )}
                                  </div>
                                </label>

                                {doc.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => deleteCustomDocument(doc.id)}
                                    className="p-1 rounded bg-slate-900/80 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/30 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                    title={lang === 'en' ? "Delete Custom Item" : "حذف کریں"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Add Custom document inline form */}
                          <form onSubmit={addCustomDocument} className="flex gap-2 pt-1 border-t border-slate-900/60">
                            <input 
                              type="text"
                              value={newDocName}
                              onChange={(e) => setNewDocName(e.target.value)}
                              placeholder={lang === 'en' ? "Add custom file (e.g. Rent Deed, FIR copy)..." : "دیگر دستاویز شامل کریں (مثلاً رینٹ ڈیڈ)..."}
                              className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded text-[11px] font-medium focus:outline-none focus:border-[#cfb53b]"
                            />
                            <button
                              type="submit"
                              disabled={!newDocName.trim()}
                              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-[#cfb53b] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                              {lang === 'en' ? "Add" : "شامل کریں"}
                            </button>
                          </form>
                        </div>

                        {/* Case Progress History Timeline & Logs */}
                        <div className="text-xs space-y-2">
                          <label className="block text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            {lang === 'en' ? "Case Status Audit History" : "کیس کی پیشرفت اور عدالتی لاگز"}
                          </label>
                          <div className="bg-[#050916] border border-slate-900 rounded p-3 max-h-[160px] overflow-y-auto">
                            {!selectedRequestDetails.statusHistory || selectedRequestDetails.statusHistory.length === 0 ? (
                              <p className="text-slate-500 italic text-[11px] py-1">
                                {lang === 'en' ? "No historical records logged." : "کوئی تاریخی لاگز موجود نہیں۔"}
                              </p>
                            ) : (
                              <div className="relative pl-3 border-l border-slate-800 space-y-3.5 my-1 ml-1.5">
                                {[...selectedRequestDetails.statusHistory]
                                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                  .map((hist, idx) => {
                                    const isLatest = idx === 0;
                                    const bulletColor = 
                                      hist.status === "Pending" ? "bg-amber-500" : 
                                      hist.status === "Scheduled" ? "bg-blue-500" : 
                                      "bg-emerald-500";
                                    return (
                                      <div key={hist.id || idx} className="relative">
                                        <span className={`absolute -left-[17.5px] top-1 w-2 h-2 rounded-full ${bulletColor} ${isLatest ? 'ring-4 ring-amber-500/20 animate-pulse' : ''}`} />
                                        <div className="space-y-0.5">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-slate-300">
                                              {hist.status === "Pending" ? (lang === 'en' ? "Pending" : "زیر التوا") :
                                               hist.status === "Scheduled" ? (lang === 'en' ? "Scheduled" : "شیڈولڈ") :
                                               (lang === 'en' ? "Completed" : "مکمل شدہ")}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-mono">
                                              {new Date(hist.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'ur-PK', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-slate-400 font-light text-[11px] leading-relaxed">{hist.notes}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick call dial route */}
                        <div className="flex justify-end gap-3 pt-2 flex-wrap">
                          <button
                            onClick={() => exportCaseHistoryPDF(selectedRequestDetails)}
                            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-[#cfb53b] hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs rounded transition flex items-center gap-1.5 cursor-pointer shadow"
                            id="btn-export-case-history-pdf"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {lang === 'en' ? "Export History PDF" : "مکمل پی ڈی ایف رپورٹ"}
                          </button>
                          <a
                            href={`tel:${selectedRequestDetails.phone}`}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded transition uppercase tracking-wider flex items-center gap-1.5"
                          >
                            Dial Client Number
                          </a>
                          <button
                            onClick={() => handlePrint(selectedRequestDetails)}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded transition"
                          >
                            Print Summary
                          </button>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                      </div> {/* End Right Side Column */}
                    </div> {/* End Grid Wrapper */}

                  <div className="flex justify-end pt-2 border-t border-slate-900">
                    <button
                      onClick={() => setShowAdminModal(false)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded"
                      id="btn-close-admin-footer"
                    >
                      {t.adminCloseBtn}
                    </button>
                  </div>

                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chamber Photo Gallery Lightbox Modal */}
      <AnimatePresence>
        {isPhotoLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPhotoLightboxOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md cursor-zoom-out"
            id="chamber-gallery-lightbox"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-[#050814] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4 cursor-default"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#cfb53b]" />
                  <h3 className="font-serif text-sm sm:text-base font-bold text-slate-100 tracking-wide">
                    {lang === 'en' ? "Verified Chamber Environment" : "تصدیق شدہ چیمبر ماحول"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer border border-transparent hover:border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Large Image Frame */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-900 group">
                <img
                  src={chamberPhotos[activePhotoIdx].url}
                  alt={chamberPhotos[activePhotoIdx].titleEn}
                  className="w-full h-full object-cover"
                />

                {/* Left/Right buttons inside the Lightbox */}
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx(prev => (prev === 0 ? chamberPhotos.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/90 hover:bg-[#cfb53b] text-slate-300 hover:text-slate-950 transition border border-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx(prev => (prev === chamberPhotos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/90 hover:bg-[#cfb53b] text-slate-300 hover:text-slate-950 transition border border-slate-800 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Details Section */}
              <div className="bg-[#090e21] rounded-xl border border-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm sm:text-base font-bold text-amber-400">
                    {lang === 'en' ? chamberPhotos[activePhotoIdx].titleEn : chamberPhotos[activePhotoIdx].titleUr}
                  </h4>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
                    IMAGE {activePhotoIdx + 1} OF {chamberPhotos.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {lang === 'en' ? chamberPhotos[activePhotoIdx].descEn : chamberPhotos[activePhotoIdx].descUr}
                </p>
              </div>

              {/* Bottom Thumbnails */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                {chamberPhotos.map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActivePhotoIdx(index)}
                    className={`relative aspect-video rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      activePhotoIdx === index
                        ? "border-[#cfb53b] ring-2 ring-[#cfb53b]/25 scale-102"
                        : "border-slate-900 hover:border-slate-700 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.titleEn}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
