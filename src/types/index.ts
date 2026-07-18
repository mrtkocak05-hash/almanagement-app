// Common utility types
export type ID = string | number

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

// API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// Pagination
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Theme
export type Theme = 'dark' | 'light' | 'system'

// Navigation
export interface NavItem {
  label: string
  path: string
  icon?: string
  children?: NavItem[]
}
