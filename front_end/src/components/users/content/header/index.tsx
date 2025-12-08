import SummaryCard from '~/components/common/SummaryCard'
import headerUsersConfig from './headerSummaryCardConfig'
import Box from '@mui/material/Box'

export default function HeaderUsersContent() {
  return (
    <Box className={'grid grid-cols-4 gap-[2.4rem]'}>
      {headerUsersConfig.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </Box>
  )
}




