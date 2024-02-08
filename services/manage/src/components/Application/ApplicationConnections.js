import {
  Anchor,
  Divider,
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
import { IconBrandGoogle, IconDatabase } from '@tabler/icons-react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { enableDisableConnection } from '../../api'

const ApplicationConnections = () => {
  const isMobile = useMediaQuery('(max-width: 850px)')
  const { connections = [], socialConnections = [] } = useLoaderData()
  const rows = renderRows(connections)
  const socialRows = renderRows(socialConnections)

  return (
    <>
      <Paper
        mt="xs"
        shadow="md"
        withBorder
        p="sm"
        radius={'sm'}
        maw={1000}
        miw={330}
      >
        <Text> DB Connections </Text>
        <Stack miw={150} maw={806} w={isMobile ? undefined : 806}>
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
        </Stack>
        <Divider my="sm" />
        <Text> Social Connections </Text>

        <Stack miw={150} maw={806} w={isMobile ? undefined : 806}>
          <Table.ScrollContainer>
            <Table verticalSpacing="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Connection Name</Table.Th>
                  <Table.Th>Enabled</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{socialRows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      </Paper>
    </>
  )
}

const renderRows = (connections) => {
  const { activeApp } = useLoaderData()
  return connections.map((x) => {
    const enabled = activeApp.connections.some((c) => c.id === x.id)
    const Icon = x.strategy === 'GOOGLE' ? IconBrandGoogle : IconDatabase
    const ctype = x.type.toLowerCase()
    return (
      <Table.Tr key={x.id}>
        <Table.Td>
          <Group>
            <ThemeIcon variant={enabled ? 'filled' : 'outline'} size={38}>
              <Icon style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            <Anchor href={`/authn/${ctype}/${x.id}`}>{x.name}</Anchor>
          </Group>
        </Table.Td>
        <Table.Td justify="center">
          <EnabledCell
            connectionId={x.id}
            clientId={activeApp.client_id}
            enabled={enabled}
          />
        </Table.Td>
      </Table.Tr>
    )
  })
}

const EnabledCell = ({ connectionId, clientId, enabled }) => {
  const navigate = useNavigate()
  const { activeApp } = useLoaderData()
  const readonly = activeApp.connections.find(
    (c) => c.id === connectionId
  )?.readonly

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
