import type { PriorityTaskCardFeedProps, PriorityTaskCardProps } from '~/types/common'

const PriorityTaskCardFeeds = [
  {
    title: '3 tickets hỗ trợ',
    subTitle: 'Chờ xử lí',
    status: 'Urgent',
    titleClassName: 'text-red-800',
    bgClassName: 'bg-red-50 border-red-200! border! border-solid',
    subTitleClassName: 'text-red-600',
    statusClassName: 'bg-red-600 border! border-solid! border-red-200!'
  },
  {
    title: '2 yêu cầu nâng cấp',
    titleClassName: 'text-yellow-800',
    subTitle: 'Chờ duyệt',
    subTitleClassName: 'text-yellow-600',
    status: 'Medium',
    statusClassName: 'bg-green-600 border! border-solid! border-yellow-200!',
    bgClassName: 'bg-yellow-50 border-yellow-200! border! border-solid'
  },
  {
    title: '5 tin nhắn chat',
    titleClassName: 'text-blue-800',
    subTitle: 'Chưa đọc',
    subTitleClassName: 'text-blue-600',
    status: 'Low',
    statusClassName: 'bg-white! border! border-solid! border-green-600! text-green-600!',
    bgClassName: 'bg-blue-50 border-blue-200! border! border-solid'
  }
] as PriorityTaskCardFeedProps

export const PriorityTaskCardConfig = {
  title: 'Cần xử lý ưu tiên',
  data: PriorityTaskCardFeeds
} as PriorityTaskCardProps
