export type MembershipTier = 'none' | 'silver' | 'gold' | 'diamond'

export interface ComplementaryService {
  id: number
  name: string
  description: string
  value: number
}

export interface TierComplementaryServices {
  maxSelectable: number
  availableServices: ComplementaryService[]
}


