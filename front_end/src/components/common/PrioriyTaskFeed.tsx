import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PriorityTaskCardFeedProps } from '~/types/common'
import { cn } from '~/utils/tailwind.utils'

export default function PriorityTaskFeed({
  title,
  titleClassName,
  subTitle,
  subTitleClassName,
  status,
  statusClassName,
  bgClassName
}: PriorityTaskCardFeedProps) {
  return (
    <Box
      className={cn(
        'p-[1.2rem]! flex justify-between items-center bg-red-50 rounded-2xl',
        bgClassName
      )}
    >
      <Box className="flex flex-col">
        <Typography className={cn('text-red-950 font-medium! text-[1.4rem]!', titleClassName)}>
          {title}
        </Typography>
        <Typography className={cn('text-red-600 text-[1.2rem]!', subTitleClassName)}>
          {subTitle}
        </Typography>
      </Box>
      <Typography
        sx={{ color: 'common.white' }}
        className={cn(
          'px-[0.8rem]! py-[0.2rem]! font-medium! bg-red-600 text-[1.2rem]! rounded-xl flex justify-center items-center',
          statusClassName
        )}
      >
        {status}
      </Typography>
    </Box>
  )
}
