export interface TranslationSet {
  navTitle: string;
  navSubtitle: string;
  home: string;
  about: string;
  services: string;
  reviews: string;
  consultation: string;
  location: string;
  contactBtn: string;
  welcomeHeroTitle: string;
  welcomeHeroSubtitle: string;
  heroTagline: string;
  heroBadge: string;
  ctaConsultation: string;
  ctaWhatsApp: string;

  // Advocate profile
  profileTitle: string;
  profileSubtitle: string;
  profileName: string;
  profileDesignation: string;
  profileBio: string;
  educationLabel: string;
  educationValue: string;
  experienceLabel: string;
  experienceValue: string;
  licenceLabel: string;
  licenceValue: string;
  keyValuesTitle: string;
  keyValuesDesc: string;

  // Key values card titles
  valIntegrity: string;
  valIntegrityDesc: string;
  valExcellence: string;
  valExcellenceDesc: string;
  valDiligence: string;
  valDiligenceDesc: string;

  // Services section
  servicesTitle: string;
  servicesSubtitle: string;
  service1Title: string;
  service1Desc: string;
  service2Title: string;
  service2Desc: string;
  service3Title: string;
  service3Desc: string;
  service4Title: string;
  service4Desc: string;
  service5Title: string;
  service5Desc: string;
  service6Title: string;
  service6Desc: string;

  // Consultation form
  consultTitle: string;
  consultSubtitle: string;
  formName: string;
  formPhone: string;
  formService: string;
  formSelectPlaceholder: string;
  formDate: string;
  formMsg: string;
  formMsgPlaceholder: string;
  formUrgency: string;
  formUrgencyUrgent: string;
  formUrgencyNormal: string;
  formSubmitBtn: string;
  formSubmitting: string;
  formSuccessMsg: string;
  formSuccessClose: string;
  formValidationError: string;

  // Reviews
  reviewsTitle: string;
  reviewsSubtitle: string;
  review1Author: string;
  review1Role: string;
  review1Text: string;
  review2Author: string;
  review2Role: string;
  review2Text: string;
  review3Author: string;
  review3Role: string;
  review3Text: string;
  review4Author: string;
  review4Role: string;
  review4Text: string;

  // Interactive Map & Office Info
  locationTitle: string;
  locationSubtitle: string;
  officeHoursLabel: string;
  officeHoursValue: string;
  addressLabel: string;
  addressValue: string;
  phoneLabel: string;
  emailLabel: string;
  whatsappNotice: string;

  // Admin section
  adminLoginBtn: string;
  adminModalTitle: string;
  adminPasswordLabel: string;
  adminPasswordPlaceholder: string;
  adminLoginSubmit: string;
  adminWrongPassword: string;
  adminConsoleTitle: string;
  adminLogout: string;
  adminNoRequests: string;
  adminColName: string;
  adminColPhone: string;
  adminColService: string;
  adminColDate: string;
  adminColUrgency: string;
  adminColDetails: string;
  adminColStatus: string;
  adminStatusPending: string;
  adminStatusScheduled: string;
  adminStatusCompleted: string;
  adminActionDelete: string;
  adminActionPrint: string;
  adminCloseBtn: string;
  
  // Extra elements
  totalRequests: string;
  quickContact: string;
  callNow: string;
  verifiedReview: string;
}

