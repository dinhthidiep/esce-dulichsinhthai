import type { ActivityCardProps, ActivityFeedProps } from '~/types/common'

const ActivityFeeds = [
  {
    desc: 'User mới "Nguyễn Văn An" đã đăng ký',
    time: '5 phút trước',
    markColorClassName: 'bg-green-500'
  },
  {
    desc: 'Bài viết mới "Khám phá Sapa" đã được đăng',
    time: '15 phút trước',
    markColorClassName: 'bg-blue-500'
  },
  {
    desc: 'Ticket hỗ trợ mới từ "Trần Thị Bình"',
    time: '30 phút trước',
    markColorClassName: 'bg-orange-500'
  },
  {
    desc: 'Tin tức mới "Khuyến mãi mùa hè" đã xuất bản',
    time: '1 giờ trước',
    markColorClassName: 'bg-purple-500'
  },
  {
    desc: 'Yêu cầu nâng cấp từ "Lê Minh Cường"',
    time: '2 giờ trước',
    markColorClassName: 'bg-red-500'
  }
] as ActivityFeedProps[]

export const ActivityCardConfig = {
  data: ActivityFeeds,
  title: 'Hoạt động gần đây',
  bgColorClassName: 'bg-white'
} as ActivityCardProps
