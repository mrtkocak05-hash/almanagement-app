import { useState, useEffect, useCallback } from 'react'
import { expensesApi } from '@/services/expensesApi'
import type {
  ExpenseSummary, PaginatedExpenses, ExpenseReports,
  FormContext, ExpenseFilters,
} from '@/types/expenses'

export function useExpenseSummary() {
  const [data, setData] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await expensesApi.getSummary()) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

export function useExpenses(initialFilters: ExpenseFilters = {}) {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedExpenses | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setData(await expensesApi.list({ ...filters, page }))
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetch() }, [fetch])

  function updateFilters(f: Partial<ExpenseFilters>) {
    setFilters(prev => ({ ...prev, ...f }))
    setPage(1)
  }

  function clearFilters() { setFilters({}); setPage(1) }

  return { data, loading, filters, setFilters: updateFilters, clearFilters, page, setPage, refetch: fetch }
}

export function useExpenseReports(year?: number) {
  const [data, setData] = useState<ExpenseReports | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await expensesApi.getReports(year)) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [year])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

export function useFormContext() {
  const [data, setData] = useState<FormContext | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    try { setLoading(true); setData(await expensesApi.getFormContext()) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading }
}
