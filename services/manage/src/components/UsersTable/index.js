import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Group,
  Table,
  Text,
  rem,
  useMantineTheme
} from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { Suspense } from 'react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Await } from 'react-router-dom'
import { SelectedUserContext } from '../../SelectedUser.context'
import { getUsers } from '../../api'
import classes from './UserTable.module.css'
const jobColors = {
  engineer: 'blue',
  manager: 'cyan',
  designer: 'pink'
}

export function UsersTable() {
  const theme = useMantineTheme()
  const selectedUserContext = useContext(SelectedUserContext)
  const [users, setUsers] = useState([])
  useEffect(() => {
    if (!users.length && !users.then) {
      const pm = getUsers().then((users) => setUsers(users))
      setUsers(pm)
    }
  }, [users])

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
  const clickRow = (item) => {
    setSelectedUser(item)
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
                {users.map((item) => (
                  <Table.Tr
                    className={classes['user-row']}
                    key={item.name}
                    c={
                      item.name === selectedUser.name
                        ? theme.colors.myAltColor[6]
                        : undefined
                    }
                    onClick={() => clickRow(item)}
                  >
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size={30} src={item.avatar} radius={30} />
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
                    <Table.Td>
                      <Group gap={0} justify="flex-end">
                        {/* <ActionIcon variant="subtle" color="gray">
                          <IconPencil
                            style={{ width: rem(16), height: rem(16) }}
                            stroke={1.5}
                          />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red">
                          <IconTrash
                            style={{ width: rem(16), height: rem(16) }}
                            stroke={1.5}
                          />
                        </ActionIcon> */}
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
