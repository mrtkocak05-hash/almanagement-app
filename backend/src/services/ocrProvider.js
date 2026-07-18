/**
 * OCR Provider — Strategy Pattern
 * Current: RuleEngineProvider (intelligent mock using asset metadata)
 * Ready for: ClaudeVisionProvider, GoogleVisionProvider, AzureOCRProvider
 */

const fs = require('fs')
const path = require('path')

const STORAGE_BASE = path.join(__dirname, '../../../storage/documents')

// ── Provider Interface ────────────────────────────────────────────────────────

class OCRProviderBase {
  get name() { return 'base' }
  async extract(_filePath, _document) {
    return { text: '', confidence: 0, raw: null }
  }
}

// ── Rule Engine Provider (intelligent mock) ───────────────────────────────────

class RuleEngineProvider extends OCRProviderBase {
  get name() { return 'rule_engine' }

  async extract(filePath, document) {
    let text = ''
    let confidence = 0.3

    // Try to read text-based files (txt, csv, simple text PDFs)
    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase()
      if (['.txt', '.csv', '.json'].includes(ext)) {
        try {
          text = fs.readFileSync(filePath, 'utf-8').slice(0, 8000)
          confidence = 0.75
        } catch { /* ignore read errors */ }
      }
      confidence = text.length > 50 ? 0.75 : 0.35
    }

    // Supplement with document metadata as OCR "hints"
    const docMeta = [
      document?.title ?? '',
      document?.category ?? '',
      document?.type ?? '',
      document?.keywords ?? '',
      document?.original_name ?? '',
    ].filter(Boolean).join(' ')

    if (text.length < 20) {
      text = docMeta || 'Belge metni okunamadı'
    }

    return { text, confidence, raw: null }
  }
}

// ── Claude Vision Provider (stub — plug API key to activate) ─────────────────

class ClaudeVisionProvider extends OCRProviderBase {
  get name() { return 'claude_vision' }

  async extract(filePath, _document) {
    const apiKey = process.env.AI_CLAUDE_KEY
    if (!apiKey) throw new Error('Claude Vision: AI_CLAUDE_KEY eksik.')
    if (!filePath || !fs.existsSync(filePath)) throw new Error('Dosya bulunamadı.')

    const ext = path.extname(filePath).toLowerCase()
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if (!imageTypes.includes(ext)) throw new Error('Claude Vision yalnızca görüntü formatlarını destekler.')

    const imageData = fs.readFileSync(filePath)
    const base64 = imageData.toString('base64')
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
              { type: 'text', text: 'Bu belgeden tüm metni aynen çıkar. Sadece metni yaz, açıklama ekleme.' },
            ],
          }],
        }),
        signal: controller.signal,
      })
      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''
      return { text, confidence: 0.92, raw: data }
    } finally {
      clearTimeout(timer)
    }
  }
}

// ── Google Vision Provider stub ───────────────────────────────────────────────

class GoogleVisionProvider extends OCRProviderBase {
  get name() { return 'google_vision' }
  async extract(_filePath, _document) {
    throw new Error('Google Vision: GOOGLE_VISION_KEY yapılandırılmamış.')
  }
}

// ── Azure OCR Provider stub ───────────────────────────────────────────────────

class AzureOCRProvider extends OCRProviderBase {
  get name() { return 'azure_ocr' }
  async extract(_filePath, _document) {
    throw new Error('Azure OCR: AZURE_OCR_KEY yapılandırılmamış.')
  }
}

// ── Provider Factory ──────────────────────────────────────────────────────────

const PROVIDERS = {
  rule_engine:   new RuleEngineProvider(),
  claude_vision: new ClaudeVisionProvider(),
  google_vision: new GoogleVisionProvider(),
  azure_ocr:     new AzureOCRProvider(),
}

function getProvider(name = 'rule_engine') {
  return PROVIDERS[name] ?? PROVIDERS.rule_engine
}

function resolveFilePath(docPath) {
  if (!docPath) return null
  return path.join(STORAGE_BASE, docPath)
}

module.exports = { getProvider, resolveFilePath, PROVIDERS }
