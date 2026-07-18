const { getDb } = require('../database/connection')

// ── Cost constants (per 1M tokens) ──────────────────────────────────────────
const COST_TABLE = {
  'claude-sonnet-4-6':   { input: 3.0,   output: 15.0  },
  'claude-haiku-4-5':    { input: 0.25,  output: 1.25  },
  'claude-opus-4-8':     { input: 15.0,  output: 75.0  },
  'gpt-4o':              { input: 5.0,   output: 15.0  },
  'gpt-4o-mini':         { input: 0.15,  output: 0.60  },
  'gemini-2.0-flash':    { input: 0.075, output: 0.30  },
  'gemini-1.5-pro':      { input: 1.25,  output: 5.0   },
  'rule_engine':         { input: 0,     output: 0     },
}

function calcCost(model, inputTokens, outputTokens) {
  const rates = COST_TABLE[model] ?? { input: 0, output: 0 }
  return (rates.input * inputTokens + rates.output * outputTokens) / 1_000_000
}

// ── Settings ─────────────────────────────────────────────────────────────────
function getSettings(req, res) {
  const db = getDb()
  const settings = db.prepare('SELECT * FROM ai_settings WHERE id = 1').get()
  // Never return API keys to frontend
  res.json({ success: true, data: settings })
}

function updateSettings(req, res) {
  const db = getDb()
  const {
    provider, claude_model, openai_model, gemini_model,
    temperature, max_tokens, system_prompt, persona, memory_enabled,
    default_persona, fallback_provider, cost_limit_daily, auto_summary,
  } = req.body
  const s = db.prepare('SELECT * FROM ai_settings WHERE id = 1').get()
  db.prepare(`
    UPDATE ai_settings SET
      provider=?, claude_model=?, openai_model=?, gemini_model=?,
      temperature=?, max_tokens=?, system_prompt=?, persona=?,
      memory_enabled=?, default_persona=?, fallback_provider=?,
      cost_limit_daily=?, auto_summary=?, updated_at=datetime('now')
    WHERE id = 1
  `).run(
    provider ?? s.provider, claude_model ?? s.claude_model, openai_model ?? s.openai_model,
    gemini_model ?? s.gemini_model, temperature ?? s.temperature, max_tokens ?? s.max_tokens,
    system_prompt ?? s.system_prompt, persona ?? s.persona, memory_enabled ?? s.memory_enabled,
    default_persona ?? s.default_persona ?? 'ceo',
    fallback_provider ?? s.fallback_provider ?? 'rule_engine',
    cost_limit_daily ?? s.cost_limit_daily ?? 0,
    auto_summary ?? s.auto_summary ?? 0,
  )
  res.json({ success: true, data: null })
}

// ── Provider check: has API key? ─────────────────────────────────────────────
function hasKey(provider) {
  if (provider === 'claude') return !!(process.env.AI_CLAUDE_KEY)
  if (provider === 'openai') return !!(process.env.AI_OPENAI_KEY)
  if (provider === 'gemini') return !!(process.env.AI_GEMINI_KEY)
  return false
}

// ── Rule Engine (zero API cost, always available) ────────────────────────────
function buildDashboardContext(db) {
  try {
    const metrics = db.prepare(`
      SELECT
        COUNT(*) as total_assets,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
        SUM(current_value) as portfolio_value,
        SUM(CASE WHEN julianday('now') - julianday(purchase_date) > 90 AND status = 'active' THEN 1 ELSE 0 END) as long_wait
      FROM assets WHERE deleted_at IS NULL
    `).get()
    const capital = db.prepare('SELECT amount_try FROM capital WHERE id = 1').get()
    const recentSales = db.prepare(`
      SELECT asset_name, net_profit_try, roi_percent FROM sales
      WHERE status = 'completed' AND deleted_at IS NULL
      ORDER BY sale_date DESC LIMIT 3
    `).all()
    const recentPurchases = db.prepare(`
      SELECT asset_name, purchase_price_try FROM purchases
      WHERE status = 'completed' AND deleted_at IS NULL
      ORDER BY purchase_date DESC LIMIT 3
    `).all()
    return { metrics, capital, recentSales, recentPurchases }
  } catch { return {} }
}

