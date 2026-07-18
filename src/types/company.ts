export interface Company {
  id: number
  company_name: string
  tax_number: string | null
  tax_office: string | null
  phone: string | null
  mail: string | null
  address: string | null
  logo: string | null
  currency: string
  status: string
  created_at: string
  updated_at: string
}
