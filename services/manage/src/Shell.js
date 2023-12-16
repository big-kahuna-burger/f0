import { AppShell, Group } from '@mantine/core'
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import RoutedNavbar from './components/NavBar/RoutedNavbar'
import ToggleScheme from './components/SchemeSwitcher'
import { UserCardImage } from './components/UserCardImage'
function Shell() {
  const location = useLocation()
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        {
          <Group h="100%" px="md">
            <ToggleScheme />
          </Group>
        }
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <RoutedNavbar />
      </AppShell.Navbar>
      <AppShell.Main w="75%">
        <Outlet />
      </AppShell.Main>
      <AppShell.Aside w="25%">
        {location.pathname.startsWith('/users') && (
          <SelectedUserContext.Consumer>
            {({ user }) => user && <UserCardImage user={user} />}
          </SelectedUserContext.Consumer>
        )}
      </AppShell.Aside>
    </AppShell>
  )
}

export default Shell
