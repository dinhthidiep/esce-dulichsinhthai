import type { ListItemButtonProps } from "@mui/material/ListItemButton"
import type { SideBarConfigType } from "~/types/menu"

export type SideBarConfigType = {
  title: string
  path: string
  icon?: React.ReactNode
  badge?: number
}

export interface SideBarItemProps extends ListItemButtonProps {
  data: SideBarConfigType
  open: boolean
  onClick?: () => void
  renderIcon?: (data: SideBarConfigType, isActive: boolean) => React.ReactNode
  renderText?: (data: SideBarConfigType, isActive: boolean) => React.ReactNode
}
