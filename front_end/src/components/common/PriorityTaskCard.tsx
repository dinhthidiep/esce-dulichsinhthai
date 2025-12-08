import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PriorityTaskCardProps } from '~/types/common'
import { cn } from '~/utils/tailwind.utils'
import PriorityTaskFeed from './PrioriyTaskFeed'

export default function PriorityTaskCard({
  data,
  bgClassName,
  title,
  titleClassName
}: PriorityTaskCardProps) {
  return (
    <Box
      sx={{
        bgcolor: 'common.white'
      }}
      className={cn(`p-[2.4rem]! flex flex-col gap-[2.4rem] rounded-3xl shadow-lg`, bgClassName)}
    >
      <Typography
        sx={{
          background: (theme) => theme.customBackgroundColor.main,
          backgroundClip: 'text',
          color: 'transparent'
        }}
        className={cn('text-[1.6rem]!', titleClassName)}
      >
        {title}
      </Typography>
      <Box className="flex flex-col gap-[1.2rem]">
        {data?.length > 0 && data.map((d) => <PriorityTaskFeed {...d} />)}
      </Box>
    </Box>
  )
}
