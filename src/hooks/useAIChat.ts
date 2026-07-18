import { useState, useRef, useCallback, useEffect } from 'react'
import type { AIMessage, AIResponse } from '@/services/ai/types'
import { chat } from '@/services/ai/aiService'
import { aiMemoryV3 } from '@/services/ai/aiMemoryV3'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  provider?: string
  model?: string
  costUsd?: number
  durationMs?: number
  timestamp: string
  isLoading?: boolean
  error?: boolean
}

interface UseAIChatOptions {
  persona?: string
  maxRetries?: number
  onResponse?: (resp: AIResponse) => void
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const { maxRetries = 2, onResponse } = options
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const sessionId = useRef(`sess_${Date.now()}`)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    if (!mounted.current) return
    setIsLoading(false)
    setMessages(prev => prev.filter(m => !m.isLoading))
  }, [])

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    }
    const loadingMsg: ChatMessage = {
      id: `l_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setIsLoading(true)

    // Build conversation history for API
    const history: AIMessage[] = messages
      .filter(m => !m.isLoading && !m.error)
      .map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: userText.trim() })

    let attempt = 0
    let success = false

    while (attempt <= maxRetries && !success) {
      try {
        abortRef.current = new AbortController()
        const response = await chat(history)

        if (!mounted.current) return
        success = true

        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: response.content,
          provider: response.provider,
          model: response.model,
          costUsd: response.costUsd,
          durationMs: response.durationMs,
          timestamp: new Date().toISOString(),
        }

        setMessages(prev => [...prev.filter(m => !m.isLoading), assistantMsg])
        setIsLoading(false)

        // Memory: record the exchange
        aiMemoryV3.record(
          'chat',
          userText.slice(0, 150),
          { q: userText, a: response.content.slice(0, 300) },
          'ai_panel',
          [response.provider, options.persona ?? 'ceo'],
        )

        onResponse?.(response)
      } catch (err) {
        attempt++
        if (attempt > maxRetries || !mounted.current) {
          if (!mounted.current) return
          const errMsg: ChatMessage = {
            id: `e_${Date.now()}`,
            role: 'assistant',
            content: `Bağlantı hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}. Tekrar deneyin.`,
            timestamp: new Date().toISOString(),
            error: true,
          }
          setMessages(prev => [...prev.filter(m => !m.isLoading), errMsg])
          setIsLoading(false)
        }
      }
    }
  }, [isLoading, messages, maxRetries, onResponse, options.persona])

  const clearChat = useCallback(() => {
    abort()
    setMessages([])
    sessionId.current = `sess_${Date.now()}`
  }, [abort])

  return { messages, isLoading, sendMessage, abort, clearChat, sessionId: sessionId.current }
}
