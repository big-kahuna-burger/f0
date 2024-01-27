import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Tabs,
  Text,
  ThemeIcon,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { IconDatabase, IconPlayerPlay } from '@tabler/icons-react'
import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { updateDBConnection } from '../../api'

export function Connection() {
  const { connection, tab } = useLoaderData()

  return (
    <Paper align="center">
      <Tabs maw={850} defaultValue={tab || 'settings'}>
        <Header />
        <Tabs.List grow justify="center">
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          <Tabs.Tab value="authmethods">Authentication Methods</Tabs.Tab>
          <Tabs.Tab value="apps">Applications</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="settings">
          <SettingsPanel />
        </Tabs.Panel>
        <Tabs.Panel value="authmethods">
          <AuthMethodsPanel />
        </Tabs.Panel>
        <Tabs.Panel value="apps">
          <AppsPanel />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  )
}

function Header() {
  const colorScheme = useColorScheme()
  const { connection } = useLoaderData()
  return (
    <Group align={'center'} p="md" pb="lg" justify="space-between">
      <Group>
        <ThemeIcon variant={'outline'} size={60}>
          <IconDatabase
            style={{ width: rem(48), height: rem(48) }}
            stroke={0.7}
          />
        </ThemeIcon>
        <Stack>
          <Text size="lg">{connection.name}</Text>
          <Group>
            <Text size="xs" c={'dimmed'}>
              Database
            </Text>
            <Text size="xs" c={'dimmed'}>
              Identifier
            </Text>
            <Text size="xs" c={colorScheme === 'dark' ? 'lime' : 'purple'}>
              {connection.id}
            </Text>
          </Group>
        </Stack>
      </Group>
      <Button
        variant="outline"
        rightSection={
          <ThemeIcon variant={'transparent'}>
            <IconPlayerPlay stroke={1} />
          </ThemeIcon>
        }
      >
        Try Connection
      </Button>
    </Group>
  )
}

function SettingsPanel() {
  const { connection } = useLoaderData()
  const [activeConnection, setActiveConnection] = useState(connection)
  const [loading, setLoading] = useState(false)
  const handleSignupToggle = async () => {
    setLoading(true)
    try {
      const response = await updateDBConnection({
        id: activeConnection.id,
        disableSignup: !activeConnection.disableSignup
      })
      setActiveConnection(response)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <Paper withBorder p="sm" m="md">
        <Group justify="space-between" align="center">
          <Stack align="flex-start" maw={680}>
            <Text>Disable Sign Ups</Text>
            <Text size="xs" c="dimmed">
              Prevent new user sign ups to your application from public
              (unauthenticated) endpoints. You will still be able to create
              users with your API credentials or from the Management dashboard.
            </Text>
          </Stack>
          <>
            <Switch
              disabled={loading}
              checked={activeConnection.disableSignup}
              onChange={handleSignupToggle}
            />
          </>
        </Group>
      </Paper>
      <DangerZone />
    </>
  )
}

function AuthMethodsPanel() {
  return <Text>AuthMethods</Text>
}

function AppsPanel() {
  return <Text>Apps</Text>
}

function DangerZone() {
  return (
    <Paper m="md" withBorder>
      <Alert title={'Delete this connection'} color="red">
        <Group justify="space-between" align="center">
          <Text size="sm" c="var(--mantine-color-red-light-color)">
            Warning! Once confirmed, this operation can't be undone!
          </Text>
          <Button
            mb={'xl'}
            size="sm"
            type={'button'}
            color={'red'}
            onClick={() => {
              console.log('delete')
            }}
          >
            Delete
          </Button>
        </Group>
      </Alert>
    </Paper>
  )
}
