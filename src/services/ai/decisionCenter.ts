import type { DecisionRequest, DecisionResponse } from './types'
import { useAuthStore } from '@/store/authStore'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = useAuthStore.getState().accessToken
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function callDecision(path: string, body: DecisionRequest, signal?: AbortSignal): Promise<DecisionResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    signal,
  })
  const data = await res.json() as { success: boolean; data: DecisionResponse; message?: string }
  if (!data.success) throw new Error(data.message ?? 'Karar motoru hatası.')
  return data.data
}

export const decisionCenter = {
  ask(question: string, context?: Record<string, unknown>, signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision', { question, context }, signal)
  },

  analyzeInvestment(saleId?: number, signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/investment', { saleId }, signal)
  },

  analyzePortfolio(signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/portfolio', {}, signal)
  },

  analyzeExpense(assetId?: number, signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/expense', { assetId }, signal)
  },

  analyzeSale(assetId?: number, signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/sale', { assetId }, signal)
  },

  recommend(topic = 'genel', signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/recommend', { topic }, signal)
  },

  forecast(period = '3ay', signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/forecast', { period }, signal)
  },

  compare(assetIds: number[], signal?: AbortSignal): Promise<DecisionResponse> {
    return callDecision('/api/ai/decision/compare', { assetIds }, signal)
  },
}