function ruleEngineAnswer(userMsg, context = {}, persona = 'ceo', systemPrompt = '') {
  const m = userMsg.toLowerCase()
  const { metrics = {}, capital = {}, recentSales = [], recentPurchases = [] } = context
  const val = metrics.portfolio_value ?? 0
  const cap = capital.amount_try ?? 0
  const total = metrics.total_assets ?? 0
  const active = metrics.active ?? 0
  const longWait = metrics.long_wait ?? 0

  const PERSONA_TITLES = {
    ceo: 'CEO perspektifinden', cfo: 'CFO perspektifinden',
    finans: 'Finans uzmanı olarak', yatirim: 'Yatırım uzmanı olarak',
    muhasebe: 'Muhasebe uzmanı olarak', satinalma: 'Satınalma uzmanı olarak',
    satis: 'Satış uzmanı olarak',
    mali_musavir: 'Mali müşavir olarak', finans_muduru: 'Finans müdürü olarak',
    risk: 'Risk analisti olarak', vergi: 'Vergi uzmanı olarak',
    ic_denetci: 'İç denetçi olarak',
  }
  const prefix = PERSONA_TITLES[persona] ?? 'Asistan olarak'

  // Portfolio overview
  if (m.includes('portföy') || m.includes('varlık') || m.includes('durum')) {
    const lines = [`${prefix} portföy durumunuzu değerlendiriyorum:\n`]
    lines.push(`📊 **Toplam ${total} varlık**, ${active} aktif`)
    if (val > 0) lines.push(`💰 Portföy değeri: **${(val / 1e6).toFixed(2)}M TRY**`)
    if (cap > 0) lines.push(`🏦 Nakit: **${(cap / 1e6).toFixed(2)}M TRY**`)
    if (longWait > 0) lines.push(`⚠️ ${longWait} varlık 90+ gündür bekliyor — satış stratejisi gözden geçirilmeli`)
    if (recentSales.length > 0) {
      lines.push(`\n📈 Son satışlar:`)
      recentSales.forEach(s => {
        const roi = s.roi_percent ? ` (%${s.roi_percent.toFixed(1)} ROI)` : ''
        lines.push(`  • ${s.asset_name}${roi}`)
      })
    }
    return lines.join('\n')
  }

  // Risk analysis
  if (m.includes('risk') || m.includes('tehlike')) {
    const risks = []
    if (longWait > 2) risks.push(`${longWait} varlık uzun süredir satılmıyor — likidite riski`)
    if (cap < val * 0.05) risks.push('Nakit oranı çok düşük — %5 altında')
    if (total > 0 && active / total > 0.8) risks.push('Portföy yoğunlaşması yüksek — çeşitlendirme öneriliyor')
    const lines = [`${prefix} risk değerlendirmesi:\n`]
    if (risks.length === 0) {
      lines.push('✅ Tespit edilen kritik risk yok. Portföy genel olarak sağlıklı görünüyor.')
    } else {
      risks.forEach((r, i) => lines.push(`${i + 1}. ⚠️ ${r}`))
      lines.push('\nÖneriler: Riskleri minimize etmek için likiditeyi artırın ve portföyü çeşitlendirin.')
    }
    return lines.join('\n')
  }

  // Profit / ROI
  if (m.includes('kar') || m.includes('kazanç') || m.includes('roi') || m.includes('getiri')) {
    const lines = [`${prefix} karlılık analizi:\n`]
    if (recentSales.length > 0) {
      let totalProfit = 0
      recentSales.forEach(s => {
        if (s.net_profit_try) totalProfit += s.net_profit_try
        const profit = s.net_profit_try ? ` — ${s.net_profit_try > 0 ? '+' : ''}${(s.net_profit_try / 1000).toFixed(0)}K TRY` : ''
        lines.push(`• ${s.asset_name}${profit}`)
      })
      lines.push(`\nSon satışlar toplam: **${totalProfit > 0 ? '+' : ''}${(totalProfit / 1000).toFixed(0)}K TRY**`)
    } else {
      lines.push('Henüz tamamlanmış satış kaydı bulunmuyor.')
    }
    return lines.join('\n')
  }

  // Market research
  if (m.includes('piyasa') || m.includes('araştır') || m.includes('fiyat') || m.includes('değer')) {
    return `${prefix} piyasa değerlendirmesi:\n\n🔍 Piyasa Araştırma modülüne gidin ve mevcut fiyatları karşılaştırın.\n\nÖnerilen strateji:\n• Hedef varlık için en az 5-10 listeleme toplayın\n• Ortalama piyasa fiyatını hesaplayın\n• %10-15 altına fırsat skor skoru verin\n\nMevcut portföyde ${longWait} varlık satış baskısı altında.`
  }

  // Suggestions / what to do today
  if (m.includes('bugün') || m.includes('ne yapmalı') || m.includes('öneri') || m.includes('tavsiye')) {
    const actions = []
    if (longWait > 0) actions.push(`🔴 ${longWait} uzun bekleyen varlık için satış fiyatı revizyonu`)
    if (cap < val * 0.08) actions.push('🟡 Nakit oranı düşük — yeni alım öncesi likidite artırın')
    if (recentPurchases.length > 0) actions.push(`🟢 Son alımlar için ekspertiz ve sigorta tamamlandı mı kontrol edin`)
    actions.push('📋 Günlük aktivite takibini gözden geçirin')
    const lines = [`${prefix} bugünkü öneriler:\n`]
    actions.forEach(a => lines.push(a))
    return lines.join('\n')
  }

  // Purchase advice
  if (m.includes('alım') || m.includes('satınalma') || m.includes('al ') || m.includes('almak')) {
    return `${prefix} satınalma değerlendirmesi:\n\n✅ Alım öncesi kontrol listesi:\n1. Piyasa araştırması tamamlandı mı?\n2. Fırsat skoru %70+ mi?\n3. Ortalama fiyatın altında mı?\n4. Ekspertiz raporu alındı mı?\n5. Sigorta maliyeti hesaplandı mı?\n6. Nakit akışı yeterli mi?\n\nMevcut nakit: ${cap > 0 ? (cap / 1e6).toFixed(2) + 'M TRY' : 'Bilgi yok'}`
  }

  // Default response based on persona
  const defaults = {
    ceo: `CEO olarak size şunu söyleyebilirim: Portföyünüzdeki **${total} varlık** için stratejik bakış açısı geliştirmek önemli. Uzun vadeli büyüme için çeşitlendirme ve nakit yönetimine odaklanın. Sorunuzu daha spesifik sorarsanız daha detaylı analiz yapabilirim.`,
    cfo: `CFO perspektifinden: Finansal performans takibi için kritik KPI'lar — likidite oranı, net kar marjı ve ROI. Mevcut portföy için bu metrikleri düzenli takip edin. Daha spesifik bir finansal analiz için soru sorun.`,
    finans: `Finans uzmanı olarak: Portföy yönetiminde en kritik unsur nakit akışı yönetimidir. Risk/getiri dengesini optimize etmek için çeşitlendirme stratejisi uygulayın. Yardım edebileceğim spesifik bir konu var mı?`,
    yatirim: `Yatırım uzmanı olarak: Her yatırım kararında 3 temel soru: ROI nedir, likidite riski nedir, çıkış stratejisi nedir? Bu sorulara net cevaplarınız varsa yatırım sağlıklıdır.`,
    muhasebe: `Muhasebe uzmanı olarak: Tüm işlemler belgelenmiş mi? Gider kategorileri doğru tanımlanmış mı? Vergi planlaması yapılıyor mu? Düzenli bakım ve dokümentasyon önemlidir.`,
    satinalma: `Satınalma uzmanı olarak: Her alımda piyasa araştırması yapın, en az 3 kaynak fiyatını karşılaştırın, ekspertiz alın ve sigorta maliyetini hesaba katın.`,
    satis: `Satış uzmanı olarak: En iyi satış fiyatı için doğru zamanlama önemli. Piyasa araştırması yapın, rakip fiyatları takip edin ve premium sunum hazırlayın.`,
    mali_musavir: `Mali müşavir olarak: Finansal tablolar, vergi planlaması ve muhasebe standartları açısından portföyünüzü değerlendiriyorum. Kayıt düzeni, gider sınıflandırması ve KDV uyumluluğu kritik konulardır.`,
    finans_muduru: `Finans müdürü olarak: Bütçe kontrolü, nakit akışı planlaması ve finansal hedeflere ulaşma konularında rehberlik edebilirim. KPI'larınızı düzenli izleyin.`,
    risk: `Risk analisti olarak: Portföydeki risk faktörlerini değerlendiriyorum — piyasa riski, likidite riski ve yoğunlaşma riski. Çeşitlendirme ve hedge stratejileri kritiktir.`,
    vergi: `Vergi uzmanı olarak: Varlık satışlarında elde değer artış kazancı, KDV ve stopaj konularını göz önünde bulundurun. Her satış öncesi vergi etkisini hesaplayın.`,
    ic_denetci: `İç denetçi olarak: İşlem kontrolleri, belge bütünlüğü ve süreç uyumluluğunu inceliyorum. Tüm satış ve alım süreçlerinin tam belgelenmiş olması kritik önem taşır.`,
  }
  return defaults[persona] ?? `Belirtilen soruyu işleyebilmek için daha spesifik bilgi gerekiyor. Portföy, risk, kar, piyasa veya günlük öneriler hakkında soru sorabilirsiniz.`
}

