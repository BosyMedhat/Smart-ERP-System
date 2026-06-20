import type { Screen } from '../App';

export interface DemoSegment {
  id: string;
  narrationText: string;
  highlightTargetId?: string;
  pauseAfterMs: number;
  /** Short pause after narration so the user can observe the highlighted element */
  observationMs?: number;
}

export interface DemoStep {
  id: string;
  screenName: string;
  assistantMessage: string;
  actionMessage: string;
  successMessage: string;
  targetScreen: Screen | null;
  segments: DemoSegment[];
  closingStatement: string;
  transitionPauseMs: number;
  transitionStatement: string;
}

export const AI_DEMO_SCRIPT: DemoStep[] = [
  {
    id: 'welcome',
    screenName: 'المقدمة',
    assistantMessage: '🤖 مرحباً! أنا المساعد الذكي لنظام Smart ERP. سأقدم لكم عرضاً تفاعلياً يركّز على القيمة التجارية لكل موديول.',
    actionMessage: '⚡ بدء العرض التقديمي...',
    successMessage: '✅ جاهز للعرض — دعونا نستعرض Smart ERP',
    targetScreen: null,
    segments: [
      {
        id: 'welcome-intro',
        narrationText: 'مرحباً بكم في Smart ERP. أنا المساعد الذكي للنظام. خلال العرض القادم، سأستعرض معكم منصة متكاملة تجمع بين إدارة الموارد المؤسسية ERP، والذكاء الاصطناعي، والأتمتة، والتحليلات، والعلامة البيضاء. النظام مبني بتقنية Single Tenant، مما يجعله مناسباً للمتاجر والشركات والمؤسسات الكبيرة. دعونا نبدأ.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون قد تعرفنا على رؤية Smart ERP.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى لوحة التحكم لنرى لماذا Smart ERP مختلف.',
  },
  {
    id: 'why-smart-erp',
    screenName: 'لوحة التحكم',
    assistantMessage: '🎯 لماذا Smart ERP؟ — الفرق بين تخزين البيانات واتخاذ القرار',
    actionMessage: '⚡ عرض الرؤية التنافسية للنظام...',
    successMessage: '✅ Smart ERP ليس مجرد ERP تقليدي',
    targetScreen: 'home',
    segments: [
      {
        id: 'dashboard-sales',
        highlightTargetId: 'dashboard-sales-card',
        narrationText: 'نبدأ ببطاقة مبيعات اليوم. هنا يظهر حجم المبيعات والتحصيلات الفورية في اليوم الحالي. هذه البطاقة تُعطي المدير صورة فورية عن أداء اليوم دون الحاجة لاستخراج تقرير.',
        pauseAfterMs: 1000,
      },
      {
        id: 'dashboard-revenue',
        highlightTargetId: 'dashboard-revenue-card',
        narrationText: 'البطاقة الثانية: إيرادات الشهر. تُظهر إجمالي المبيعات والإيرادات المتراكمة خلال الشهر، مما يُساعد على متابعة الأهداف المالية واتخاذ القرارات التصحيحية في الوقت المناسب.',
        pauseAfterMs: 1000,
      },
      {
        id: 'dashboard-ops',
        highlightTargetId: 'dashboard-ops-card',
        narrationText: 'البطاقة الثالثة: العمليات. تُظهر عدد فواتير البيع والشراء والعمليات اليومية، مما يُعطي مؤشراً مباشراً على مستوى النشاط داخل المؤسسة.',
        pauseAfterMs: 1000,
      },
      {
        id: 'dashboard-alerts',
        highlightTargetId: 'dashboard-stock-alert',
        narrationText: 'أخيراً: تنبيهات المخزون. أي منتج وصل للحد الأدنى يظهر هنا، مما يُتيح إعادة الطلب قبل النفاد. هذه التنبيهات هي مثال على التحول من تخزين البيانات إلى اتخاذ القرار.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من لوحة التحكم.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى أداة تحليل فواتير الموردين بالذكاء الاصطناعي.',
  },
  {
    id: 'ai-supplier-invoice',
    screenName: 'تحليل فواتير الموردين',
    assistantMessage: '🧠 الذكاء الاصطناعي — تحليل فواتير الموردين واستخراج المنتجات تلقائياً',
    actionMessage: '⚡ فتح أداة تحليل فواتير الموردين...',
    successMessage: '✅ تم فتح أداة الاستيراد الذكي',
    targetScreen: 'ai',
    segments: [
      {
        id: 'pdf-upload',
        highlightTargetId: 'ai-pdf-import',
        narrationText: 'هذه منطقة رفع الفواتير. يكفي رفع صورة أو ملف PDF للفاتورة، ليقوم الذكاء الاصطناعي بقراءة محتواها وفهمها. في الأنظمة التقليدية، يُدخل الموظف كل منتج يدوياً، وهذا يستغرق ساعات ويُسبب أخطاء.',
        pauseAfterMs: 1000,
      },
      {
        id: 'extracted-products',
        highlightTargetId: 'ai-pdf-import',
        narrationText: 'بعد المعالجة، يستخرج النظام أسماء المنتجات والأسعار والكميات تلقائياً، ويعرضها للمراجعة قبل الإضافة للمخزون. القيمة: توفير الوقت، تقليل الأخطاء، وتسريع عملية الاستلام.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من أداة تحليل الفواتير.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى وحدة إدارة الموردين.',
  },
  {
    id: 'supplier-evaluation',
    screenName: 'إدارة الموردين',
    assistantMessage: '🏆 تقييم الموردين واختيار الأفضل — قرارات شراء مبنية على البيانات',
    actionMessage: '⚡ فتح وحدة تقييم الموردين...',
    successMessage: '✅ تم فتح إدارة الموردين والتقييمات',
    targetScreen: 'suppliers',
    segments: [
      {
        id: 'suppliers-summary',
        highlightTargetId: 'suppliers-stats',
        narrationText: 'في الأعلى: ملخص الموردين. يظهر عدد الموردين، التقييمات، والتوزيع. النظام لا يخزن بيانات الموردين فقط، بل يبدأ بإضافة طبقة التقييم.',
        pauseAfterMs: 1000,
      },
      {
        id: 'suppliers-list',
        highlightTargetId: 'suppliers-table',
        narrationText: 'هذا جدول الموردين. يمكن تقييم كل مورد بناءً على الجودة، سرعة التوصيل، السعر، والتواصل. هذه التقييمات تُستخدم لاحقاً في تحليل الأداء التاريخي.',
        pauseAfterMs: 1000,
      },
      {
        id: 'supplier-ai-vision',
        highlightTargetId: 'suppliers-tabs',
        narrationText: 'الرؤية المستقبلية: الذكاء الاصطناعي سيقترح المورد الأفضل تلقائياً بناءً على السعر والجودة والتاريخ. القيمة التنافسية: تحويل العلاقة مع الموردين من مجرد تسجيل إلى قرارات مبنية على بيانات.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من إدارة الموردين.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى إدارة المخزون.',
  },
  {
    id: 'inventory',
    screenName: 'إدارة المخزون',
    assistantMessage: '📦 إدارة المخزون — رؤية كاملة وتحكم فوري في المنتجات',
    actionMessage: '⚡ فتح شاشة المخزون...',
    successMessage: '✅ تم فتح المخزون بنجاح',
    targetScreen: 'inventory',
    segments: [
      {
        id: 'products-table',
        highlightTargetId: 'inventory-table',
        narrationText: 'هذا جدول المنتجات. النظام يحتفظ بسجل كامل: الاسم، الكود، المورد، الكمية، سعر التكلفة، وسعر البيع. يمكن البحث والتصفية والمراجعة الفورية.',
        pauseAfterMs: 1000,
      },
      {
        id: 'inventory-search',
        highlightTargetId: 'inventory-search',
        narrationText: 'هنا أدوات البحث والتصفية. يمكن البحث بالاسم أو الكود أو المورد، والتصفية حسب التصنيف. هذه السرعة تُقلل الوقت المهدور في البحث عن المنتجات.',
        pauseAfterMs: 1000,
      },
      {
        id: 'barcode-scan',
        highlightTargetId: 'inventory-barcode-section',
        narrationText: 'هذا قسم الباركود. يدعم النظام مسح الباركود مباشرة لتسريع استلام البضاعة والجرد. القيمة: تجنب النفاد المفاجئ وتقليل رأس المال المُقيّد في المخزون الزائد.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من إدارة المخزون.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى نقطة البيع.',
  },
  {
    id: 'pos',
    screenName: 'نقطة البيع',
    assistantMessage: '🛒 نقطة البيع — إتمام المبيعات بسرعة ومرونة',
    actionMessage: '⚡ فتح نقطة البيع...',
    successMessage: '✅ تم فتح نقطة البيع بنجاح',
    targetScreen: 'pos',
    segments: [
      {
        id: 'product-grid',
        highlightTargetId: 'pos-product-grid',
        narrationText: 'هذه شبكة المنتجات. تم تصميم نقطة البيع لتكون سريعة: يمكن إضافة المنتجات بالبحث، الباركود، أو الفئات، مما يُقلل الوقت على كل عملية بيع.',
        pauseAfterMs: 1000,
      },
      {
        id: 'cart',
        highlightTargetId: 'pos-cart',
        narrationText: 'هذه سلة المشتريات. تظهر المنتجات المختارة والخصومات والضريبة والإجمالي بوضوح، مما يُقلل الأخطاء الحسابية ويُساعد الكاشير.',
        pauseAfterMs: 1000,
      },
      {
        id: 'payment',
        highlightTargetId: 'pos-payment-section',
        narrationText: 'أخيراً: طرق الدفع. النظام يدعم كاش، بطاقة، فودافون كاش، وإنستاباي. كما يدعم البيع بالآجل والتقسيط، مع ربط العملاء تلقائياً بسجل المديونيات.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من نقطة البيع.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى إدارة العملاء.',
  },
  {
    id: 'customer-crm',
    screenName: 'إدارة العملاء',
    assistantMessage: '👥 العملاء وإدارة العلاقات — رؤية شاملة لكل عميل',
    actionMessage: '⚡ فتح قاعدة بيانات العملاء...',
    successMessage: '✅ تم فتح إدارة العملاء',
    targetScreen: 'customers_pos',
    segments: [
      {
        id: 'customers-header',
        highlightTargetId: 'customers-header',
        narrationText: 'هذا رأس شاشة العملاء. حالياً، يحتفظ النظام ببيانات كل عميل، تاريخ مشترياته، والرصيد المستحق. هذا يُتيح تتبع المديونيات وتقديم خدمة أفضل.',
        pauseAfterMs: 1000,
      },
      {
        id: 'customers-search',
        highlightTargetId: 'customers-search',
        narrationText: 'هنا البحث. يمكن البحث باسم العميل أو الهاتف أو الرقم التعريفي، والوصول لسجله بسرعة.',
        pauseAfterMs: 1000,
      },
      {
        id: 'customers-list',
        highlightTargetId: 'customers-list',
        narrationText: 'هذه قائمة العملاء. الرؤية المستقبلية: إضافة التسويق عبر الرسائل الجماعية، الحملات الترويجية، تقسيم العملاء حسب السلوك، وأتمتة التسويق. القيمة الحالية: معرفة العميل. القيمة المستقبلية: CRM متكامل.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من إدارة العملاء.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى إدارة الأقساط.',
  },
  {
    id: 'installments',
    screenName: 'إدارة الأقساط',
    assistantMessage: '💳 إدارة الأقساط — تحصيل الديون ومتابعة جداول السداد',
    actionMessage: '⚡ فتح إدارة الأقساط...',
    successMessage: '✅ تم فتح إدارة الأقساط',
    targetScreen: 'installments',
    segments: [
      {
        id: 'installments-table',
        highlightTargetId: 'installments-table',
        narrationText: 'هذا جدول الأقساط. عند بيع منتج بالتقسيط، يُنشئ النظام جدول سداد تلقائي. يظهر اسم العميل، رقم الفاتورة، المبلغ المتبقي، القسط الشهري، وتاريخ الاستحقاق. كل دفعة تُربط بسجل الخزينة مباشرة.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من إدارة الأقساط.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى لوحة الخزينة.',
  },
  {
    id: 'treasury',
    screenName: 'الخزينة',
    assistantMessage: '💰 الخزينة — شفافية مالية كاملة لكل حساب',
    actionMessage: '⚡ فتح لوحة الخزينة...',
    successMessage: '✅ تم فتح الخزينة بنجاح',
    targetScreen: 'treasury',
    segments: [
      {
        id: 'treasury-accounts',
        highlightTargetId: 'treasury-accounts',
        narrationText: 'هذه بطاقات الحسابات. النظام يتتبع النقدية، البنك، فودافون كاش، إنستاباي، والبطاقات. تظهر إيرادات ومصروفات اليوم والشهر، مع صافي التدفق النقدي.',
        pauseAfterMs: 1000,
      },
      {
        id: 'treasury-transactions',
        highlightTargetId: 'treasury-transactions',
        narrationText: 'وهذا جدول الحركات المالية. كل حركة تُسجل تلقائياً عند البيع أو الشراء، ويمكن إضافة حركات يدوية. القيمة: شفافية مالية كاملة بدلاً من إكسل أو دفتر ورقي.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من الخزينة.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى مركز التقارير.',
  },
  {
    id: 'reports',
    screenName: 'التقارير',
    assistantMessage: '📈 التقارير والتحليلات — قرارات مبنية على بيانات دقيقة',
    actionMessage: '⚡ فتح مركز التقارير...',
    successMessage: '✅ تم فتح التقارير بنجاح',
    targetScreen: 'reports',
    segments: [
      {
        id: 'reports-tabs',
        highlightTargetId: 'reports-tabs',
        narrationText: 'هنا تبويبات التقارير. النظام يوفر تقارير مبيعات، ومخزون، ومالية، مع إمكانية تحديد نطاق التاريخ. هذا يُتيح مقارنة الأداء عبر فترات مختلفة.',
        pauseAfterMs: 1000,
      },
      {
        id: 'reports-summary',
        highlightTargetId: 'reports-summary-cards',
        narrationText: 'وهذه البطاقات المالية. تظهر إجمالي الإيرادات، صافي الربح، الخصومات، الضرائب، وأكثر المنتجات مبيعاً. جميع التقارير قابلة للتصدير بصيغة PDF.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من التقارير.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى إعدادات العلامة البيضاء.',
  },
  {
    id: 'white-label',
    screenName: 'العلامة البيضاء',
    assistantMessage: '🎨 العلامة البيضاء — نفس المنصة، هوية متعددة',
    actionMessage: '⚡ فتح إعدادات العلامة التجارية...',
    successMessage: '✅ تم فتح إعدادات White Label',
    targetScreen: 'settings',
    segments: [
      {
        id: 'white-label-branding',
        highlightTargetId: 'settings-branding',
        narrationText: 'هذه إعدادات العلامة البيضاء. يمكن تخصيص اسم المتجر، الشعار، العملة، نسبة الضريبة، وألوان الواجهة. القيمة: تقديم نفس المنصة لعدة عملاء، كل منهم بعلامته التجارية. بنية واحدة، وعدد غير محدود من الهويات التجارية.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من إعدادات العلامة البيضاء.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى محرك الأتمتة.',
  },
  {
    id: 'automation',
    screenName: 'محرك الأتمتة',
    assistantMessage: '⚙️ محرك الأتمتة — أساس الأعمال الذكية',
    actionMessage: '⚡ فتح محرك الأتمتة والربط...',
    successMessage: '✅ تم فتح محرك الأتمتة',
    targetScreen: 'automation',
    segments: [
      {
        id: 'automation-workflows',
        highlightTargetId: 'automation-workflows',
        narrationText: 'هذه قواعد العمل. يتيح النظام إنشاء قواعد تلقائية: تنبيه عند نقص المخزون، تنبيه عند كشف الشذوذ، إرسال تقارير دورية، وطلبات شراء تلقائية.',
        pauseAfterMs: 1000,
      },
      {
        id: 'automation-log',
        highlightTargetId: 'automation-activity-log',
        narrationText: 'وهذا سجل الأنشطة. يُظهر كل حدث تم تنفيذه تلقائياً، مما يُتيح للمدير مراقبة الأداء والتأكد من عمل الأتمتة. الرؤية: منشئ سير عمل مرئي بدون برمجة.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من محرك الأتمتة.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى المساعد الذكي.',
  },
  {
    id: 'ai-assistant',
    screenName: 'المساعد الذكي',
    assistantMessage: '🤖 المساعد الذكي — ERP يتحدث العربية',
    actionMessage: '⚡ فتح المساعد الذكي...',
    successMessage: '✅ تم فتح المساعد الذكي',
    targetScreen: 'ai',
    segments: [
      {
        id: 'ai-chat-panel',
        highlightTargetId: 'ai-assistant-panel',
        narrationText: 'هذا المساعد الذكي. يمكن للمستخدم التحدث أو الكتابة بالعربية ليطلب التنقل بين الشاشات، تسجيل مصروف، أو الاستفسار عن الأداء. مساعد يفهم سياق العمل، وليس مجرد شات بوت عام.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون انتهينا من المساعد الذكي.',
    transitionPauseMs: 2500,
    transitionStatement: 'والآن ننتقل إلى الخلاصة النهائية.',
  },
  {
    id: 'final-summary',
    screenName: 'الخلاصة',
    assistantMessage: '🏁 الخلاصة — Smart ERP في منصة واحدة متكاملة',
    actionMessage: '⚡ إنهاء العرض التقديمي...',
    successMessage: '✅ اكتمل العرض بنجاح',
    targetScreen: 'home',
    segments: [
      {
        id: 'summary',
        narrationText: 'وهكذا نكون قد استعرضنا Smart ERP. النظام يجمع في منصة واحدة: إدارة الموردين، تحليل الفواتير بالذكاء الاصطناعي، إدارة المخزون، نقطة البيع، إدارة العملاء، الأقساط، الخزينة، التقارير، العلامة البيضاء، الأتمتة، والمساعد الذكي. Smart ERP ليس مجرد ERP، بل منصة ذكية تُساعد المؤسسات على النمو وتُحسّن القرار. شكراً لكم.',
        pauseAfterMs: 1000,
      },
    ],
    closingStatement: 'وبذلك نكون قد استعرضنا نظام Smart ERP بالكامل.',
    transitionPauseMs: 0,
    transitionStatement: '',
  },
];
