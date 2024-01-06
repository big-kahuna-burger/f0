import {
  Alert,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  rem
} from '@mantine/core'
import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { updateApplication } from '../../api'
import { CopyButton } from '../CopyButton'

export const CredentialsTab = () => {
  const { activeApp } = useLoaderData()
  const [dirty, setDirty] = useState(false)

  const [authmethod, setAuthmethod] = useState(
    activeApp.token_endpoint_auth_method
  )
  const handleMethodChange = (method) => {
    setDirty(true)
    setAuthmethod(method)
  }
  const handleCancel = () => {
    setDirty(false)
    setAuthmethod(activeApp.token_endpoint_auth_method)
  }
  const [loading, setLoading] = useState(false)
  const handleSubmit = () => {
    setLoading(true)
    updateApplication(activeApp.client_id, {
      token_endpoint_auth_method: authmethod
    }).finally(() => {
      setTimeout(() => {
        setLoading(false)
        setDirty(false)
      }, 220)
    })
  }
  return (
    <>
      <Paper
        shadow="md"
        withBorder
        p="sm"
        m={'md'}
        radius={'sm'}
        maw={1000}
        miw={330}
      >
        <Group justify="space-between" p="xs">
          <div style={{ minWidth: 150, maxWidth: 250 }}>
            <Text fw={600}>Authentication Methods</Text>
            <Text c="dimmed" fz={'sm'}>
              Configure the method to use when making requests to any endpoint
              that requires this client to authenticate.
            </Text>
          </div>
          <div style={{ justifyItems: 'flex-end' }}>
            <Stack maw={520}>
              <Text fw={600} fz="sm">
                Methods
              </Text>
              <Group m="xs" justify="space-around">
                <Button
                  variant={
                    authmethod === 'private_key_jwt' ? 'filled' : 'outline'
                  }
                  size="sm"
                  disabled={loading}
                  miw={220}
                  onClick={() => handleMethodChange('private_key_jwt')}
                >
                  <Text fw={600} fz="xs">
                    Private Key JWT
                  </Text>
                </Button>
                <Button
                  size="sm"
                  variant={
                    authmethod === 'client_secret_post' ? 'filled' : 'outline'
                  }
                  disabled={loading}
                  miw={220}
                  onClick={() => handleMethodChange('client_secret_post')}
                >
                  <Text fw={600} fz="xs">
                    Client Secret (Post)
                  </Text>
                </Button>
                <Button
                  size="sm"
                  variant={
                    authmethod === 'client_secret_basic' ? 'filled' : 'outline'
                  }
                  disabled={loading}
                  miw={220}
                  onClick={() => handleMethodChange('client_secret_basic')}
                >
                  <Text fw={600} fz="xs">
                    Client Secret (Basic)
                  </Text>
                </Button>
                <Button
                  size="sm"
                  variant={authmethod === 'none' ? 'filled' : 'outline'}
                  disabled={loading}
                  miw={220}
                  onClick={() => handleMethodChange('none')}
                >
                  <Text fw={600} fz="xs">
                    None
                  </Text>
                </Button>
              </Group>
              {activeApp.client_secret && (
                <Stack>
                  <Text>Client Secret</Text>
                  <Group grow align="center" justify="space-between">
                    <PasswordInput
                      m={'sm'}
                      value={activeApp.client_secret}
                      size="sm"
                      radius={'sm'}
                      maw={rem(420)}
                      onChange={() => {}}
                    />
                    <CopyButton value={activeApp.client_secret} />
                  </Group>
                </Stack>
              )}
              <Group m="xs">
                <Button
                  radius={'xs'}
                  loading={loading}
                  type="submit"
                  disabled={!dirty}
                  onClick={() => handleSubmit()}
                >
                  Save
                </Button>
                <Button
                  radius={'xs'}
                  loading={loading}
                  type={'reset'}
                  variant="outline"
                  disabled={!dirty}
                  onClick={() => {
                    handleCancel()
                  }}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </div>
        </Group>
      </Paper>
      <h4 style={{ marginLeft: 25 }}>Danger Zone</h4>
      <Stack m={'md'} maw={1000}>
        <Alert title="Rotate Secret" color="red.3">
          <Group justify="space-between" align="center">
            <Text c="dimmed" fz="sm">
              All authorized apps will need to be updated with the new client
              secret.
            </Text>
            <Button bg="red.7" m="md" radius={'sm'}>
              Rotate
            </Button>
          </Group>
        </Alert>
      </Stack>
    </>
  )
}