// ── Claude API Proxy ──────────────────────────────────────────────────────────
async function callClaude(messages, model, temperature, maxTokens, systemPrompt) {
  const key = process.env.AI_CLAUDE_KEY
  const timeout = parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? '30000')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  const payload = {
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt || 'Sen AlManagement portföy yönetim sisteminin AI asistanısın. Türkçe yanıt ver.',
    messages: messages.filter(m => m.role !== 'system'),
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message ?? 'Claude API error')
    return {
      content: data.content?.[0]?.text ?? '',
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ── OpenAI API Proxy ──────────────────────────────────────────────────────────
async function callOpenAI(messages, model, temperature, maxTokens, systemPrompt) {
  const key = process.env.AI_OPENAI_KEY
  const timeout = parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? '30000')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages.filter(m => m.role !== 'system')]
    : messages

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: allMessages, temperature, max_tokens: maxTokens }),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message ?? 'OpenAI API error')
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ── Gemini API Proxy ──────────────────────────────────────────────────────────
async function callGemini(messages, model, temperature, maxTokens, systemPrompt) {
  const key = process.env.AI_GEMINI_KEY
  const timeout = parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? '30000')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = systemPrompt
    ? { parts: [{ text: systemPrompt }] }
    : { parts: [{ text: 'Sen AlManagement portföy yönetim sisteminin AI asistanısın. Türkçe yanıt ver.' }] }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction: systemInstruction,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message ?? 'Gemini API error')
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const usageMeta = data.usageMetadata ?? {}
    return {
      content: text,
      inputTokens: usageMeta.promptTokenCount ?? 0,
      outputTokens: usageMeta.candidatesTokenCount ?? 0,
    }
  } finally {
    clearTimeout(timer)
  }
}

