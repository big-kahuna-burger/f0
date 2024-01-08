import { CodeHighlight } from '@mantine/code-highlight'
import {
  Alert,
  Button,
  Code,
  FileInput,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  rem
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconSparkles } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { updateApplication } from '../../api'
import { CopyButton } from '../CopyButton'

export const CredentialsTab = () => {
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
    if (method !== app.token_endpoint_auth_method) {
      setDirty(true)
    }
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
    <Paper
      shadow="md"
      mt="xs"
      withBorder
      p="sm"
      radius={'sm'}
      maw={1200}
      miw={330}
    >
      <Group justify="space-between" p="xs">
        <div style={{ minWidth: 50, maxWidth: 250 }}>
          <Text fw={600}>Authentication Methods</Text>
          <Text c="dimmed" fz={'sm'}>
            Configure the method to use when making requests to any endpoint
            that requires this client to authenticate.
          </Text>
        </div>
        <div>
          <Stack miw={150} maw={850}>
            <Skeleton visible={loading}>
              <Text fw={600} fz="sm" m="xs">
                Methods
              </Text>
              <Group>
                <Button
                  variant={
                    authmethod === 'private_key_jwt' ? 'filled' : 'outline'
                  }
                  size="sm"
                  disabled={loading}
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
                  onClick={() => handleMethodChange('none')}
                >
                  <Text fw={600} fz="xs">
                    None
                  </Text>
                </Button>
              </Group>
              {canRotateSecret(app) && (
                <Stack maw={480}>
                  <Group grow align="center" justify="space-between">
                    <PasswordInput
                      label="Client Secret"
                      m={'sm'}
                      value={clientSecret}
                      size="xs"
                      fz={'xs'}
                      radius={'sm'}
                      pt="md"
                      maw={rem(420)}
                      onChange={() => {}}
                    />
                    <CopyButton value={clientSecret} />
                  </Group>
                </Stack>
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
          {canRotateSecret(app) ? (
            <RotateSecret onRotate={handleRotatesecret} />
          ) : app.token_endpoint_auth_method === 'none' ? (
            <Paper h={84}>
              <Alert color="yellow" title="Not Issued">
                <Text fz="xs">
                  There is no client secret for this application.
                </Text>
              </Alert>
            </Paper>
          ) : (
            <></>
          )}
        </div>
      </Group>
      {app.token_endpoint_auth_method === 'private_key_jwt' && (
        <PrivateKeyJWTCredentials
          clientId={app.client_id}
          credentials={app.jwks?.keys}
        />
      )}
    </Paper>
  )
}

function canRotateSecret(app) {
  return ['client_secret_basic', 'client_secret_post'].includes(
    app.token_endpoint_auth_method
  )
}

function RotateSecret(props) {
  const { activeApp } = useLoaderData()
  const clientName = activeApp.client_name
  const [opened, { open, close }] = useDisclosure(false)
  const [typedName, setTypedName] = useState('')

  const handleRotate = () => {
    props?.onRotate()
  }

  return (
    <>
      <h4 style={{ marginLeft: 18 }}>Danger Zone</h4>
      <Stack m={'md'} maw={520}>
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
                    This action cannot be undone. It will permanently rotate the
                    Client Secret for the application <b>{clientName}</b> <br />
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
                      disabled={typedName !== clientName}
                      onClick={() => {
                        setTypedName('')
                        handleRotate()
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
    </>
  )
}

function PrivateKeyJWTCredentials({ credentials, clientId } = {}) {
  const [opened, { open, close }] = useDisclosure(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [fileResult, setFileResult] = useState()
  const [filename, setFilename] = useState()
  const [nameValue, setNameValue] = useState()
  const [modulus, setModulus] = useState()
  const [cryptoKey, setCryptoKey] = useState()
  const [algOptions, setAlgOptions] = useState([])
  const [kty, setKty] = useState()
  useEffect(() => {
    if (!cryptoKey) return

    setModulus(cryptoKey.algorithm.modulusLength)
  }, [cryptoKey])
  useEffect(() => {
    if (kty === 'RSA') {
      switch (modulus) {
        case 2048:
          setAlgOptions(['RS256', 'PS256'])
          break
        case 3072:
          setAlgOptions(['RS256', 'RS384', 'PS256', 'PS384'])
          break
        case 4096:
          setAlgOptions(['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'])
          break
      }
    }
  }, [modulus, kty])

  const handleCredentialInput = (file) => {
    if (!file) return
    setFilename(file.name)
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      const result = event.target.result.split(',')[1]
      setFileResult(result)
      const resultText = atob(result)
    })
    reader.readAsDataURL(file)
  }

  const saveAKey = () => {
    setLoading(true)
    updateApplication(clientId, {
      private_key_jwt_credentials: {
        name: nameValue,
        key: fileResult,
        expires_at: new Date().toISOString(),
        alg: 'RS256' // TODO: respect selection e2e
      }
    })
      .then((r) => {
        console.log(r.payload)
        setLoading(false)
      })
      .finally(close)
  }

  return (
    <Paper p="md" shadow={'xl'}>
      <Modal
        opened={opened}
        onClose={close}
        size={'lg'}
        title="Add New Credential"
      >
        <Paper p="md">
          <TextInput
            label="Name"
            radius={'sm'}
            placeholder="Enter a name for this credential"
            description="Optionally set a name for this credential"
            inputWrapperOrder={['label', 'input', 'description']}
            rightSection={
              <IconSparkles
                style={{ width: rem(16), height: rem(16) }}
                stroke={3}
                onClick={() =>
                  setNameValue(`${filename} ${new Date().toDateString()}`)
                }
              />
            }
            defaultValue={nameValue}
          />
          <Group m="sm" justify="space-around">
            <FileInput
              size="xs"
              maw={250}
              type="reset"
              leftSection={
                <IconPlus
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={3}
                />
              }
              placeholder="Upload RSA Public Key (pem), x509 cert (pem), JWK (jwk)"
              onChange={handleCredentialInput}
              accept=".pem, .pub, .key, .txt, .x509, .crt, .jwk, .jwks"
            />
          </Group>
          {fileResult && (
            <Paper>
              <Stack>
                <Text fz="xs">Credential Preview</Text>
                <CodeHighlight
                  fz={'xs'}
                  fw={100}
                  code={atob(fileResult)}
                  maw={700}
                  language={''}
                  withCopyButton={false}
                />
              </Stack>
              <Group>
                <Paper>
                  <Text fz="xs">
                    Credential Details <br />
                    Key Modulus: {modulus}
                  </Text>
                </Paper>
                <Select
                  data={algOptions.map((opt) => ({ value: opt, label: opt }))}
                  placeholder="Select Algorithm"
                  label="Algorithm"
                  radius={'sm'}
                  defaultValue={'RS256'}
                />
                <DateInput label={'Set Expiry'} />
                <Button mt="lg" onClick={saveAKey}>
                  Submit
                </Button>
              </Group>
            </Paper>
          )}
        </Paper>
      </Modal>
      <Group justify="space-between">
        <div />
        <Button
          leftSection={
            <IconPlus
              style={{ width: rem(12), height: rem(12) }}
              stroke={1.5}
            />
          }
          radius={'xs'}
          mb="sm"
          variant="outline"
          size={'compact-sm'}
          color={'blue.3'}
          onClick={open}
        >
          Add Credential
        </Button>
      </Group>
      {credentials && <CredentialsTable jwks={credentials} />}
    </Paper>
  )
}

function CredentialsTable({ jwks }) {
  const { activeApp } = useLoaderData()
  const jwkImported = activeApp.jwkImported
  const algOpts = {
    256: ['RS256', 'PS256'],
    384: ['RS256', 'RS384', 'PS256', 'PS384'],
    512: ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512']
  }
  const [kidAlgo, setkidAlgo] = useState({})
  const [dirtyKeys, setDirtyKeys] = useState([])
  const handleChange = (kid, data) => {
    setkidAlgo({ ...kidAlgo, [kid]: data })
    setDirtyKeys([...dirtyKeys, kid])
  }

  const saveJwk = (kid) => {
    console.log('save', kid, kidAlgo[kid])
    updateApplication(activeApp.client_id, {
      private_key_jwt_credentials: {
        change: {
          kid,
          alg: kidAlgo[kid]
        }
      }
    })
  }

  const rows = jwks.map(({ kid, kty, alg, crv, exp, ...jwk }, i) => {
    const mod = jwkImported?.[i]
      ? jwkImported[i]?.algorithm?.modulusLength
      : undefined

    let opts

    if (crv?.startsWith('P-')) {
      const es = {
        'P-256': 'ES256',
        'P-384': 'ES384',
        'P-521': 'ES512'
      }[crv]
      opts = [es]
    } else if (mod) {
      opts = algOpts[mod / 8]
    }

    return (
      <Table.Tr key={`key-${i}`}>
        <Table.Td>
          <pre fz="xs" c="dimmed" maw={150}>
            {`${kid?.slice(0, 16) || ''}...`}
          </pre>
        </Table.Td>
        <Table.Td>{mod}</Table.Td>
        <Table.Td>{kty}</Table.Td>
        <Table.Td>
          {opts ? (
            <Select
              maw={120}
              miw={78}
              size="xs"
              value={kidAlgo[kid] || alg}
              disabled={kty !== 'RSA'}
              data={opts.map((o) => ({
                value: o,
                label: o
              }))}
              onChange={(data) => handleChange(kid, data)}
            />
          ) : (
            <Select
              maw={120}
              miw={78}
              size="xs"
              value={alg}
              disabled
              data={[
                {
                  value: alg,
                  label: alg
                }
              ]}
            />
          )}
        </Table.Td>
        <Table.Td>{crv}</Table.Td>
        <Table.Td>{exp}</Table.Td>
        <Table.Td>
          <Group
            classNames={{
              root: {
                '--group-align': 'flex-end'
              }
            }}
            align="flex-end"
            justify="flex-end"
            miw={220}
            maw={220}
            gap="sm"
          >
            {dirtyKeys.includes(kid) ? (
              <>
                <Button
                  radius="xs"
                  size="compact-xs"
                  variant="outline"
                  color={'blue.3'}
                  onClick={() => saveJwk(kid)}
                >
                  Save
                </Button>
                <Button
                  radius="xs"
                  size="compact-xs"
                  variant="outline"
                  color={'gray.3'}
                >
                  Cancel
                </Button>
                <Button
                  radius="xs"
                  size="compact-xs"
                  variant="outline"
                  color={'red.3'}
                >
                  Revoke
                </Button>
              </>
            ) : (
              <>
                <div style={{ minWidth: 140 }} />
                <Button
                  radius="xs"
                  size="compact-xs"
                  variant="outline"
                  color={'red.3'}
                >
                  Revoke
                </Button>
              </>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  })
  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>kid</Table.Th>
          <Table.Th>mod</Table.Th>
          <Table.Th>kty</Table.Th>
          <Table.Th>alg</Table.Th>
          <Table.Th>crv?</Table.Th>
          <Table.Th>{}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  )
}
