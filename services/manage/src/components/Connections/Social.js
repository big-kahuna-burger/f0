import { Anchor, Group, Table, ThemeIcon, rem } from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { IconDatabase } from '@tabler/icons-react'
import { useLoaderData } from 'react-router-dom'

export function SocialConnections() {
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
    <>
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
    </>
  )
}