// ── Main Chat Endpoint ────────────────────────────────────────────────────────
async function chat(req, res) {
  const db = getDb()
  const settings = db.prepare('SELECT * FROM ai_settings WHERE id = 1').get() ?? {}
  const { messages = [], action = 'chat', context: reqContext } = req.body
  const sessionId = req.headers['x-session-id'] ?? null

  const provider = settings.provider ?? 'rule_engine'
  const temperature = parseFloat(settings.temperature ?? 0.7)
  const maxTokens = parseInt(settings.max_tokens ?? 2000)
  const systemPrompt = settings.system_prompt ?? null
  const persona = settings.persona ?? 'ceo'

  let result = null
  let activeProvider = provider
  let model = 'rule_engine'
  const startTime = Date.now()

  try {
    if (provider === 'claude' && hasKey('claude')) {
      model = settings.claude_model ?? 'claude-sonnet-4-6'
      result = await callClaude(messages, model, temperature, maxTokens, systemPrompt)
      activeProvider = 'claude'
    } else if (provider === 'openai' && hasKey('openai')) {
      model = settings.openai_model ?? 'gpt-4o'
      result = await callOpenAI(messages, model, temperature, maxTokens, systemPrompt)
      activeProvider = 'openai'
    } else if (provider === 'gemini' && hasKey('gemini')) {
      model = settings.gemini_model ?? 'gemini-2.0-flash'
      result = await callGemini(messages, model, temperature, maxTokens, systemPrompt)
      activeProvider = 'gemini'
    }

    // Fallback to rule engine
    if (!result) {
      const dbContext = buildDashboardContext(db)
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
      const answer = ruleEngineAnswer(lastUserMsg, reqContext ?? dbContext, persona, systemPrompt ?? '')
      result = { content: answer, inputTokens: 0, outputTokens: 0 }
      activeProvider = 'rule_engine'
      model = 'rule_engine'
    }

    const durationMs = Date.now() - startTime
    const cost = calcCost(model, result.inputTokens, result.outputTokens)

    // Log to DB
    db.prepare(`
      INSERT INTO ai_logs (user_id, session_id, provider, model, action, prompt_text, response_text, input_tokens, output_tokens, duration_ms, cost_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user?.id ?? null, sessionId, activeProvider, model, action,
      messages.map(m => `[${m.role}]: ${m.content}`).join('\n').slice(0, 5000),
      result.content.slice(0, 5000),
      result.inputTokens, result.outputTokens, durationMs, cost
    )

    // Auto-save to AI memories if memory enabled
    if (settings.memory_enabled && result.content) {
      const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
      if (userMsg.length > 10) {
        db.prepare(`
          INSERT INTO ai_memories (user_id, company_id, type, module, summary, data_json, importance, tags)
          VALUES (?, ?, 'analysis', 'chat', ?, ?, 5, ?)
        `).run(
          req.user?.id ?? null, req.user?.company_id ?? null,
          userMsg.slice(0, 200),
          JSON.stringify({ q: userMsg, a: result.content.slice(0, 500) }),
          [persona, action].join(',')
        )
      }
    }

    res.json({
      success: true,
      data: {
        content: result.content,
        provider: activeProvider,
        model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs,
        costUsd: cost,
      },
    })
  } catch (err) {
    const durationMs = Date.now() - startTime
    db.prepare(`INSERT INTO ai_logs (user_id, session_id, provider, model, action, error_text, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(req.user?.id ?? null, sessionId, activeProvider, model, action, String(err.message), durationMs)

    res.status(500).json({ success: false, message: err.message ?? 'AI servisi hatası.' })
  }
}

// ── Logs ─────────────────────────────────────────────────────────────────────
function getLogs(req, res) {
  const db = getDb()
  const { provider, limit = 100, offset = 0 } = req.query
  let sql = `SELECT * FROM ai_logs WHERE 1=1`
  const params = []
  if (provider) { sql += ` AND provider = ?`; params.push(provider) }
  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(parseInt(limit), parseInt(offset))
  const rows = db.prepare(sql).all(...params)
  const total = db.prepare('SELECT COUNT(*) as c FROM ai_logs').get()
  res.json({ success: true, data: { logs: rows, total: total.c } })
}

// ── Cost Summary ──────────────────────────────────────────────────────────────
function getCosts(req, res) {
  const db = getDb()

  const daily = db.prepare(`
    SELECT date(created_at) as day, provider, SUM(cost_usd) as cost, SUM(input_tokens + output_tokens) as tokens, COUNT(*) as requests
    FROM ai_logs WHERE created_at >= datetime('now', '-7 days')
    GROUP BY day, provider ORDER BY day DESC
  `).all()

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, provider, SUM(cost_usd) as cost, SUM(input_tokens + output_tokens) as tokens, COUNT(*) as requests
    FROM ai_logs GROUP BY month, provider ORDER BY month DESC LIMIT 12
  `).all()

  const total = db.prepare(`
    SELECT provider, SUM(cost_usd) as cost, SUM(input_tokens + output_tokens) as tokens, COUNT(*) as requests
    FROM ai_logs GROUP BY provider
  `).all()

  res.json({ success: true, data: { daily, monthly, total } })
}

// ── Provider status ───────────────────────────────────────────────────────────
function getProviderStatus(req, res) {
  res.json({
    success: true,
    data: {
      claude: { configured: hasKey('claude'), model: process.env.AI_CLAUDE_MODEL ?? 'claude-sonnet-4-6' },
      openai: { configured: hasKey('openai'), model: process.env.AI_OPENAI_MODEL ?? 'gpt-4o' },
      gemini: { configured: hasKey('gemini'), model: process.env.AI_GEMINI_MODEL ?? 'gemini-2.0-flash' },
      rule_engine: { configured: true, model: 'rule_engine' },
    },
  })
}

// ── Analyze endpoint (structured analysis) ───────────────────────────────────
async function analyze(req, res) {
  req.body.action = 'analyze'
  return chat(req, res)
}

// ── Provider health check ─────────────────────────────────────────────────────
async function healthCheck(req, res) {
  const db = getDb()
  const settings = db.prepare('SELECT * FROM ai_settings WHERE id = 1').get() ?? {}
  const provider = settings.provider ?? 'rule_engine'
  const health = { provider, status: 'unknown', latency_ms: null, fallback: settings.fallback_provider ?? 'rule_engine' }

  if (provider === 'rule_engine' || !hasKey(provider)) {
    health.status = 'ok'
    health.message = 'Yerel motor aktif'
    return res.json({ success: true, data: health })
  }

  const start = Date.now()
  try {
    const testMsg = [{ role: 'user', content: 'ping' }]
    if (provider === 'claude') await callClaude(testMsg, settings.claude_model ?? 'claude-haiku-4-5', 0, 5, null)
    else if (provider === 'openai') await callOpenAI(testMsg, settings.openai_model ?? 'gpt-4o-mini', 0, 5, null)
    else if (provider === 'gemini') await callGemini(testMsg, settings.gemini_model ?? 'gemini-2.0-flash', 0, 5, null)
    health.status = 'ok'
    health.latency_ms = Date.now() - start
  } catch (err) {
    health.status = 'error'
    health.error = err.message
    health.latency_ms = Date.now() - start
  }
  res.json({ success: true, data: health })
}

// ── Decision Center ───────────────────────────────────────────────────────────
async function askDecision(req, res) {
  const { question, context: ctx } = req.body
  if (!question) return res.status(400).json({ success: false, message: 'question zorunlu.' })

  const db = getDb()
  const contextStr = ctx ? `\n\nBağlam:\n${JSON.stringify(ctx, null, 2)}` : ''
  const dbCtx = buildDashboardContext(db)
  const portfolioStr = `\nPortföy: ${dbCtx.metrics?.total_assets ?? 0} varlık, aktif ${dbCtx.metrics?.active ?? 0}`

  req.body.messages = [{ role: 'user', content: `[KARAR MERKEZİ]\n\n${question}${portfolioStr}${contextStr}` }]
  req.body.action = 'decision'
  return chat(req, res)
}

async function analyzeInvestment(req, res) {
  const db = getDb()
  const { saleId } = req.body
  let contextStr = ''
  if (saleId) {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND deleted_at IS NULL').get(parseInt(saleId))
    if (sale) {
      contextStr = `\n\nYatırım Detayları:\n- Varlık: ${sale.asset_name} (${sale.asset_type})\n- Alış Fiyatı: ₺${(sale.purchase_price_try ?? 0).toLocaleString('tr-TR')}\n- Satış Fiyatı: ₺${(sale.sale_price_try ?? 0).toLocaleString('tr-TR')}\n- Net Kâr: ₺${(sale.net_profit_try ?? 0).toLocaleString('tr-TR')}\n- ROI: %${(sale.roi_percent ?? 0).toFixed(2)}\n- Elde Tutma: ${sale.holding_days ?? 0} gün\n- Yıllık ROI: %${(sale.annual_roi_percent ?? 0).toFixed(2)}`
    }
  }
  req.body.messages = [{ role: 'user', content: `[YATIRIM ANALİZİ]\n\nAşağıdaki yatırımı kapsamlı analiz et. ROI performansı, piyasa karşılaştırması ve iyileştirme önerilerini içer:${contextStr}` }]
  req.body.action = 'investment'
  return chat(req, res)
}

async function analyzePortfolio(req, res) {
  const db = getDb()
  const assets = db.prepare(`SELECT type, COUNT(*) AS cnt, SUM(current_value) AS val FROM assets WHERE status='active' AND deleted_at IS NULL GROUP BY type`).all()
  const sales = db.prepare(`SELECT AVG(roi_percent) AS avg_roi, COUNT(*) AS cnt FROM sales WHERE status='completed' AND deleted_at IS NULL`).get()
  const contextStr = `\n\nPortföy Dağılımı:\n${assets.map(a => `- ${a.type}: ${a.cnt} varlık, ₺${Math.round((a.val ?? 0) / 1000)}K`).join('\n')}\n\nSatış Performansı: ${sales.cnt} satış, Ort. ROI %${(sales.avg_roi ?? 0).toFixed(1)}`
  req.body.messages = [{ role: 'user', content: `[PORTFÖY ANALİZİ]\n\nPortföyümü analiz et. Çeşitlendirme, risk yönetimi, karlılık ve büyüme önerilerini ver:${contextStr}` }]
  req.body.action = 'portfolio'
  return chat(req, res)
}

async function analyzeExpense(req, res) {
  const db = getDb()
  const { assetId } = req.body
  let contextStr = ''
  if (assetId) {
    const expenses = db.prepare(`SELECT act.type, SUM(act.amount) AS total, COUNT(*) AS cnt FROM activities act WHERE act.asset_id = ? AND act.deleted_at IS NULL AND act.type IN ('expense','personal_expense') GROUP BY act.type`).all(parseInt(assetId))
    const asset = db.prepare('SELECT name, type FROM assets WHERE id = ?').get(parseInt(assetId))
    if (asset) {
      contextStr = `\n\nVarlık: ${asset.name} (${asset.type})\nMasraf Özeti:\n${expenses.map(e => `- ${e.type}: ₺${e.total?.toFixed(0)} (${e.cnt} işlem)`).join('\n')}`
    }
  } else {
    const topExpenses = db.prepare(`SELECT a.name, COALESCE(SUM(act.amount),0) AS total FROM activities act JOIN assets a ON a.id = act.asset_id WHERE act.type IN ('expense','personal_expense') AND act.deleted_at IS NULL AND a.deleted_at IS NULL GROUP BY a.id ORDER BY total DESC LIMIT 5`).all()
    contextStr = `\n\nEn Yüksek Masraflı Varlıklar:\n${topExpenses.map(e => `- ${e.name}: ₺${Math.round(e.total / 1000)}K`).join('\n')}`
  }
  req.body.messages = [{ role: 'user', content: `[MASRAF ANALİZİ]\n\nMasraf yapımı analiz et. Tasarruf fırsatları, anormal harcamalar ve optimizasyon önerileri ver:${contextStr}` }]
  req.body.action = 'expense'
  return chat(req, res)
}

async function analyzeSale(req, res) {
  const db = getDb()
  const { assetId } = req.body
  let contextStr = ''
  if (assetId) {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL').get(parseInt(assetId))
    if (asset) {
      const daysSince = asset.purchase_date ? Math.round((Date.now() - new Date(asset.purchase_date).getTime()) / 86400000) : null
      contextStr = `\n\nVarlık: ${asset.name} (${asset.type})\n- Alış Fiyatı: ₺${(asset.purchase_price ?? 0).toLocaleString('tr-TR')}\n- Güncel Değer: ₺${(asset.current_value ?? 0).toLocaleString('tr-TR')}\n- Elde Tutma: ${daysSince ?? 'bilinmiyor'} gün\n- Durum: ${asset.status}`
    }
  }
  req.body.messages = [{ role: 'user', content: `[SATIŞ ANALİZİ]\n\nBu varlık için satış stratejisi ve doğru zamanlama analizi yap. Piyasa fiyatı, ROI beklentisi ve müzakere stratejisi öner:${contextStr}` }]
  req.body.action = 'sale'
  return chat(req, res)
}

async function generateRecommendation(req, res) {
  const db = getDb()
  const { topic = 'genel' } = req.body
  const ctx = buildDashboardContext(db)
  const contextStr = `\n\nPortföy Özeti: ${ctx.metrics?.total_assets ?? 0} varlık, aktif ${ctx.metrics?.active ?? 0}, son satışlar ${ctx.recentSales?.length ?? 0}`
  req.body.messages = [{ role: 'user', content: `[ÖNERİ] Konu: ${topic}\n\nBu konuda somut ve uygulanabilir 3-5 öneri sun:${contextStr}` }]
  req.body.action = 'recommend'
  return chat(req, res)
}

async function forecast(req, res) {
  const db = getDb()
  const { period = '3ay' } = req.body
  const sales = db.prepare(`SELECT AVG(roi_percent) AS avg_roi, AVG(holding_days) AS avg_hold, COUNT(*) AS cnt FROM sales WHERE status='completed' AND deleted_at IS NULL AND sale_date >= date('now','-6 months')`).get()
  const assets = db.prepare(`SELECT COUNT(*) AS c FROM assets WHERE status='active' AND deleted_at IS NULL`).get()
  const contextStr = `\n\nSon 6 ay performansı:\n- Tamamlanan satış: ${sales.cnt}\n- Ort. ROI: %${(sales.avg_roi ?? 0).toFixed(1)}\n- Ort. elde tutma: ${Math.round(sales.avg_hold ?? 0)} gün\n- Aktif varlık: ${assets.c}`
  req.body.messages = [{ role: 'user', content: `[TAHMİN] Dönem: ${period}\n\nGeçmiş verilerime dayanarak gelecek ${period} için portföy performansı tahmini yap:${contextStr}` }]
  req.body.action = 'forecast'
  return chat(req, res)
}

async function compare(req, res) {
  const db = getDb()
  const { assetIds = [] } = req.body
  if (!assetIds.length) return res.status(400).json({ success: false, message: 'assetIds zorunlu.' })

  const placeholders = assetIds.map(() => '?').join(',')
  const assets = db.prepare(`SELECT id, name, type, purchase_price, current_value, purchase_date, status FROM assets WHERE id IN (${placeholders}) AND deleted_at IS NULL`).all(...assetIds)
  const contextStr = `\n\nKarşılaştırılan Varlıklar:\n${assets.map(a => `- ${a.name} (${a.type}): Alış ₺${(a.purchase_price ?? 0).toLocaleString('tr-TR')}, Güncel ₺${(a.current_value ?? 0).toLocaleString('tr-TR')}`).join('\n')}`
  req.body.messages = [{ role: 'user', content: `[KARŞILAŞTIRMA]\n\nBu varlıkları karşılaştır ve hangisinin daha iyi performans gösterdiğini açıkla:${contextStr}` }]
  req.body.action = 'compare'
  return chat(req, res)
}

module.exports = {
  chat, analyze, getLogs, getCosts, getSettings, updateSettings, getProviderStatus,
  healthCheck,
  askDecision, analyzeInvestment, analyzePortfolio, analyzeExpense, analyzeSale,
  generateRecommendation, forecast, compare,
}
