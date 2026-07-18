import { useState } from 'react'
import { Tabs, PageHeader } from '@/components/ui'
import { FinancialSummary } from '@/modules/finans/FinancialSummary'
import { CashAccounts } from '@/modules/finans/CashAccounts'
import { BankAccounts } from '@/modules/finans/BankAccounts'
import { CreditCards } from '@/modules/finans/CreditCards'
import { CapitalMovements } from '@/modules/finans/CapitalMovements'
import { MoneyTransfers } from '@/modules/finans/MoneyTransfers'
import { Receivables } from '@/modules/finans/Receivables'
import { Payables } from '@/modules/finans/Payables'
import { FinancialTransactions } from '@/modules/finans/FinancialTransactions'

const TABS = [
  { id: 'ozet', label: 'Özet' },
  { id: 'kasa', label: 'Kasa' },
  { id: 'banka', label: 'Bankalar' },
  { id: 'kredi', label: 'Kredi Kartları' },
  { id: 'sermaye', label: 'Sermaye' },
  { id: 'transfer', label: 'Transferler' },
  { id: 'alacak', label: 'Alacaklar' },
  { id: 'borc', label: 'Borçlar' },
  { id: 'islem', label: 'İşlemler' },
]

const TAB_QUICK_ACTIONS: Record<string, string> = {
  capital: 'sermaye',
  cash: 'kasa',
  transfer: 'transfer',
  bank: 'banka',
  receivable: 'alacak',
  payable: 'borc',
}

export function Finans() {
  const [activeTab, setActiveTab] = useState('ozet')

  function handleQuickAction(action: string) {
    const tab = TAB_QUICK_ACTIONS[action]
    if (tab) setActiveTab(tab)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Finansal Merkez"
        description="Sermaye, nakit, banka, alacak ve borç yönetimi"
      />

      <div className="px-6">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'ozet' && <FinancialSummary onQuickAction={handleQuickAction} />}
        {activeTab === 'kasa' && <CashAccounts />}
        {activeTab === 'banka' && <BankAccounts />}
        {activeTab === 'kredi' && <CreditCards />}
        {activeTab === 'sermaye' && <CapitalMovements />}
        {activeTab === 'transfer' && <MoneyTransfers />}
        {activeTab === 'alacak' && <Receivables />}
        {activeTab === 'borc' && <Payables />}
        {activeTab === 'islem' && <FinancialTransactions />}
      </div>
    </div>
  )
}
