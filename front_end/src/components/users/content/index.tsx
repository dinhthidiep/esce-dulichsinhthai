import Box from "@mui/material/Box"
import HeaderUsersContent from "./header"
import MainUsersContent from "./main"

export default function UsersContent() {
  return (
    <Box className="flex flex-col gap-[2.4rem]">
      <HeaderUsersContent />
      <MainUsersContent />
    </Box>
  )
}




