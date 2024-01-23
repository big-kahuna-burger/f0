import { AppShell, Burger, Group } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import RoutedNavbar from './components/NavBar/RoutedNavbar'
import ToggleScheme from './components/SchemeSwitcher'
import { UserCardImage } from './components/UserCardImage'
const notLocalhost = !window.location.hostname.includes('localhost')
function Shell() {
  const location = useLocation()
  const [opened, { toggle }] = useDisclosure(true)
  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: !opened }
      }}
      aside={{
        width: '0%',
        breakpoint: 'sm',
        collapsed: { desktop: false, mobile: true }
      }}
      padding="md"
    >
      <AppShell.Header>
        {notLocalhost && <SpeedInsights />}
        <Group width="100%" px="md" align="center" justify="space-between">
          <Burger pt="xl" pl="md" opened={opened} onClick={toggle} size="sm" />
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
      <AppShell.Footer />
    </AppShell>
  )
}

export default Shell
