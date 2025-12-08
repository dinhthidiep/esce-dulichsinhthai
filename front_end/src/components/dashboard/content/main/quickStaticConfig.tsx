import type { QuickStaticFeedProps, QuickStaticCardProps } from '~/types/common'

const QuickStaticFeeds = [
  {
    title: 'Comments hôm nay',
    value: '234',
    valueClassName: 'bg-yellow-500'
  },
  {
    title: 'Reactions hôm nay',
    value: '567',
    valueClassName: 'bg-yellow-500'
  },
  {
    title: 'Chat messages',
    value: '89',
    valueClassName: 'bg-yellow-500'
  },
  {
    title: 'Thông báo chưa đọc',
    value: '8',
    valueClassName: 'bg-red-500'
  },
  {
    title: 'Tours active',
    value: '158',
    valueClassName: 'bg-green-500'
  },

  {
    title: 'Bookings hôm nay',
    value: '23',
    valueClassName: 'bg-yellow-500'
  }
] as QuickStaticFeedProps

export const QuickStaticConfig = {
  title: 'Thống kê nhanh',
  data: QuickStaticFeeds
} as QuickStaticCardProps
