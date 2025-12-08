import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PopularPostFeedProps } from '~/types/common'
import { cn } from '~/utils/tailwind.utils'

export default function PopularPostFeed({
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
  value,
  valueClassName
}: PopularPostFeedProps) {
  return (
    <Box className={'flex items-center justify-between'}>
      <Box className={'flex flex-col'}>
        <Typography
          color="common.black"
          className={cn('text-[1.4rem]! font-medium!', titleClassName)}
        >
          {title}
        </Typography>
        <Typography color="grey.600" className={cn('text-[1.2rem]!', subtitleClassName)}>
          {subtitle}
        </Typography>
      </Box>
      <Box className={cn('flex items-center', valueClassName)}>{value}</Box>
    </Box>
  )
}
