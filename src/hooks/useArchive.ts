import { useState, useEffect, useCallback } from 'react'
import { archiveApi } from '@/services/archiveApi'
import type { ArchiveSummary, PaginatedDocs, ArchiveReports, ArchiveContext, DocFilters } from '@/types/archive'

export function useArchiveSummary() {
  const [data, setData] = useState<ArchiveSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await archiveApi.getSummary()) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

export function useArchive(initialFilters: DocFilters = {}) {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedDocs | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await archiveApi.list({ ...filters, page })) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetch() }, [fetch])

  function updateFilters(f: Partial<DocFilters>) { setFilters(p => ({ ...p, ...f })); setPage(1) }
  function clearFilters() { setFilters({}); setPage(1) }

  return { data, loading, filters, setFilters: updateFilters, clearFilters, page, setPage, refetch: fetch }
}

export function useArchiveReports() {
  const [data, setData] = useState<ArchiveReports | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await archiveApi.getReports()) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

export function useArchiveContext() {
  const [data, setData] = useState<ArchiveContext | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await archiveApi.getContext()) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading }
}
