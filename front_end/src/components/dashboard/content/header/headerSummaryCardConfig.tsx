import type { SummaryCardProps } from '~/types/common'
import LegendToggleIcon from '@mui/icons-material/LegendToggle'
import EmailIcon from '@mui/icons-material/Email'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
const headerDashboardConfig = [
  {
    title: 'Tổng Users',
    value: '15.234',
    subtitle: '+18% so với tháng trước',
    bgColor: 'bg-linear-to-br from-blue-50 to-blue-100',
    textColor: 'text-blue-800',
    icon: <PeopleOutlineIcon sx={{ fontSize: '2rem' }} />
  },
  {
    title: 'Lượt truy cập',
    value: '45.678',
    subtitle: 'Tháng này',
    icon: <LegendToggleIcon sx={{ fontSize: '2rem' }} />,
    bgColor: 'bg-linear-to-br from-green-50 to-green-100',
    textColor: 'text-green-600'
  },
  {
    title: 'Bài viết',
    value: '1247',
    subtitle: '+32 bài viết mới tuần này',
    icon: <EmailIcon sx={{ fontSize: '2rem' }} />,
    bgColor: 'bg-linear-to-br from-purple-50 to-purple-100',
    textColor: 'text-purple-600'
  },
  {
    title: 'Hỗ trợ',
    value: '23',
    subtitle: 'Tickets chờ xử lí',
    icon: <HeadphonesIcon sx={{ fontSize: '2rem' }} />,
    bgColor: 'bg-linear-to-br from-orange-50 to-orange-100',
    textColor: 'text-orange-600'
  }
] as SummaryCardProps[]
export default headerDashboardConfig
