import { Code, Group, Stack, Tabs } from '@mantine/core'

import { useLoaderData, useNavigate } from 'react-router-dom'
import { ApplicationConnections } from './ApplicationConnections'
import { CredentialsTab } from './Credentials'
import QuickStart from './QuickStart'
import { Settings } from './Settings'
export function Application() {
  const navigate = useNavigate()
  const { activeApp, tab } = useLoaderData()
  return (
    <Stack align="center" justify="center">
      <AppHeader app={activeApp} />
      <Tabs
        defaultValue={tab}
        onChange={(value) => navigate(`/app/${activeApp.client_id}/${value}`)}
      >
        <Tabs.List grow justify="center">
          <Tabs.Tab value="quick">Quick Start</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          <Tabs.Tab value="credentials">Credentials</Tabs.Tab>
          <Tabs.Tab value="apis">APIs</Tabs.Tab>
          <Tabs.Tab value="connections">Connections</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="quick">
          <QuickStart app={activeApp} />
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <Settings app={activeApp} />
        </Tabs.Panel>
        <Tabs.Panel value="credentials">
          <CredentialsTab />
        </Tabs.Panel>
        <Tabs.Panel value="apis">apis</Tabs.Panel>
        <Tabs.Panel value="connections">
          <ApplicationConnections />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

function AppHeader({ app }) {
  return (
    <Group justify="space-around" align="center">
      <h3>Name: {app.client_name}</h3>
      <Group justify="space-around">
        <h4>{'Client ID'}</h4>
        <Code>{app.client_id}</Code>
      </Group>
    </Group>
  )
}
