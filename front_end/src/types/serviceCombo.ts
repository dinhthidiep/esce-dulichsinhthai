// ServiceCombo response từ backend (PascalCase)
// Backend có PropertyNamingPolicy = null nên trả về PascalCase
export interface ServiceComboResponse {
  Id: number
  Name: string
  Address: string
  Description?: string | null
  Price: number
  AvailableSlots: number
  Image?: string | null
  Status: string // "open" | "closed" | "canceled" - default: "open"
  CancellationPolicy?: string | null
  CreatedAt: string // ISO datetime string
  UpdatedAt: string // ISO datetime string
  HostId: number
}

// Frontend ServiceItem format (camelCase cho dễ dùng trong component)
export interface ServiceItem {
  id: number
  name: string
  slug: string
  image: string
  rating: number
  price: number
  originalPrice?: number | null // Giá gốc nếu có giảm giá
  address: string
  availableSlots: number
  status: string
  description: string
}


