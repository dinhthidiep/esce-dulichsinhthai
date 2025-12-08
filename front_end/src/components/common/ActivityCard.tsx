import Typography from '@mui/material/Typography'
import type { ActivityCardProps } from '~/types/common'
import ActivityFeed from './ActivityFeed'
import { cn } from '~/utils/tailwind.utils'
import Box from '@mui/material/Box'

export default function ActivityCard({
  title,
  bgClassName,
  titleClassName,
  customClassNameWrapper,
  customClassNameTitle,
  data
}: ActivityCardProps) {
  return (
    <Box
      sx={{
        bgcolor: 'common.white'
      }}
      className={cn(
        `flex flex-col  p-[2.4rem]! gap-[2.4rem] rounded-3xl shadow-3xl ${bgClassName} `,
        customClassNameWrapper
      )}
    >
      <Typography
        sx={{
          background: (theme) => theme.customBackgroundColor.main,
          backgroundClip: 'text',
          color: 'transparent'
        }}
        className={cn(`${titleClassName} text-[1.6rem]!`, customClassNameTitle)}
      >
        {title}
      </Typography>
      <Box className="flex flex-col gap-[1.6rem]">
        {data?.length > 0 && data.map((d) => <ActivityFeed {...d} />)}
      </Box>
    </Box>
  )
}
