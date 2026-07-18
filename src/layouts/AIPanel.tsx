import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, BotMessageSquare, Send, Square, Trash2, ChevronDown,
  Zap, AlertCircle, CheckCircle,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAIChat } from '@/hooks/useAIChat'
import { PERSONAS, type PersonaKey } from '@/services/ai/promptLibrary'
import { formatCostUSD } from '@/services/ai/costTracker'
import { getSettings } from '@/services/ai/aiService'
import type { AISettings } from '@/services/ai/types'

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-accent rounded-2xl rounded-bl-sm px-3 py-2">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
interface MsgBubbleProps {
  role: 'user' | 'assistant'
  content: string
  provider?: string
  costUsd?: number
  durationMs?: number
  error?: boolean
}

function MessageBubble({ role, content, provider, costUsd, durationMs, error }: MsgBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${error ? 'bg-destructive/10' : 'bg-primary/10'}`}>
          {error ? <AlertCircle className="w-3.5 h-3.5 text-destructive" /> : <BotMessageSquare className="w-3.5 h-3.5 text-primary" />}
        </div>
      )}
      <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : error
                ? 'bg-destructive/10 text-destructive rounded-bl-sm'
                : 'bg-accent text-foreground rounded-bl-sm'
          }`}
        >
          {content}
        </div>
        {!isUser && provider && !error && (
          <div className="flex items-center gap-1.5 px-1">
            <CheckCircle className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground capitalize">{provider}</span>
            {durationMs && <span className="text-[10px] text-muted-foreground">· {(durationMs / 1000).toFixed(1)}s</span>}
            {costUsd !== undefined && costUsd > 0 && (
              <span className="text-[10px] text-muted-foreground">· {formatCostUSD(costUsd)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Provider badge ─────────────────────────────────────────────────────────────
const PROVIDER_COLORS: Record<string, string> = {
  claude: '#D97706', openai: '#16A34A', gemini: '#2563EB', rule_engine: '#6B7280',
}

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? '#6B7280'
  const labels: Record<string, string> = { claude: 'Claude', openai: 'OpenAI', gemini: 'Gemini', rule_engine: 'Yerel' }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: `${color}22`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {labels[provider] ?? provider}
    </span>
  )
}

// ── Persona selector ──────────────────────────────────────────────────────────
interface PersonaSelectorProps {
  value: PersonaKey
  onChange: (k: PersonaKey) => void
}

function PersonaSelector({ value, onChange }: PersonaSelectorProps) {
  const [open, setOpen] = useState(false)
  const current = PERSONAS.find(p => p.key === value) ?? PERSONAS[0]
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-xs"
      >
        <span>{current.icon}</span>
        <span className="font-medium text-foreground">{current.label}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-48 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {PERSONAS.map(p => (
            <button
              key={p.key}
              onClick={() => { onChange(p.key); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors ${value === p.key ? 'bg-accent' : ''}`}
            >
              <span>{p.icon}</span>
              <span className="text-foreground">{p.label}</span>
              {value === p.key && <CheckCircle className="w-3 h-3 text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTIONS: Record<PersonaKey, string[]> = {
  ceo: ['Portföy durumumu özetle', 'Bugün ne yapmalıyım?', 'Risk analizi yap'],
  cfo: ['Nakit akışını analiz et', 'Bu ayki maliyetler neler?', 'Karlılık oranları'],
  finans: ['ROI hesapla', 'Portföy getirisi nedir?', 'Likidite durumu'],
  yatirim: ['En iyi yatırım fırsatı?', 'Hangi varlıkları satmalıyım?', 'Piyasa değerlendirmesi'],
  muhasebe: ['Vergi planlaması öner', 'Amortisman hesabı', 'Belge eksikliklerini listele'],
  satinalma: ['Alım stratejisi öner', 'Fırsat skoru yüksek varlıklar', 'Piyasa fiyatı analizi'],
  satis: ['Satış stratejisi öner', 'Uzun bekleyenleri listele', 'Fiyat revizyonu gerekli mi?'],
}

// ── Main AIPanel ──────────────────────────────────────────────────────────────
export function AIPanel() {
  const { aiPanelOpen, toggleAIPanel } = useUIStore()
  const [persona, setPersona] = useState<PersonaKey>('ceo')
  const [input, setInput] = useState('')
  const [settings, setSettings] = useState<AISettings | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isLoading, sendMessage, abort, clearChat } = useAIChat({ persona })

  // Load AI settings to show active provider
  useEffect(() => {
    if (!aiPanelOpen) return
    getSettings().then(setSettings).catch(() => {})
  }, [aiPanelOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage(text)
    inputRef.current?.focus()
  }, [input, isLoading, sendMessage])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (!aiPanelOpen) return null

  const activeProvider = settings?.provider ?? 'rule_engine'
  const suggestions = SUGGESTIONS[persona]

  return (
    <aside className="w-[340px] flex flex-col h-full bg-card border-l border-border flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <BotMessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Asistan</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <ProviderBadge provider={activeProvider} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Sohbeti temizle"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={toggleAIPanel}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          /* Welcome / suggestions */
          <div className="flex flex-col items-center gap-4 pt-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground mb-1">Merhaba!</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Portföyünüz hakkında soru sorabilirsiniz. Persona seçerek uzman perspektifinden yanıt alın.
              </p>
            </div>
            <div className="w-full space-y-1.5">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-accent hover:bg-accent/70 text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg =>
            msg.isLoading ? (
              <TypingIndicator key={msg.id} />
            ) : (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                provider={msg.provider}
                costUsd={msg.costUsd}
                durationMs={msg.durationMs}
                error={msg.error}
              />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <PersonaSelector value={persona} onChange={p => { setPersona(p); clearChat() }} />
          <span className="text-[10px] text-muted-foreground">Shift+Enter → yeni satır</span>
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isLoading}
            placeholder="Soru sorun..."
            className="flex-1 resize-none bg-accent rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-h-[36px] max-h-[120px]"
            style={{ height: 'auto', overflow: 'hidden' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
          />
          {isLoading ? (
            <button
              onClick={abort}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex-shrink-0"
              title="Durdur"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
