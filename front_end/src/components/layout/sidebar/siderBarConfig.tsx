import People from '@mui/icons-material/People'
import HomeIcon from '@mui/icons-material/Home'
import PostAddIcon from '@mui/icons-material/PostAdd'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import FeedIcon from '@mui/icons-material/Feed'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import ArticleIcon from '@mui/icons-material/Article'
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices'
import type { SideBarConfigType } from '~/types/menu'
export const sidebarConfig = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: <HomeIcon />,
    badge: 0
  },
  {
    title: 'Quản lý Users',
    path: '/admin/users',
    icon: <People />,
    badge: 0
  },
  {
    title: 'Bài viết',
    path: '/admin/post',
    icon: <PostAddIcon />,
    badge: 0
  },
  {
    title: 'Chat',
    path: '/admin/chat',
    icon: <ChatBubbleOutlineIcon />,
    badge: 0
  },
  {
    title: 'Tin tức',
    path: '/admin/news',
    icon: <FeedIcon />,
    badge: 0
  },
  {
    title: 'Duyệt Bài viết',
    path: '/admin/post-approvals',
    icon: <ArticleIcon />,
    badge: 0
  },
  {
    title: 'Duyệt Dịch vụ',
    path: '/admin/service-approvals',
    icon: <MiscellaneousServicesIcon />,
    badge: 0
  },
  {
    title: 'Nâng cấp vai trò',
    path: '/admin/role-upgrade',
    icon: <WorkspacePremiumIcon />,
    badge: 0
  },
  {
    title: 'Profile',
    path: '/admin/profile',
    icon: <AccountCircleIcon />,
    badge: 0
  }
] as SideBarConfigType[]
