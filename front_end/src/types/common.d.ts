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























// Dashboard types
export interface SummaryCardProps {
  title: string
  value: string | number
  icon?: any
  color?: string
  growth?: string
  [key: string]: any
}

export interface ActivityCardProps {
  title: string
  description?: string
  time?: string
  icon?: any
  [key: string]: any
}

export interface ActivityFeedProps {
  activities: ActivityCardProps[]
  [key: string]: any
}

export interface PopularPostProps {
  id: number
  title: string
  views?: number
  likes?: number
  [key: string]: any
}

export interface PopularPostFeedProps {
  posts: PopularPostProps[]
  [key: string]: any
}

export interface PriorityTaskCardProps {
  id: number
  title: string
  priority?: string
  status?: string
  [key: string]: any
}

export interface PriorityTaskCardFeedProps {
  tasks: PriorityTaskCardProps[]
  [key: string]: any
}

export interface QuickStaticCardProps {
  title: string
  value: string | number
  icon?: any
  [key: string]: any
}

export interface QuickStaticFeedProps {
  stats: QuickStaticCardProps[]
  [key: string]: any
}

export interface UserActivityCardProps {
  userId: number
  userName: string
  action: string
  time?: string
  [key: string]: any
}

export interface UserActivityFeedProps {
  activities: UserActivityCardProps[]
  [key: string]: any
}
