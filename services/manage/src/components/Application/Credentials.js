import {
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Skeleton,
  Stack,
  Text,
  TextInput,
  rem
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { updateApplication } from '../../api'
import { CopyButton } from '../CopyButton'

export const CredentialsTab = () => {
  const [opened, { open, close }] = useDisclosure(false)
  const [typedName, setTypedName] = useState('')
  const { activeApp } = useLoaderData()
  const [app, setApp] = useState(activeApp)
  const [dirty, setDirty] = useState(false)

  const [authmethod, setAuthmethod] = useState(
    activeApp.token_endpoint_auth_method
  )
  const [clientSecret, setClientSecret] = useState(app.client_secret)

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
      setDirty(false)
      setAuthmethod(app.token_endpoint_auth_method)
      setClientSecret(app.client_secret)
    }, 150)
  }, [app])

  const handleMethodChange = (method) => {
    setDirty(true)
    setAuthmethod(method)
  }

  const handleCancel = () => {
    setDirty(false)
    setAuthmethod(app.token_endpoint_auth_method)
  }

  const [loading, setLoading] = useState(false)
  const handleSubmit = () => {
    setLoading(true)
    updateApplication(app.client_id, {
      token_endpoint_auth_method: authmethod
    }).then((r) => {
      setApp(r.payload)
    })
  }

  const handleRotatesecret = () => {
    setLoading(true)
    updateApplication(app.client_id, {
      rotate_secret: true
    }).then((r) => {
      setApp(r.payload)
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
              <Skeleton visible={loading}>
                <Text fw={600} fz="sm">
                  Methods
                </Text>
                <Group m="xs" mb="xl" justify="space-around">
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
                      authmethod === 'client_secret_basic'
                        ? 'filled'
                        : 'outline'
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
                {clientSecret ? (
                  <Stack gap="xs">
                    <Text fz="xs">Client Secret</Text>
                    <Group grow align="center" justify="space-between">
                      <PasswordInput
                        m={'sm'}
                        value={clientSecret}
                        size="xs"
                        fz={'xs'}
                        radius={'sm'}
                        maw={rem(450)}
                        onChange={() => {}}
                      />
                      <CopyButton value={clientSecret} />
                    </Group>
                  </Stack>
                ) : (
                  <Paper h={84}>
                    <Alert color="yellow" title="Not Issued">
                      <Text fz="xs">
                        There is no client secret for this application.
                      </Text>
                    </Alert>
                  </Paper>
                )}
              </Skeleton>
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
                      <b>{app.client_name}</b> <br />
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
                        disabled={typedName !== app.client_name}
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