export const translations: Record<'en' | 'ur', TranslationSet> = {
  en: {
    navTitle: "JUSTICE DIGITAL DESK",
    navSubtitle: "High Court Advocates & Legal Consultants",
    home: "Home",
    about: "Advocate Profile",
    services: "Legal Practice Area",
    reviews: "Client Testimonials",
    consultation: "Online Consultation",
    location: "Our Chambers",
    contactBtn: "Contact Desk",
    welcomeHeroTitle: "Guardians of Justice, Champions of Truth",
    welcomeHeroSubtitle: "Advocate Muhammad Shafiq Gurmani delivers meticulous, relentless, and high-caliber legal defense and advisory representation in civil, criminal, and constitutional courts of Pakistan.",
    heroTagline: "Advocate Muhammad Shafiq Gurmani (High Court Advocate)",
    heroBadge: "ESTABLISHED LAW PRACTICE",
    ctaConsultation: "Book Free Digital Consultation",
    ctaWhatsApp: "Immediate WhatsApp Assist",

    // Advocate profile
    profileTitle: "Senior Counsel Profile",
    profileSubtitle: "Unrelenting Pursuit of Justice and Meticulous Practice",
    profileName: "Muhammad Shafiq Gurmani",
    profileDesignation: "Advocate High Court (LL.B, LL.M Legal Studies)",
    profileBio: "Advocate Muhammad Shafiq Gurmani is a seasoned member of the District and High Court Bar Association, specializing in High Court Writ Petitions, complex Civil litigation, severe Criminal disputes, and Corporate consultations. With over a decade of dedication to the justice system of Pakistan, the chamber prides itself on bulletproof litigation frameworks, unparalleled court presence, and absolute dedication to client success.",
    educationLabel: "Credentials",
    educationValue: "B.A, LL.B (Punjab University), Master of Laws (LL.M)",
    experienceLabel: "Court Standing",
    experienceValue: "12+ Years Active Bar Practice (High Court Advocate)",
    licenceLabel: "Authorized Jurisdictions",
    licenceValue: "All High Courts & Subordinate Tribunals of Pakistan",
    keyValuesTitle: "Chamber Pillars",
    keyValuesDesc: "The core ethical and professional philosophies driving our litigation achievements.",
    
    valIntegrity: "Absolute Integrity",
    valIntegrityDesc: "We provide realistic legal diagnostics, upfront counseling, and uphold elite ethical statutes of the Bar.",
    valExcellence: "Strategic Litigation",
    valExcellenceDesc: "Every legal defense or statement of claim is drafted with exhaustive precedent research and sharp legal arguments.",
    valDiligence: "Fierce Representation",
    valDiligenceDesc: "We appear dynamically on every hearing, leaving no stone unturned to secure relief and orders from the honorable courts.",

    // Services section
    servicesTitle: "Strategic Legal Services",
    servicesSubtitle: "Distinguished advisory & litigation across multiple active court hierarchies",
    service1Title: "Criminal Defense & Appeals",
    service1Desc: "Comprehensive defense representation, high court bail applications, NAB litigation, and expert appeals against conviction.",
    service2Title: "Civil Suits & Land Disputes",
    service2Desc: "Land partition, specific performance, perpetual injunctions, revenue records correction, and supreme title challenges.",
    service3Title: "Family & Guardianship Law",
    service3Desc: "Empathetic and strategic resolution of family matters, child custody, maintenance petitions, and custom dower recovery.",
    service4Title: "Corporate & Tax Consultation",
    service4Desc: "Corporate business registrations, SECP compliance filing, FBR tax representations, and commercial contract negotiations.",
    service5Title: "Constitutional Writs",
    service5Desc: "High Court petitions seeking enforcement of fundamental human rights, mandamus orders, and public interest litigation.",
    service6Title: "Property Agreements & Verification",
    service6Desc: "Impeccable legal vetting of housing schemes, power of attorney, partition deeds, and registration documentation.",

    // Consultation form
    consultTitle: "Book Online Consultation",
    consultSubtitle: "Fill out the secured form to schedule an executive slot with Advocate Muhammad Shafiq Gurmani.",
    formName: "Your Full Name",
    formPhone: "Mobile / WhatsApp Number",
    formService: "Legal Service Required",
    formSelectPlaceholder: "-- Select Legal Practice Area --",
    formDate: "Preferred Consultation Date",
    formMsg: "Brief Case Background / Legal Query",
    formMsgPlaceholder: "Please describe your current court case or question in detail (confidential).",
    formUrgency: "Case Urgency Level",
    formUrgencyUrgent: "Immediate (Court Hearing Set)",
    formUrgencyNormal: "Regular (Seeking Advice / Routine)",
    formSubmitBtn: "Submit To Legal Registry",
    formSubmitting: "Registering Consultation...",
    formSuccessMsg: "Thank you. Your digital consultation token has been generated. Advocate Muhammad Shafiq Gurmani's registry office will contact you shortly.",
    formSuccessClose: "Close Alert",
    formValidationError: "Please fill in all mandatory fields with a valid format.",

    // Reviews
    reviewsTitle: "Client Reviews",
    reviewsSubtitle: "Unsolicited testimonials reflecting our high success rates and professional dedication",
    review1Author: "Mian Bashir Ahmad",
    review1Role: "Land Owner (Civil Litigation Winner)",
    review1Text: "Gurmani Sahib contested my land partition case in the High Court with absolute genius. His presentation on revenue logs and Pakistani precedents got us a stay order on day one.",
    review2Author: "Sardar Saleem Jan",
    review2Role: "Business Owner",
    review2Text: "Our corporate company had a long tax resolution issue. He represented us at appellate tribunals and saved our reputation. Very professional counsel.",
    review3Author: "Kaneez Fatima",
    review3Role: "Khula & Custody Petitioner",
    review3Text: "Advocate Shafiq Gurmani secured the custody of my two children in a very difficult custody case. He fought tirelessly and showed deep empathy throughout.",
    review4Author: "Zahid Mahmood",
    review4Role: "Acquittal Appellant",
    review4Text: "Unmatched expertise in Criminal Procedure Code. His cross-examination of state witnesses in the sessions court led to arecord absolute acquittal. Highly recommended.",

    // Location & Office Info
    locationTitle: "Molvi Law Chamber",
    locationSubtitle: "Visit our professional desk or connect in-person for complex briefing.",
    officeHoursLabel: "Chamber Business Hours",
    officeHoursValue: "Monday - Saturday (09:00 AM - 08:00 PM)",
    addressLabel: "Physical Office Address",
    addressValue: "Street No. 1, Molvi Law Chamber, District Court Muzaffargarh (Landmark: Kachehri Chowk, Muzaffargarh)",
    phoneLabel: "Advocate Phone Contact",
    emailLabel: "Official Case Email",
    whatsappNotice: "WhatsApp is managed by active registry staff for urgent bail and hearing updates.",

    // Admin section
    adminLoginBtn: "Lawyer Portal",
    adminModalTitle: "Chamber Secure Login",
    adminPasswordLabel: "Enter Professional Access Code",
    adminPasswordPlaceholder: "Enter 5-digit code (e.g. 38939)",
    adminLoginSubmit: "Authenticate Desk",
    adminWrongPassword: "Access Denied. Incorrect Passcode",
    adminConsoleTitle: "Chamber Inbox - Consultation Records",
    adminLogout: "Secure Exit",
    adminNoRequests: "No digital consultations logged yet.",
    adminColName: "Client",
    adminColPhone: "Contact Phone",
    adminColService: "Selected Area",
    adminColDate: "Scheduled Date",
    adminColUrgency: "Urgency",
    adminColDetails: "Case Description",
    adminColStatus: "Action Desk",
    adminStatusPending: "Pending Review",
    adminStatusScheduled: "Scheduled",
    adminStatusCompleted: "Resolved",
    adminActionDelete: "Archive",
    adminActionPrint: "Print Summary",
    adminCloseBtn: "Close Portal",
    
    totalRequests: "Logged Petitions",
    quickContact: "Quick Contact Route",
    callNow: "Direct Cellular line",
    verifiedReview: "Verified Legal Case Review"
  },
  ur: {
    navTitle: "جسٹس ڈیجیٹل ڈیسک",
    navSubtitle: "ہائی کورٹ ایڈووکیٹس اور قانون دان",
    home: "ہوم",
    about: "وکالت پروفائل",
    services: "شعبہ جات",
    reviews: "مستحقین کی آراء",
    consultation: "آن لائن مشاورت",
    location: "ہماری کچہری / دفتر",
    contactBtn: "رابطہ کریں",
    welcomeHeroTitle: "انصاف کے نقیب، سچائی کے ترجمان",
    welcomeHeroSubtitle: "ایڈووکیٹ محمد شفیق گورمانی پاکستان کی دیوانی، فوجداری، اور آئینی عدالتوں میں نپے تلے، بے خوف اور اعلیٰ درجے کے بہترین دفاع اور قانونی مشاورت فراہم کرتے ہیں۔",
    heroTagline: "ایڈووکیٹ محمد شفیق گورمانی (ایڈووکیٹ ہائی کورٹ)",
    heroBadge: "نامور قانون دان اور اعلیٰ خدمات",
    ctaConsultation: "مفت آن لائن قانونی مشاورت بک کریں",
    ctaWhatsApp: "فوری واٹس ایپ رابطہ",

    // Advocate profile
    profileTitle: "اعلیٰ ماہرِ قانون پروفائل",
    profileSubtitle: "انصاف کی غیر متزلزل جدوجہد اور بہترین عدالتی کارکردگی",
    profileName: "محمد شفیق گورمانی",
    profileDesignation: "ایڈووکیٹ ہائی کورٹ (LL.B, LL.M قانونی علوم)",
    profileBio: "ایڈووکیٹ محمد شفیق گورمانی ڈسٹرکٹ اور ہائی کورٹ بار ایسوسی ایشن کے ایک تپتے ہوئے رکن ہیں، جن کا خاص دائرہ کار ہائی کورٹ رٹ پٹیشنز، پیچیدہ دیوانی مقدمات، سنگین فوجداری تنازعات اور کارپوریٹ مشاورت ہے۔ پاکستان کے عدالتی نظام میں ایک دہائی سے زیادہ کی خدمت کے ساتھ، ان چیمبرز کی ترجیح مضبوط ترین پیروی، شاندار عدالتی کارکردگی، اور موکل کے حتمی ریلیف کا حصول ہے۔",
    educationLabel: "تعلیمی ڈگری",
    educationValue: "بی اے، ایل ایل بی (پنجاب یونیورسٹی)، ماسٹر آف لاز (ایل ایل ایم)",
    experienceLabel: "عدالتی تجربہ",
    experienceValue: "12 سال سے زائد مسلسل ہائی کورٹ پریکٹس",
    licenceLabel: "قانونی دائرہ کار",
    licenceValue: "تمام ہائی کورٹس اور ماتحت عدالتیں، پاکستان",
    keyValuesTitle: "چیمبرز کے اہم ستون",
    keyValuesDesc: "وہ بنیادی نظریات جو ہمارے قانونی عزائم اور کامیابیوں کے ضامن ہیں۔",

    valIntegrity: "غیر متزلزل دیانت",
    valIntegrityDesc: "ہم ہر کیس کا سچا جائزہ، دیانتدارانہ مشورہ اور قانونی اخلاقیات کا پاس رکھتے ہیں۔",
    valExcellence: "حکمتِ عملی پر مبنی پیروی",
    valExcellenceDesc: "ہر مقدمے کو تفصیلی فقہی نظیر اور مضبوط ترین دلائل کے ساتھ تیار کیا جاتا ہے۔",
    valDiligence: "بھرپور عدالتی پیروی",
    valDiligenceDesc: "ہم ہر تاریخ پر خود پیش ہو کر موکل کے حق میں حکم نامہ جاری کروانے کے لیے سرگرم رہتے ہیں۔",

    // Services section
    servicesTitle: "اعلیٰ ترین قانونی خدمات",
    servicesSubtitle: "مختلف عدالتوں میں آپ کے حقوق کے لیے بے عیب اور بروقت وکالت",
    service1Title: "فوجداری مقدمات اور ضمانت",
    service1Desc: "پولیس و نیب مقدمات میں مسلسل دفاع، ضمانت قبل از گرفتاری و بعد از گرفتاری اور سزاؤں کے خلاف ہائی کورٹ میں اپیلیں۔",
    service2Title: "دیوانی مقدمات اور زمینی تنازعات",
    service2Desc: "زمین کی تقسیم، تبادلہ، حکم امتناعی (سٹے آرڈر)، ریکارڈ پٹوار درستگی اور حق شفع کے پیچیدہ مقدمات۔",
    service3Title: "عائلی قوانین اور بچوں کی سرپرستی",
    service3Desc: "احترام کے ساتھ گھریلو جھگڑوں کا حل، تنسیخ نکاح (خلع)، بچوں کی تحویل (گارڈین شپ)، اور خرچہ و حق مہر کی وصولی۔",
    service4Title: "ٹیکس اور کارپوریٹ مشاورت",
    service4Desc: "شعبہ ہائے شراکت داری، کمنیوں کی منتقلی رجسٹریشن (SECP)، ایف بی آر کے متعلقہ مسائل اور قانونی معاہدے کا مسودہ۔",
    service5Title: "آئینی رٹ پٹیشنز",
    service5Desc: "بنیادی حقوق کی بازیابی، سرکاری اداروں کے فیصلوں کو کالعدم قرار دلوانے کے لیے ہائی کورٹ میں مضبوط تحریریں کیں۔",
    service6Title: "پراپرٹی دستاویزات اور تصدیق",
    service6Desc: "ہاؤسنگ سکیموں کے کاغذات، مختار نامہ (پاور آف اٹارنی)، اور جائیداد کی فروخت و تصدیق کے لیے قانونی رائے۔",

    // Consultation form
    consultTitle: "آن لائن مشاورت کا فارم",
    consultSubtitle: "ایڈووکیٹ محمد شفیق گورمانی کے ساتھ آن لائن یا ذاتی ملاقات کے لیے تفصیلات درج کریں۔",
    formName: "آپ کا پورا نام",
    formPhone: "موبائل یا واٹس ایپ نمبر",
    formService: "مطلوبہ قانونی خدمت",
    formSelectPlaceholder: "-- متعلقہ قانونی شعبہ منتخب کریں --",
    formDate: "مشاورت کے لیے موزوں ترین تاریخ",
    formMsg: "کیس کے مختصر حالات اور سوال",
    formMsgPlaceholder: "براہ کرم اپنے کیس کی تفصیل یا اپنا سوال یہاں لکھیں (مکمل خفیہ رکھا جائے گا)۔",
    formUrgency: "کیس کی نوعیت",
    formUrgencyUrgent: "فوری (عدالتی تاریخ مقرر ہے)",
    formUrgencyNormal: "عام نوعیت (رائے درکار ہے / معمول کا کیس)",
    formSubmitBtn: "رجسٹری چیمبر کو ارسال کریں",
    formSubmitting: "رابطہ درج ہو رہا ہے...",
    formSuccessMsg: "شکریہ۔ آپ کی مشاورت کا ٹوکن کامیابی سے بن گیا ہے۔ ایڈووکیٹ محمد شفیق گورمانی کا چیمبر آفس جلد آپ سے رابطہ کرے گا۔",
    formSuccessClose: "بند کریں",
    formValidationError: "براہ کرم تمام لازمی خانے درست موبائل نمبر کے ساتھ پر کریں۔",

    // Reviews
    reviewsTitle: "موکلینِ چیمبرز کے تاثرات",
    reviewsSubtitle: "کامیاب فیصلوں کے بعد ہمارے سچے اور مطمئن موکلین کے اپنے الفاظ",
    review1Author: "میاں بشیر احمد",
    review1Role: "زمیندار (دیوانی تنازع کے فاتح)",
    review1Text: "گورمانی صاحب نے ہائی کورٹ میں میرے اراضی کیس کی کمال وکالت کی۔ زمین کے ریکارڈز اور ریونیو قوانین پر ان کی گرفت کی وجہ سے ہمیں پہلے ہی دن سٹے مل گیا۔",
    review2Author: "سردار سلیم جان",
    review2Role: "کاروباری شخصیت",
    review2Text: "ہماری کمپنی کا ایف بی آر کا سنگین تنازعہ حل نہیں ہو رہا تھا۔ گورمانی صاحب نے اپیلٹ ٹریبونل میں ہماری شاندار نمائندگی کی اور فنڈز بحال کروائے۔",
    review3Author: "کنیز فاطمہ",
    review3Role: "خلع اور بچوں کے حقوق کی سائلہ",
    review3Text: "ایڈووکیٹ شفیق گورمانی نے انتہائی پیار اور مہارت کے ساتھ بچوں کا گارڈین شپ کیس لڑا اور مجھے حق دلایا۔ ان کا بے حد شکریہ۔",
    review4Author: "زاہد محمود",
    review4Role: "مقدمے سے بری ہونے والے",
    review4Text: "ضابطہ فوجداری پر گورمانی صاحب جیسا ماہر قانون کم زندگی میں دیکھا۔ استغاثہ کے گواہوں پر کمال جرح کر کے مجھے باعزت بری کروایا۔ زبردست وکیل۔",

    // Location & Office Info
    locationTitle: "مولوی لا چیمبر",
    locationSubtitle: "تفصیلی صلاح و مشورے کے لیے ذاتی طور پر ہمارے چیمبرز تشریف لائیں۔",
    officeHoursLabel: "ملاقات کے اوقات",
    officeHoursValue: "پیر تا ہفتہ (صبح 09:00 بجے تا رات 08:00 بجے)",
    addressLabel: "دفتر کا پتہ",
    addressValue: "اسٹریٹ نمبر 1، مولوی لا چیمبر، ڈسٹرکٹ کورٹ مظفر گڑھ (قریبی نشان: کچہری چوک، مظفر گڑھ)",
    phoneLabel: "رابطہ نمبر وکیل",
    emailLabel: "آفیشل چیمبر ای میل",
    whatsappNotice: "واٹس ایپ کا انتظام ہمارے اسسٹنٹ دیکھتے ہیں تاکہ سنگین ضمانتی ریلیف پر فوری کام ہو سکے۔",

    // Admin section
    adminLoginBtn: "وکیل پورٹل",
    adminModalTitle: "محفوظ چیمبر لاگ ان",
    adminPasswordLabel: "پیشہ ورانہ پنک کوڈ درج کریں",
    adminPasswordPlaceholder: "5 ہندسوں کا کوڈ (مثال: 38939)",
    adminLoginSubmit: "پورٹل آن کریں",
    adminWrongPassword: "رسائی مسترد کر دی گئی۔ غلط پاس ورڈ",
    adminConsoleTitle: "چیمبر ان باکس - موصولہ آن لائن درخواستیں",
    adminLogout: "محفوظ اخراج",
    adminNoRequests: "ابھی تک کوئی آن لائن مشاورت درج نہیں ہوئی۔",
    adminColName: "سائل کا نام",
    adminColPhone: "رابطہ نمبر",
    adminColService: "منتخب کردہ شعبہ",
    adminColDate: "مطلوبہ تاریخ",
    adminColUrgency: "نوعیت",
    adminColDetails: "تفصیل",
    adminColStatus: "عدالتی کارروائی",
    adminStatusPending: "زیرِ غور",
    adminStatusScheduled: "ملاقات طے شدہ",
    adminStatusCompleted: "کیس مکمل",
    adminActionDelete: "آرکائیو کریں",
    adminActionPrint: "تفصیل پرنٹ کریں",
    adminCloseBtn: "پورٹل بند کریں",
    
    totalRequests: "درج مقدمات پٹیشن",
    quickContact: "فوری رابطہ لنک",
    callNow: "براہ راست سیلولر کال",
    verifiedReview: "تصدیق شدہ عدالتی کیس جائزہ"
  }
};
