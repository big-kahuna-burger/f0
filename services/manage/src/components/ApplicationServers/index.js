import {
  Anchor,
  Badge,
  Group,
  Table,
  Text,
  ThemeIcon,
  rem,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'

import { IconServer2 } from '@tabler/icons-react'

import { Suspense } from 'react'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from 'react-oauth2-code-pkce'
import { Await } from 'react-router-dom'
import { getResourceServers } from '../../api'
import classes from './AppServers.module.css'

export function AppServers() {
  const { token } = useContext(AuthContext)
  const colorScheme = useMantineColorScheme()
  const theme = useMantineTheme()
  const [apis, setApis] = useState([])

  useEffect(() => {
    if (token && !apis.length && !apis.then) {
      console.log('app servers')
      const pm = getResourceServers(token).then((apis) => setApis(apis))
      setApis(pm)
    }
  }, [apis, token])

  return (
    <Suspense fallback={<p>Loading APIS...</p>}>
      <Await resolve={apis} errorElement={<p>Error loading APIs!</p>}>
        {() => (
          <Table.ScrollContainer>
            <Table verticalSpacing="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>API</Table.Th>
                  <Table.Th>Identifier</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {apis.map((item, i) => (
                  <Table.Tr className={classes['api-row']} key={item.name} bg={item.readonly ? '#e6e6e6' : undefined}>
                    <Table.Td>
                      <Group gap="lg">
                        <ThemeIcon
                          variant={colorScheme.colorScheme}
                          size={38}
                          color={theme.colors.myAltColor[3]}
                        >
                          <IconServer2 style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        <Text fz="sm" fw={500}>
                          {item.name}
                        </Text>
                        {item.readonly && <Badge variant="light">readonly</Badge>}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="lg">
                        <Anchor component="button">{item.identifier}</Anchor>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Await>
    </Suspense>
  )
}
