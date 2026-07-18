export interface PromptTemplate {
  id: string
  label: string
  category: PromptCategory
  prompt: string
  personas: string[]
  tags: string[]
}

export type PromptCategory =
  | 'finance'
  | 'investment'
  | 'accounting'
  | 'purchase'
  | 'sales'
  | 'tax'
  | 'audit'
  | 'portfolio'
  | 'risk'
  | 'management'

export const PROMPT_CATEGORY_LABELS: Record<PromptCategory, string> = {
  finance:    'Finans',
  investment: 'Yatırım',
  accounting: 'Muhasebe',
  purchase:   'Satınalma',
  sales:      'Satış',
  tax:        'Vergi',
  audit:      'Denetim',
  portfolio:  'Portföy',
  risk:       'Risk',
  management: 'Yönetim',
}

export const PROMPT_CATEGORY_ICONS: Record<PromptCategory, string> = {
  finance:    '💰',
  investment: '📈',
  accounting: '📋',
  purchase:   '🛒',
  sales:      '🤝',
  tax:        '🏛️',
  audit:      '🔍',
  portfolio:  '💼',
  risk:       '⚠️',
  management: '👔',
}

export const PROMPT_LIBRARY_V2: PromptTemplate[] = [
  // ── Finans ──
  {
    id: 'finance-cashflow',
    label: 'Nakit Akışı Analizi',
    category: 'finance',
    prompt: 'Mevcut nakit akışı durumumu analiz et. Nakit giriş ve çıkışlarını değerlendir, kısa vadeli likidite risklerini belirle ve nakit akışını iyileştirme önerileri sun.',
    personas: ['cfo', 'finans_muduru'],
    tags: ['nakit', 'likidite', 'cashflow'],
  },
  {
    id: 'finance-kpi',
    label: 'Finansal KPI Değerlendirmesi',
    category: 'finance',
    prompt: 'Portföyümün finansal KPI\'larını değerlendir: ROI, likidite oranı, borç/özsermaye oranı ve net kâr marjı. Referans değerlere göre nerede durduğumu açıkla.',
    personas: ['cfo', 'ceo'],
    tags: ['kpi', 'performans', 'oran'],
  },
  {
    id: 'finance-budget',
    label: 'Bütçe Optimizasyonu',
    category: 'finance',
    prompt: 'Mevcut harcama yapımı ve bütçemi incele. Hangi kategorilerde tasarruf yapabilirim? Kaynak tahsisini nasıl optimize edebilirim?',
    personas: ['finans_muduru', 'cfo'],
    tags: ['bütçe', 'tasarruf', 'optimizasyon'],
  },

  // ── Yatırım ──
  {
    id: 'investment-roi',
    label: 'ROI Performans Analizi',
    category: 'investment',
    prompt: 'Geçmiş yatırımlarımın ROI performansını analiz et. En iyi ve en kötü performans gösteren varlık tiplerini belirle, ortalama getirimi piyasa ile karşılaştır.',
    personas: ['yatirim', 'ceo'],
    tags: ['roi', 'getiri', 'performans'],
  },
  {
    id: 'investment-timing',
    label: 'Yatırım Zamanlaması',
    category: 'investment',
    prompt: 'Portföyümdeki varlıkların elde tutma sürelerini analiz et. Hangi varlıklar satılmalı, hangilerinde daha fazla beklenmeli? Optimum çıkış zamanlamasını belirle.',
    personas: ['yatirim', 'satis'],
    tags: ['zamanlama', 'çıkış', 'satış'],
  },
  {
    id: 'investment-diversification',
    label: 'Çeşitlendirme Stratejisi',
    category: 'investment',
    prompt: 'Portföy çeşitlendirmemi değerlendir. Hangi varlık sınıflarında aşırı yoğunlaşma var? Riski dağıtmak için hangi varlık tiplerine yatırım yapmalıyım?',
    personas: ['yatirim', 'risk'],
    tags: ['çeşitlendirme', 'dağılım', 'risk'],
  },

  // ── Muhasebe ──
  {
    id: 'accounting-records',
    label: 'Kayıt Düzeni Kontrolü',
    category: 'accounting',
    prompt: 'Varlık kayıt süreçlerimi değerlendir. Hangi belgelerin eksik olduğunu, muhasebe kayıtlarında tutarsızlıkları ve TFRS uyumluluğunu kontrol et.',
    personas: ['mali_musavir', 'ic_denetci'],
    tags: ['kayıt', 'tfrs', 'uyumluluk'],
  },
  {
    id: 'accounting-depreciation',
    label: 'Amortisman Planlaması',
    category: 'accounting',
    prompt: 'Varlıklarımın amortisman durumunu analiz et. Hangi yöntem (doğrusal/azalan bakiyeler) daha avantajlı? Vergi etkisini değerlendir.',
    personas: ['mali_musavir', 'vergi'],
    tags: ['amortisman', 'vergi', 'değer'],
  },

  // ── Satınalma ──
  {
    id: 'purchase-duediligence',
    label: 'Due Diligence Kontrol Listesi',
    category: 'purchase',
    prompt: 'Yeni bir varlık alımı için due diligence süreci nasıl yürütmeliyim? Hukuki, finansal ve fiziksel kontrolleri listele.',
    personas: ['satinalma', 'yatirim'],
    tags: ['due diligence', 'kontrol', 'alım'],
  },
  {
    id: 'purchase-negotiation',
    label: 'Müzakere Stratejisi',
    category: 'purchase',
    prompt: 'Fiyat müzakeresi için en etkili stratejiler nelerdir? Satıcının zayıf noktalarını nasıl tespit ederim ve optimum fiyatı nasıl elde ederim?',
    personas: ['satinalma', 'ceo'],
    tags: ['müzakere', 'fiyat', 'strateji'],
  },

  // ── Satış ──
  {
    id: 'sales-pricing',
    label: 'Optimal Satış Fiyatı',
    category: 'sales',
    prompt: 'Satmak istediğim varlık için optimal fiyatlandırma stratejisi nedir? Piyasa karşılaştırması, alıcı psikolojisi ve müzakere marjını analiz et.',
    personas: ['satis', 'yatirim'],
    tags: ['fiyat', 'satış', 'değerleme'],
  },
  {
    id: 'sales-preparation',
    label: 'Satış Hazırlık Planı',
    category: 'sales',
    prompt: 'Varlığımı satışa hazırlamak için hangi adımları atmalıyım? Değer artırıcı iyileştirmeler, dokümantasyon ve pazarlama stratejisi öner.',
    personas: ['satis', 'satinalma'],
    tags: ['hazırlık', 'sunum', 'pazarlama'],
  },

  // ── Vergi ──
  {
    id: 'tax-capital-gains',
    label: 'Değer Artış Kazancı Hesabı',
    category: 'tax',
    prompt: 'Planlanan satışımın vergi etkisini hesapla. Değer artış kazancı vergisi, istisna limitleri ve beyan yükümlülüğünü açıkla.',
    personas: ['vergi', 'mali_musavir'],
    tags: ['vergi', 'kazanç', 'beyan'],
  },
  {
    id: 'tax-optimization',
    label: 'Vergi Optimizasyon Planı',
    category: 'tax',
    prompt: 'Portföyümde vergi yükünü minimize etmek için hangi stratejileri uygulayabilirim? Yasal vergi avantajları ve optimizasyon fırsatlarını listele.',
    personas: ['vergi', 'cfo'],
    tags: ['optimizasyon', 'planlama', 'istisna'],
  },

  // ── Denetim ──
  {
    id: 'audit-compliance',
    label: 'Uyumluluk Denetimi',
    category: 'audit',
    prompt: 'Portföy yönetim süreçlerimin yasal uyumluluğunu değerlendir. Eksik belgeler, düzensiz işlemler ve kontrol açıklarını tespit et.',
    personas: ['ic_denetci', 'mali_musavir'],
    tags: ['uyumluluk', 'denetim', 'kontrol'],
  },
  {
    id: 'audit-process',
    label: 'Süreç İyileştirme',
    category: 'audit',
    prompt: 'Mevcut iş süreçlerimde hangi zayıf noktalar var? Verimlilik artırıcı iyileştirmeler ve otomasyon fırsatlarını belirle.',
    personas: ['ic_denetci', 'ceo'],
    tags: ['süreç', 'iyileştirme', 'verimlilik'],
  },

  // ── Portföy ──
  {
    id: 'portfolio-overview',
    label: 'Portföy Genel Değerlendirme',
    category: 'portfolio',
    prompt: 'Portföyümün genel durumunu değerlendir: dağılım, performans, riskler ve büyüme potansiyeli. Üst yönetime sunulacak özet bir rapor hazırla.',
    personas: ['ceo', 'cfo'],
    tags: ['portföy', 'genel', 'rapor'],
  },
  {
    id: 'portfolio-growth',
    label: 'Büyüme Stratejisi',
    category: 'portfolio',
    prompt: 'Portföyümü büyütmek için hangi stratejileri izlemeliyim? Hangi sektörler ve varlık tipleri potansiyel sunuyor? Önümüzdeki 12 ay için plan öner.',
    personas: ['ceo', 'yatirim'],
    tags: ['büyüme', 'strateji', 'plan'],
  },

  // ── Risk ──
  {
    id: 'risk-assessment',
    label: 'Risk Değerlendirme Raporu',
    category: 'risk',
    prompt: 'Portföyümdeki tüm risk faktörlerini değerlendir: piyasa riski, likidite riski, yoğunlaşma riski ve operasyonel riskler. Her risk için olasılık ve etki skorla.',
    personas: ['risk', 'cfo'],
    tags: ['risk', 'değerlendirme', 'skor'],
  },
  {
    id: 'risk-mitigation',
    label: 'Risk Azaltma Stratejileri',
    category: 'risk',
    prompt: 'Tespit edilen riskleri azaltmak için hangi önlemleri almalıyım? Sigorta, çeşitlendirme ve likidite yönetimi konularında somut adımlar öner.',
    personas: ['risk', 'cfo'],
    tags: ['azaltma', 'sigorta', 'hedge'],
  },

  // ── Yönetim ──
  {
    id: 'management-daily',
    label: 'Günlük Öncelikler',
    category: 'management',
    prompt: 'Bugün portföy yönetimi açısından öncelikli olarak ne yapmalıyım? Acil eylemler, takip gerektiren işlemler ve fırsatları listele.',
    personas: ['ceo', 'finans_muduru'],
    tags: ['günlük', 'öncelik', 'eylem'],
  },
  {
    id: 'management-quarterly',
    label: 'Çeyreklik Değerlendirme',
    category: 'management',
    prompt: 'Bu çeyrek için portföy performansımı değerlendir. Hedeflere ulaşıldı mı? Bir sonraki çeyrek için stratejik hedefler ve aksiyonlar neler olmalı?',
    personas: ['ceo', 'cfo'],
    tags: ['çeyrek', 'hedef', 'strateji'],
  },
]

export function getPromptsByCategory(category: PromptCategory): PromptTemplate[] {
  return PROMPT_LIBRARY_V2.filter(p => p.category === category)
}

export function getPromptById(id: string): PromptTemplate | undefined {
  return PROMPT_LIBRARY_V2.find(p => p.id === id)
}

export function searchPrompts(query: string): PromptTemplate[] {
  const q = query.toLowerCase()
  return PROMPT_LIBRARY_V2.filter(
    p => p.label.toLowerCase().includes(q) ||
         p.tags.some(t => t.toLowerCase().includes(q)) ||
         p.prompt.toLowerCase().includes(q)
  )
}
