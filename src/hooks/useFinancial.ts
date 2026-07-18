import { useState, useEffect, useCallback } from 'react'
import { financialApi } from '@/services/financialApi'
import type {
  FinancialSummary, CashAccount, BankAccount, CreditCard,
  CapitalMovement, MoneyTransfer, FinancialTransaction,
  Receivable, Payable, PaginatedResponse,
} from '@/types/financial'

function makeSimpleHook<T>(fetcher: () => Promise<T>) {
  return function useHook() {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const fetch = useCallback(async () => {
      try { setLoading(true); setError(null); setData(await fetcher()) }
      catch (e) { setError(e instanceof Error ? e.message : 'Veri alınamadı') }
      finally { setLoading(false) }
    }, [])
    useEffect(() => { fetch() }, [fetch])
    return { data, loading, error, refetch: fetch }
  }
}

export const useFinancialSummary = makeSimpleHook<FinancialSummary>(financialApi.getSummary)
export const useCashAccounts = makeSimpleHook<CashAccount[]>(financialApi.listCashAccounts)
export const useBankAccounts = makeSimpleHook<BankAccount[]>(financialApi.listBankAccounts)
export const useCreditCards = makeSimpleHook<CreditCard[]>(financialApi.listCreditCards)

function makePaginatedHook<T>(fetcher: (page: number) => Promise<PaginatedResponse<T>>) {
  return function useHook() {
    const [page, setPage] = useState(1)
    const [data, setData] = useState<PaginatedResponse<T> | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const fetch = useCallback(async () => {
      try { setLoading(true); setError(null); setData(await fetcher(page)) }
      catch (e) { setError(e instanceof Error ? e.message : 'Veri alınamadı') }
      finally { setLoading(false) }
    }, [page])
    useEffect(() => { fetch() }, [fetch])
    return { data, loading, error, page, setPage, refetch: fetch }
  }
}

export const useCapitalMovements = makePaginatedHook<CapitalMovement>(financialApi.listCapitalMovements)
export const useMoneyTransfers = makePaginatedHook<MoneyTransfer>(financialApi.listTransfers)
export const useFinancialTransactions = makePaginatedHook<FinancialTransaction>(p => financialApi.listTransactions(undefined, p))

export function useReceivables(status?: string) {
  const [data, setData] = useState<PaginatedResponse<Receivable> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetch = useCallback(async () => {
    try { setLoading(true); setError(null); setData(await financialApi.listReceivables(status)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Veri alınamadı') }
    finally { setLoading(false) }
  }, [status])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}

export function usePayables(status?: string) {
  const [data, setData] = useState<PaginatedResponse<Payable> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetch = useCallback(async () => {
    try { setLoading(true); setError(null); setData(await financialApi.listPayables(status)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Veri alınamadı') }
    finally { setLoading(false) }
  }, [status])
  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}
