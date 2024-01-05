import {
  Anchor,
  Group,
  Switch,
  Table,
  ThemeIcon,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { IconDatabase } from '@tabler/icons-react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { enableDisableConnection } from '../../api'

const ApplicationConnections = () => {
  const colorScheme = useColorScheme()
  const { activeApp, connections = [] } = useLoaderData()
  const rows = connections.map((x) => {
    return (
      <Table.Tr key={x.id}>
        <Table.Td>
          <Group>
            <ThemeIcon variant={colorScheme.colorScheme} size={38}>
              <IconDatabase style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            <Anchor href={`/authn/db/${x.id}`}>{x.name}</Anchor>
          </Group>
        </Table.Td>
        <Table.Td justify="center">
          <EnabledCell
            connectionId={x.id}
            clientId={activeApp.client_id}
            enabled={activeApp.connections.some((c) => c.id === x.id)}
          />
        </Table.Td>
      </Table.Tr>
    )
  })
  return (
    <Table.ScrollContainer>
      <Table verticalSpacing="lg">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Connection Name</Table.Th>
            <Table.Th>Enabled</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

const EnabledCell = ({ connectionId, clientId, enabled }) => {
  const navigate = useNavigate()
  const { activeApp } = useLoaderData()
  const readonly = activeApp.connections.find((c) => c.id === x.id)?.readonly
  const handleEnableDisable = (e) => {
    enableDisableConnection(clientId, connectionId, !e).then(() => {
      navigate(`/app/${clientId}/connections`)
    })
  }
  return (
    <SwitchNice
      onChange={(e) => handleEnableDisable(e)}
      checked={enabled}
      readonly={readonly}
    />
  )
}

export { ApplicationConnections }

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
