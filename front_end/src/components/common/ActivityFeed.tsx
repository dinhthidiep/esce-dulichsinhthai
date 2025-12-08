import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ActivityFeedProps } from '~/types/common'
import { cn } from '~/utils/tailwind.utils'

export default function ActivityFeed({
  time,
  bgColorClassName,
  desc,
  timeColorClassName,
  descColorClassName,
  markColorClassName
}: ActivityFeedProps) {
  return (
    <Box className={cn(`flex gap-[1.2rem] items-center ${bgColorClassName}`)}>
      <Typography
        className={`w-[0.8rem] h-[0.8rem] rounded-[50%] ${markColorClassName}`}
      ></Typography>
      <Box className="flex flex-col">
        <Typography color="common.black" className={`text-[1.4rem]! ${descColorClassName}`}>
          {desc}
        </Typography>
        <Typography
          className={`text-[1.2rem]! ${timeColorClassName}`}
          sx={{
            color: 'grey.600'
          }}
        >
          {time}
        </Typography>
      </Box>
    </Box>
  )
}
