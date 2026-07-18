import { useState, useEffect, useCallback } from 'react'
import { docIntelApi } from '@/services/documentIntelligenceApi'
import type {
  DocumentHealth,
  ExpiringDocument,
  MissingDocument,
  DocIntelStats,
} from '@/types/documentIntelligence'

export function useDocumentHealth() {
  const [data, setData]       = useState<DocumentHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await docIntelApi.getHealth())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh }
}

export function useExpiringDocuments(days = 30) {
  const [data, setData]       = useState<ExpiringDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await docIntelApi.getExpiring(days))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh }
}

export function useMissingDocuments() {
  const [data, setData]       = useState<MissingDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await docIntelApi.getMissing())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh }
}

export function useDocIntelStats() {
  const [data, setData]       = useState<DocIntelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await docIntelApi.getStats())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, refresh }
}
