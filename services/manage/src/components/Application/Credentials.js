import {
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  rem
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { updateApplication } from '../../api'
import { CopyButton } from '../CopyButton'

export const CredentialsTab = () => {
  const [opened, { open, close }] = useDisclosure(false)
  const [typedName, setTypedName] = useState('')
  const { activeApp } = useLoaderData()
  const [dirty, setDirty] = useState(false)

  const [authmethod, setAuthmethod] = useState(
    activeApp.token_endpoint_auth_method
  )
  const [clientSecret, setClientSecret] = useState(activeApp.client_secret)
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
    }).then((r) => {
      setTimeout(() => {
        setAuthmethod(r.payload.token_endpoint_auth_method)
        setLoading(false)
        setDirty(false)
      }, 180)
    })
  }

  const handleRotatesecret = () => {
    setLoading(true)
    updateApplication(activeApp.client_id, {
      rotate_secret: true
    }).then((r) => {
      setTimeout(() => {
        setLoading(false)
        setClientSecret(r.payload.client_secret)
        if (activeApp.token_endpoint_auth_method === authmethod) {
          setDirty(false)
        }
      }, 400)
    })
  }
  return (
    <>
      <Paper
        shadow="md"
        mt="xs"
        withBorder
        p="sm"
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
          <div>
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
                  radius={'sm'}
                  onClick={() => handleMethodChange('private_key_jwt')}
                >
                  <Text fw={600} fz="xs">
                    Private Key JWT
                  </Text>
                </Button>
                <Button
                  size="sm"
                  radius={'sm'}
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
                  radius={'sm'}
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
                  radius={'sm'}
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
              {clientSecret && (
                <Stack>
                  <Text>Client Secret</Text>
                  <Group grow align="center" justify="space-between">
                    <PasswordInput
                      m={'sm'}
                      value={clientSecret}
                      size="sm"
                      radius={'sm'}
                      maw={rem(420)}
                      onChange={() => {}}
                    />
                    <CopyButton value={clientSecret} />
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
        <h4 style={{ marginLeft: 25 }}>Danger Zone</h4>
        <Stack m={'md'} maw={1000}>
          <Alert title="Rotate Secret" color="red.3">
            <Group justify="space-between" align="center">
              <Text c="dimmed" fz="sm">
                All authorized apps will need to be updated with the new client
                secret.
              </Text>
              <Modal
                opened={opened}
                onClose={close}
                title="Confirm Secret Rotation?"
                centered
              >
                <Paper>
                  <Stack p="xs">
                    <Text fz="sm">
                      This action cannot be undone. It will permanently rotate
                      the Client Secret for the application{' '}
                      <b>{activeApp.client_name}</b> <br />
                      Please type in the name of the application to confirm.
                    </Text>
                    <TextInput
                      autoFocus={true}
                      label="Name"
                      withAsterisk
                      value={typedName}
                      onChange={(e) => setTypedName(e.currentTarget.value)}
                    />
                    <Group justify="flex-end">
                      <Button onClick={close} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        disabled={typedName !== activeApp.client_name}
                        onClick={() => {
                          setTypedName('')
                          handleRotatesecret()
                          close()
                        }}
                      >
                        Rotate
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              </Modal>

              <Button bg="red.7" radius={'sm'} onClick={open}>
                Rotate
              </Button>
            </Group>
          </Alert>
        </Stack>
      </Paper>
    </>
  )
}
