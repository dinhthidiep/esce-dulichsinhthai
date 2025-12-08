import Box from "@mui/material/Box"
import HeaderDashBoardContent from "./header"
import MainDashBoardContent from "./main"
export default function DashBoardContent() {
  return (
    <Box className="flex flex-col gap-[2.4rem]">
      <HeaderDashBoardContent />
      <MainDashBoardContent />
    </Box>
  )
}
