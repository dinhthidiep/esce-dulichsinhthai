import type { ReactNode } from 'react'

// === Base Card Generic ===
export type CardProps<TFeed> = {
  title?: string
  titleClassName?: string
  bgClassName?: string
  data: TFeed[]
}

// === Summary Card (khác biệt nên tách riêng) ===
export interface SummaryCardProps {
  bgColor?: string
  textColor?: string
  borderColor?: string
  icon?: ReactNode
  title?: string
  value?: string
  subtitle?: string
}

// === Activity Card ===
export type ActivityFeedProps = {
  bgColorClassName?: string
  markColorClassName?: string
  descColorClassName?: string
  time?: string
  timeColorClassName?: string
  desc?: string
}
export type ActivityCardProps = CardProps<ActivityFeedProps> & {
  customClassNameWrapper?: string
  customClassNameTitle?: string
}

// === Quick Static Card ===
export type QuickStaticFeedProps = {
  title?: string
  value?: string
  titleClassName?: string
  valueClassName?: string
}
export type QuickStaticCardProps = CardProps<QuickStaticFeedProps>

// === Priority Task Card ===
export type PriorityTaskCardFeedProps = {
  title?: string
  titleClassName?: string
  subTitle?: string
  subTitleClassName?: string
  status?: string
  statusClassName?: string
  bgClassName?: string
}
export type PriorityTaskCardProps = CardProps<PriorityTaskCardFeedProps>

// === Popular Post ===
export type PopularPostFeedProps = {
  title?: string
  titleClassName?: string
  subtitle?: string
  subtitleClassName?: string
  value?: ReactNode
  valueClassName?: string
}
export type PopularPostProps = CardProps<PopularPostFeedProps>

// === User hoạt động ===
export type UserActivityFeedProps = PopularPostFeedProps
export type UserActivityCardProps = PopularPostProps
