import { Avatar, Group, Text, UnstyledButton, rem } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { UserMenu } from '../UserMenu/UserMenu'
import classes from './UserButton.module.css'

export function UserButton({ onClick }) {
  const opened = true
  // const { token, idToken, login, logOut } = useContext(AuthContext)
  return <UserMenu opened={opened} />
}
