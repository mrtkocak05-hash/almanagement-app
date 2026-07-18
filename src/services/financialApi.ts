import type {
  FinancialSummary, CashAccount, BankAccount, CreditCard,
  CapitalMovement, MoneyTransfer, FinancialTransaction,
  Receivable, Payable, PaginatedResponse,
} from '@/types/financial'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/financial'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  })
  const json = await res.json() as { success: boolean; data: T; message?: string }
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`)
  return json.data
}

function post<T>(url: string, body: unknown) {
  return req<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

function put<T>(url: string, body: unknown) {
  return req<T>(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

function del(url: string) {
  return req<void>(url, { method: 'DELETE' })
}

export const financialApi = {
  getSummary: () => req<FinancialSummary>(`${BASE}/summary`),

  // Cash Accounts
  listCashAccounts: () => req<CashAccount[]>(`${BASE}/cash-accounts`),
  createCashAccount: (d: Partial<CashAccount>) => post<CashAccount>(`${BASE}/cash-accounts`, d),
  updateCashAccount: (id: number, d: Partial<CashAccount>) => put<CashAccount>(`${BASE}/cash-accounts/${id}`, d),
  deleteCashAccount: (id: number) => del(`${BASE}/cash-accounts/${id}`),
  adjustCashBalance: (id: number, amount: number, type: 'income' | 'expense', description?: string) =>
    post<CashAccount>(`${BASE}/cash-accounts/${id}/adjust`, { amount, type, description }),

  // Bank Accounts
  listBankAccounts: () => req<BankAccount[]>(`${BASE}/bank-accounts`),
  createBankAccount: (d: Partial<BankAccount>) => post<BankAccount>(`${BASE}/bank-accounts`, d),
  updateBankAccount: (id: number, d: Partial<BankAccount>) => put<BankAccount>(`${BASE}/bank-accounts/${id}`, d),
  deleteBankAccount: (id: number) => del(`${BASE}/bank-accounts/${id}`),
  adjustBankBalance: (id: number, amount: number, type: 'income' | 'expense', description?: string) =>
    post<BankAccount>(`${BASE}/bank-accounts/${id}/adjust`, { amount, type, description }),

  // Credit Cards
  listCreditCards: () => req<CreditCard[]>(`${BASE}/credit-cards`),
  createCreditCard: (d: Partial<CreditCard>) => post<CreditCard>(`${BASE}/credit-cards`, d),
  updateCreditCard: (id: number, d: Partial<CreditCard>) => put<CreditCard>(`${BASE}/credit-cards/${id}`, d),
  deleteCreditCard: (id: number) => del(`${BASE}/credit-cards/${id}`),

  // Capital Movements
  listCapitalMovements: (page = 1) => req<PaginatedResponse<CapitalMovement>>(`${BASE}/capital-movements?page=${page}`),
  createCapitalMovement: (d: Partial<CapitalMovement>) => post<CapitalMovement>(`${BASE}/capital-movements`, d),
  deleteCapitalMovement: (id: number) => del(`${BASE}/capital-movements/${id}`),

  // Transfers
  listTransfers: (page = 1) => req<PaginatedResponse<MoneyTransfer>>(`${BASE}/transfers?page=${page}`),
  createTransfer: (d: {
    from_type: string; from_id: number; to_type: string; to_id: number
    amount: number; currency?: string; exchange_rate?: number; transfer_date?: string; description?: string
  }) => post<MoneyTransfer>(`${BASE}/transfers`, d),

  // Receivables
  listReceivables: (status?: string, page = 1) =>
    req<PaginatedResponse<Receivable>>(`${BASE}/receivables?page=${page}${status ? `&status=${status}` : ''}`),
  createReceivable: (d: Partial<Receivable>) => post<Receivable>(`${BASE}/receivables`, d),
  collectReceivable: (id: number, amount: number, cashId?: number, bankId?: number) =>
    post<Receivable>(`${BASE}/receivables/${id}/collect`, { amount, cash_account_id: cashId, bank_account_id: bankId }),
  deleteReceivable: (id: number) => del(`${BASE}/receivables/${id}`),

  // Payables
  listPayables: (status?: string, page = 1) =>
    req<PaginatedResponse<Payable>>(`${BASE}/payables?page=${page}${status ? `&status=${status}` : ''}`),
  createPayable: (d: Partial<Payable>) => post<Payable>(`${BASE}/payables`, d),
  payPayable: (id: number, amount: number, cashId?: number, bankId?: number) =>
    post<Payable>(`${BASE}/payables/${id}/pay`, { amount, cash_account_id: cashId, bank_account_id: bankId }),
  deletePayable: (id: number) => del(`${BASE}/payables/${id}`),

  // Transactions
  listTransactions: (type?: string, page = 1) =>
    req<PaginatedResponse<FinancialTransaction>>(`${BASE}/transactions?page=${page}${type ? `&type=${type}` : ''}`),
  createTransaction: (d: Partial<FinancialTransaction>) => post<FinancialTransaction>(`${BASE}/transactions`, d),
}
