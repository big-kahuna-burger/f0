import {
  Anchor,
  Button,
  Group,
  Table,
  ThemeIcon,
  rem,
  Text,
  Paper
} from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { IconDatabase } from '@tabler/icons-react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { IconPlus } from '@tabler/icons-react'

export function SocialConnections() {
  const navigate = useNavigate()
  const colorScheme = useColorScheme()
  const { connections } = useLoaderData()
  const rows = connections.map((conn) => (
    <Table.Tr key={conn.id}>
      <Table.Td>
        <Group>
          <ThemeIcon variant={colorScheme.colorScheme} size={38}>
            <IconDatabase style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Anchor href={`/authn/social/${conn.strategy.toLowerCase()}`}>
            {conn.name}
          </Anchor>
        </Group>
      </Table.Td>
      <Table.Td>{conn.position}</Table.Td>
    </Table.Tr>
  ))

  return (
    <Paper p="md">
      <Group justify="space-between" align="center">
        <Text mb="lg">Social Connections</Text>{' '}
        <Button
          leftSection={
            <IconPlus
              style={{
                width: rem(18),
                height: rem(18)
              }}
              stroke={1.5}
            />
          }
          radius={'xl'}
          onClick={() => {
            navigate('/authn/social/new')
          }}
        >
          Configure New Connection
        </Button>
      </Group>

      <Table
        striped
        highlightOnHover
        verticalSpacing={'lg'}
        horizontalSpacing={'xl'}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Connection</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  )
}
