import dayjs from 'dayjs'
import 'dayjs/locale/tr'

dayjs.locale('tr')

export function formatCurrency(value: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: string | Date, template = 'DD MMMM YYYY'): string {
  return dayjs(date).format(template)
}

export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm')
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD MMM YYYY, HH:mm')
}

export function formatRelative(date: string | Date): string {
  const now = dayjs()
  const d = dayjs(date)
  const diffMin = now.diff(d, 'minute')
  if (diffMin < 1) return 'az önce'
  if (diffMin < 60) return `${diffMin}dk önce`
  const diffHour = now.diff(d, 'hour')
  if (diffHour < 24) return `${diffHour}sa önce`
  const diffDay = now.diff(d, 'day')
  if (diffDay < 7) return `${diffDay}g önce`
  return d.format('DD MMM')
}

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}
