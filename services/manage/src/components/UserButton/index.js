import { UserMenu } from '../UserMenu/UserMenu'

export function UserButton({ onClick }) {
  const opened = true
  // const { token, idToken, login, logOut } = useContext(AuthContext)
  return <UserMenu opened={opened} />
}
