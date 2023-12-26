import { AppShell, Burger, Group } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import RoutedNavbar from './components/NavBar/RoutedNavbar'
import ToggleScheme from './components/SchemeSwitcher'
import { UserCardImage } from './components/UserCardImage'

function Shell() {
  const location = useLocation()
  const [opened, { toggle }] = useDisclosure()
  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      aside={{ width: '15%', breakpoint: 'sm', collapsed: { desktop: false, mobile: true } }}
      padding="md"
    >
      <AppShell.Header>
        <Group width="100%" px="md" align='center' justify='space-between'>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <ToggleScheme />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <RoutedNavbar />
      </AppShell.Navbar>
      <AppShell.Main w="100%">
        <Outlet />
      </AppShell.Main>
      <AppShell.Aside>
        {location.pathname.startsWith('/users') && (
          <SelectedUserContext.Consumer>
            {({ user }) => user && <UserCardImage user={user} />}
          </SelectedUserContext.Consumer>
        )}
      </AppShell.Aside>
      <AppShell.Footer/>
    </AppShell>
  )
}

export default Shell
