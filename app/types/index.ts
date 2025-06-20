export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  phone?: string
  last_sign_in_at?: string
  created_at: string
  avatar_url?: string
  total_orders?: number
  total_sales?: number
}

export interface Profile {
  id: string
  first_name: string
  last_name: string
  phone?: string
  role: string
  status: string
  created_at: string
  avatar_url?: string
  total_orders?: number
  total_sales?: number
  users?: {
    email: string
    last_sign_in_at?: string
  }
} 