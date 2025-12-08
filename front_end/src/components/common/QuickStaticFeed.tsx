import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { QuickStaticFeedProps } from '~/types/common'
import { cn } from '~/utils/tailwind.utils'

export default function QuickStaticFeed({
  title,
  value,
  titleClassName,
  valueClassName
}: QuickStaticFeedProps) {
  return (
    <Box className="flex justify-between items-center">
      <Typography className={cn('text-[1.4rem]!', titleClassName)}>{title}</Typography>
      <Typography
        className={cn(
          'inline-flex px-[0.8rem]! py-[0.2rem]! justify-center items-center rounded-2xl text-[1.2rem]! font-semibold!',
          valueClassName
        )}
        color="common.white"
      >
        {value}
      </Typography>
    </Box>
  )
}
