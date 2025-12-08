import type { PopularPostFeedProps, PopularPostProps } from '~/types/common'

const PopularPostFeeds = [
  {
    title: 'Khám phá Phong Nha',
    subtitle: '1,250 views',
    value: <span className="text-[1.4rem]! font-medium!">89 ❤️</span>
  },
  {
    title: 'Top 10 địa điểm',
    subtitle: '2,340 views',
    value: <span className="text-[1.4rem]! font-medium!">156 ❤️</span>
  },
  {
    title: 'Kinh nghiệm Sapa',
    subtitle: '890 views',
    value: <span className="text-[1.4rem]! font-medium!">45 ❤️</span>
  }
] as PopularPostFeedProps

export const PopularPostCardConfig = {
  data: PopularPostFeeds,
  title: 'Bài viết phổ biến'
} as PopularPostProps
