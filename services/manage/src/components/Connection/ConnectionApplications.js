import {
  Anchor,
  Group,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  ThemeIcon,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconDatabase } from '@tabler/icons-react'
import { IconCheck, IconX } from '@tabler/icons-react'
import {
  IconBrandReact,
  IconDeviceMobile,
  IconExchange,
  IconServer2,
  IconServerCog
} from '@tabler/icons-react'
import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { enableDisableConnection } from '../../api'

const getAppIcon = (item) =>
  ({
    native: IconDeviceMobile,
    spa: IconBrandReact,
    web: IconServerCog,
    m2m: IconExchange
  })[item['urn:f0:type']] || IconServer2

const ConnectionApplications = () => {
  const isMobile = useMediaQuery('(max-width: 850px)')
  const theme = useMantineTheme()
  const {
    connection,
    applications: { apps = [], total: appsTotal } = {}
  } = useLoaderData()
  const enabledApps = connection.ClientConnection.map((cc) => cc.clientId)
  const rows = apps.map((x) => {
    const enabled = enabledApps.includes(x.client_id)
    const AppIcon = getAppIcon(x)
    return (
      <Table.Tr key={x.client_id}>
        <Table.Td>
          <Group>
            <ThemeIcon
              variant={'outline'}
              size={38}
              c={theme.colors.myColor[5]}
            >
              <AppIcon style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            <div>
              <Anchor href={`/app/${x.client_id}/settings`}>
                {x.client_name}
              </Anchor>
              <Text size="xs" c={'dimmed'}>
                {x.client_id}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
          <div style={{ flexBasis: '100%' }}>{}</div>
        </Table.Td>
        <Table.Td justify="center">
          <EnabledCell
            connectionId={connection.id}
            clientId={x.client_id}
            enabled={enabled}
          />
        </Table.Td>
      </Table.Tr>
    )
  })
  return (
    <Paper
      mt="xs"
      shadow="md"
      withBorder
      p="sm"
      radius={'sm'}
      maw={1000}
      miw={330}
    >
      <Stack miw={150} maw={806} w={isMobile ? undefined : 806}>
        <Table.ScrollContainer>
          <Table verticalSpacing="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Application</Table.Th>
                <Table.Th>-</Table.Th>
                <Table.Th>Enabled</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  )
}

const EnabledCell = ({ connectionId, clientId, enabled }) => {
  const handleEnableDisable = async (e) => {
    await enableDisableConnection(clientId, connectionId, !e)
    setEnabledState(e)
  }
  const [enabledState, setEnabledState] = useState(enabled)
  return (
    <SwitchNice
      onChange={handleEnableDisable}
      checked={enabledState}
      readonly={false}
    />
  )
}

export { ConnectionApplications }

function SwitchNice({ checked, onChange, readonly = false }) {
  const theme = useMantineTheme()
  return (
    <Switch
      disabled={readonly}
      checked={checked}
      onChange={(e) => {
        onChange(e.target.checked)
      }}
      color="teal"
      size="md"
      thumbIcon={
        checked ? (
          <IconCheck
            style={{ width: rem(12), height: rem(12) }}
            color={theme.colors.teal[6]}
            stroke={3}
          />
        ) : (
          <IconX
            style={{ width: rem(12), height: rem(12) }}
            color={theme.colors.red[6]}
            stroke={3}
          />
        )
      }
    />
  )
}
