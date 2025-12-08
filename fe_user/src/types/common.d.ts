export interface Service {
  id: number
  name: string
  slug: string
  image: string
  rating: number
  priceFrom: number
  originalPrice: number | null
  discountPercent: number | null
}

export interface Stat {
  id: number
  value: string
  label: string
  color: string
}

export interface Feature {
  id: number
  icon: string
  title: string
  description: string
}

export interface Review {
  id: number
  name: string
  initials: string
  rating: number
  comment: string
  service: string
  timeAgo: string
}

export interface Tour {
  Id?: number
  id?: number
  Name?: string
  name?: string
  [key: string]: unknown
}





















