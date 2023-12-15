import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Text,
  rem,
  useMantineTheme
} from '@mantine/core'
import {
  IconChevronRight,
  IconDots,
  IconHeart,
  IconLogout,
  IconMessage,
  IconPlayerPause,
  IconPower,
  IconSettings,
  IconStar,
  IconSwitchHorizontal,
  IconTrash
} from '@tabler/icons-react'
import { useContext } from 'react'
import { AuthContext } from 'react-oauth2-code-pkce'
export function UserMenu(props) {
  const { token, idToken, login, logOut } = useContext(AuthContext)
  const theme = useMantineTheme()

  return (
    <Group justify="center">
      {token && (
        <Menu
          withArrow
          width={300}
          position="bottom"
          transitionProps={{ transition: 'pop' }}
          withinPortal
        >
          <Menu.Target>
            <ActionIcon variant="default">
              <IconDots
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              rightSection={
                <IconChevronRight
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                />
              }
            >
              <Group>
                <Avatar
                  radius="xl"
                  src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png"
                />

                <div>
                  <Text fw={500}>Nancy Eggshacker</Text>
                  <Text size="xs" c="dimmed">
                    neggshaker@mantine.dev
                  </Text>
                </div>
              </Group>
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              leftSection={
                <IconHeart
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                  color={theme.colors.red[6]}
                />
              }
            >
              Liked posts
            </Menu.Item>
            <Menu.Item
              leftSection={
                <IconStar
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                  color={theme.colors.yellow[6]}
                />
              }
            >
              Saved posts
            </Menu.Item>
            <Menu.Item
              leftSection={
                <IconMessage
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                  color={theme.colors.blue[6]}
                />
              }
            >
              Your comments
            </Menu.Item>

            <Menu.Label>Settings</Menu.Label>
            <Menu.Item
              leftSection={
                <IconSettings
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                />
              }
            >
              Account settings
            </Menu.Item>
            <Menu.Item
              leftSection={
                <IconSwitchHorizontal
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                />
              }
            >
              Change account
            </Menu.Item>
            <Menu.Item
              onClick={() => logOut()}
              leftSection={
                <IconLogout
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                />
              }
            >
              Logout
            </Menu.Item>

            <Menu.Divider />

            <Menu.Label>Danger zone</Menu.Label>
            <Menu.Item
              leftSection={
                <IconPlayerPause
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                />
              }
            >
              Pause subscription
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={
                <IconTrash
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.5}
                />
              }
            >
              Delete account
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
      <Menu>
        {!token && (
          <Menu.Item
            onClick={() => login()}
            leftSection={
              <IconPower
                style={{ width: rem(20), height: rem(20) }}
                stroke={1.5}
                color={theme.colors.myAltColor[5]}
              />
            }
          >
            Login
          </Menu.Item>
        )}
      </Menu>
    </Group>
  )
}
