import {
  Anchor,
  Group,
  Table,
  ThemeIcon,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import { IconDatabase } from '@tabler/icons-react'
import { useLoaderData } from 'react-router-dom'

export function Connections() {
  const colorScheme = useColorScheme()
  const { connections } = useLoaderData()
  console.log({ connections })
  const rows = connections.map((conn) => (
    <Table.Tr key={conn.name}>
      <Table.Td>
        <Group>
          <ThemeIcon variant={colorScheme.colorScheme} size={38}>
            <IconDatabase style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Anchor href={`/authn/db/${conn.id}`}>{conn.name}</Anchor>
        </Group>
      </Table.Td>
      <Table.Td>{conn.position}</Table.Td>
    </Table.Tr>
  ))

  return (
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
  )
}
