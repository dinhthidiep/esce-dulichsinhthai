import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { QuickStaticCardProps } from '~/types/common'
import { cn } from '~/utils/tailwind.utils'
import QuickStaticFeed from './QuickStaticFeed'

export default function QuickStaticCard({
  data,
  title,
  bgClassName,
  titleClassName
}: QuickStaticCardProps) {
  return (
    <Box
      bgcolor={'common.white'}
      className={cn(`flex flex-col p-[2.4rem]! gap-[2.4rem]! rounded-3xl shadow-3xl`, bgClassName)}
    >
      <Typography
        sx={{
          background: (theme) => theme.customBackgroundColor.main,
          color: 'transparent',
          backgroundClip: 'text'
        }}
        className={cn(`text-[1.6rem]!`, titleClassName)}
      >
        {title}
      </Typography>
      <Box className="flex flex-col gap-[1.6rem]">
        {data?.length > 0 && data.map((d) => <QuickStaticFeed {...d} />)}
      </Box>
    </Box>
  )
}
