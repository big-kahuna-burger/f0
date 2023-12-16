import {
  Anchor,
  Avatar,
  Group,
  Table,
  Text,
  useMantineTheme
} from '@mantine/core'
import { Suspense } from 'react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { AuthContext } from 'react-oauth2-code-pkce'
import { Await } from 'react-router-dom'
import { SelectedUserContext } from '../../SelectedUser.context'
import { getUsers } from '../../api'
import classes from './UserTable.module.css'
export function UsersTable() {
  const { token } = useContext(AuthContext)
  const theme = useMantineTheme()
  const selectedUserContext = useContext(SelectedUserContext)
  const [users, setUsers] = useState([])
  useEffect(() => {
    if (token && !users.length && !users.then) {
      const pm = getUsers(token).then((users) => setUsers(users))
      setUsers(pm)
    }
  }, [users, token])

  const [selectedUser, setSelectedUser] = useState({})
  useEffect(() => {
    if (!selectedUser.name && users.length) {
      setSelectedUser(users[0])
    }
  }, [users, selectedUser])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (users.length) {
      setSelectedUser(users[activeIndex])
      selectedUserContext.setUser(users[activeIndex])
    }
  }, [users, activeIndex, selectedUserContext])

  const handleSelection = useCallback(
    (event) => {
      const { key } = event
      const arrowUpPressed = key === 'ArrowUp'
      const arrowDownPressed = key === 'ArrowDown'
      const searchDataLength = users.length - 1
      if (arrowUpPressed) {
        event.preventDefault()
        setActiveIndex((currentIndex) =>
          currentIndex - 1 >= 0 ? currentIndex - 1 : searchDataLength
        )
      } else if (arrowDownPressed) {
        event.preventDefault()
        setActiveIndex((currentIndex) =>
          currentIndex + 1 <= searchDataLength ? currentIndex + 1 : 0
        )
      }
    },
    [users]
  )
  useEffect(() => {
    document.addEventListener('keydown', handleSelection)
    return () => {
      document.removeEventListener('keydown', handleSelection)
    }
  }, [handleSelection])
  const clickRow = (item, i) => {
    setActiveIndex(i)
  }
  return (
    <Suspense fallback={<p>Loading Users...</p>}>
      <Await resolve={users} errorElement={<p>Error loading Users!</p>}>
        {() => (
          <Table.ScrollContainer>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((item, i) => (
                  <Table.Tr
                    className={classes['user-row']}
                    key={item.id}
                    c={
                      item.name === selectedUser.name
                        ? theme.colors.myAltColor[6]
                        : undefined
                    }
                    onClick={() => clickRow(item, i)}
                  >
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size={30} src={item.picture} radius={30} />
                        <Text fz="sm" fw={500}>
                          {item.name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Anchor component="button" size="sm">
                        {item.email}
                      </Anchor>
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
