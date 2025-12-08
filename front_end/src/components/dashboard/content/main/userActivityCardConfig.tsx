import type { UserActivityFeedProps, UserActivityCardProps } from '~/types/common'

const UserActivityFeeds = [
  {
    title: 'Nguyễn Thu Hương',
    subtitle: 'Premium User',
    value: (
      <span className="text-white text-[1.2rem]! bg-yellow-500 rounded-xl p-[0.2rem_0.8rem]! font-medium!">
        Active
      </span>
    )
  },
  {
    title: 'Trần Minh Khôi',
    subtitle: 'Premium User',
    value: (
      <span className="text-white text-[1.2rem]! bg-yellow-500 rounded-xl p-[0.2rem_0.8rem]! font-medium!">
        Active
      </span>
    )
  },
  {
    title: 'Lê Thị Mai',
    subtitle: 'Customer',
    value: (
      <span className="text-white text-[1.2rem]! bg-yellow-500 rounded-xl p-[0.2rem_0.8rem]! font-medium!">
        Active
      </span>
    )
  }
] as UserActivityFeedProps

export const UserActivityCardConfig = {
  data: UserActivityFeeds,
  title: 'Users hoạt động'
} as UserActivityCardProps
