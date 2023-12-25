import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Button,
  Code,
  CopyButton,
  Divider,
  Group,
  Paper,
  Space,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Tooltip,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useForm } from '@mantine/form'

import {
  IconCheck,
  IconCheckbox,
  IconCopy,
  IconDeviceDesktop,
  IconForbid,
  IconInfoCircle,
  IconTrash
} from '@tabler/icons-react'
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import { useEffect, useMemo, useState } from 'react'
import classes from './AppServer.module.css'

import { useColorScheme } from '@mantine/hooks'
import {
  createGrant,
  deleteGrantById,
  updateApi,
  updateGrantById,
  updateResourceServerScopes
} from '../../api'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export function AppServer() {
  const query = useQuery()
  const fromQuery = query.get('tab')
  const activeTab = ['quick', 'permissions', 'grants', 'settings'].includes(
    fromQuery
  )
    ? fromQuery
    : 'quick'
  const { activeApi, grants, applications } = useLoaderData()
  const [searchParams, setSearchParams] = useSearchParams()
  return (
    <>
      <Tabs
        defaultValue={activeTab}
        onChange={(value) => {
          setSearchParams({ tab: value })
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="quick">Quick Start</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
          <Tabs.Tab value="grants">Grants</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="quick">
          <ApiHeader api={activeApi} />
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <ApiHeader api={activeApi} />
          <Settings api={activeApi} />
        </Tabs.Panel>
        <Tabs.Panel value="permissions">
          <Permissions
            name={activeApi.name}
            scopes={activeApi.scopes}
            isReadonly={activeApi.readonly}
            api={activeApi}
          />
        </Tabs.Panel>
        <Tabs.Panel value="grants">
          <GrantsPanel
            api={activeApi}
            grants={grants}
            applications={applications}
          />
        </Tabs.Panel>
      </Tabs>
    </>
  )
}

const Permissions = ({ api }) => {
  const icon = <IconInfoCircle />
  return (
    <Stack w="100%" h="100%" bg="var(--mantine-color-body)">
      <ApiHeader api={api} />

      <Text fw={500} mt="sm">
        Scopes are permissions that can be requested by applications to access
        APIs.
      </Text>
      <AddAScope available={!api.readonly} api={api} />
      {api.scopes.length ? (
        <Scopes items={api.scopes} isReadonly={api.readonly} />
      ) : (
        <Alert variant="light" color="blue" title="No Scopes" icon={icon}>
          No scopes are defined for this API
        </Alert>
      )}
    </Stack>
  )
}

const Scopes = ({ items = [], isReadonly }) => {
  return (
    <>
      <h3>List of Permissions</h3>
      <Demo elements={items} isReadonly={isReadonly} />
    </>
  )
}

function Demo({ elements, isReadonly = false }) {
  const rows = elements.map((element) => (
    <Table.Tr key={element}>
      <Table.Td>
        <Code>{element}</Code>
      </Table.Td>
      <Table.Td>{scopeDescription(element)}</Table.Td>
      {!isReadonly && (
        <Table.Td>
          {
            <IconTrash
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
              color="red"
            />
          }
        </Table.Td>
      )}
    </Table.Tr>
  ))

  return (
    <Table.ScrollContainer>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Scope Value</Table.Th>
            <Table.Th>Scope Description (as shown on consent UI)</Table.Th>
            <Table.Th>-</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

function scopeDescription(element) {
  return {}[element] || 'No description'
}

function AddAScope({ available, api }) {
  const icon = <IconInfoCircle />
  return (
    <Stack>
      <h3>Add a Permission</h3>
      {!available ? (
        <Alert variant="light" color="yellow" title="Not Available" icon={icon}>
          Scope management is not available for this API since this is a
          management API built-in definition already, you would need to change
          source code for this.
        </Alert>
      ) : (
        <AddAPermissionForm api={api} />
      )}
    </Stack>
  )
}

const AddAPermissionForm = ({ api }) => {
  const navigate = useNavigate()
  const form = useForm({
    initialValues: {
      value: '',
      description: ''
    },

    validate: {
      value: (value) =>
        value.length >= 2
          ? !api.scopes.includes(value)
            ? null
            : 'Should be a new scope value. This one exists.'
          : 'Invalid value. Must be at least 2 chars at least.'
    }
  })

  const handleScopeAdded = (e) => {
    e.preventDefault()

    if (form.validate().hasErrors) {
      return
    }

    const { value, description } = form.values
    updateResourceServerScopes(api.id, {
      add: [{ value, description }],
      remove: []
    }).then(() => {
      navigate(`/api/${api.id}?tab=permissions`)
    })
  }

  return (
    <form onSubmit={(e) => handleScopeAdded(e)}>
      <Group grow align="center" mt="lg">
        <TextInput
          radius="xl"
          withAsterisk
          label="Value"
          placeholder="read:products"
          {...form.getInputProps('value')}
        />
        <TextInput
          radius="xl"
          label="Description"
          placeholder="Read All Products"
          {...form.getInputProps('description')}
        />

        <Group align="center" mt="lg">
          <Button type="submit">Submit</Button>
        </Group>
      </Group>
    </form>
  )
}

function GrantsPanel({ api, grants = [], applications }) {
  return (
    <Stack>
      <ApiHeader api={api} />
      <AppsAccordion applications={applications} grants={grants} api={api} />
    </Stack>
  )
}

function AppsAccordion({ applications, grants = [], api }) {
  const deviceIcon = <IconDeviceDesktop stroke={1} />
  const navigate = useNavigate()
  const items = applications.map((item) => {
    const grantFound = grants.filter((g) => g.clientId === item.client_id)[0]
    const handleWithCreate = () => {
      createGrant({
        clientId: item.client_id,
        identifier: api.identifier
      }).then(() => {
        navigate(`/api/${api.id}?tab=grants`)
      })
    }
    const handleWithDelete = () => {
      deleteGrantById(grantFound.grantId).then(() => {
        navigate(`/api/${api.id}?tab=grants`)
      })
    }
    return (
      <Accordion.Item key={item.client_id} value={item.client_id}>
        <Accordion.Control icon={deviceIcon}>
          {
            <Group justify="space-between" p="lg">
              <Stack>
                <Text>Name: {item.client_name}</Text>
                <Group>
                  <Text>client_id: </Text>
                  <Badge size="md" variant="outline">
                    {item.client_id}
                  </Badge>
                </Group>
              </Stack>
              <Switch
                color={'yellow'}
                defaultChecked={Boolean(grantFound)}
                size="lg"
                onClick={() =>
                  grantFound ? handleWithDelete() : handleWithCreate()
                }
              />
            </Group>
          }
        </Accordion.Control>
        {grantFound ? (
          <Accordion.Panel>
            <GrantEdit item={grantFound} api={api} />{' '}
          </Accordion.Panel>
        ) : (
          <></>
        )}
      </Accordion.Item>
    )
  })

  return <Accordion>{items}</Accordion>
}

function GrantEdit({ item, api }) {
  const theme = useMantineTheme()
  return (
    <Paper c={theme.colors.myAltColor[7]} variant="light">
      <Stack>
        <TextInput label="Grant ID" disabled={true} value={item.grantId} />
        <ActiveOptionsFilter api={api} item={item} />
      </Stack>
    </Paper>
  )
}

const eqSet = (xs, ys) => xs.size === ys.size && [...xs].every((x) => ys.has(x))

export function ActiveOptionsFilter({ api, item }) {
  const navigate = useNavigate()
  const theme = useMantineTheme()
  const scheme = useColorScheme(localStorage.getItem('mng-color-scheme'))
  const apiScopes = api.scopes.filter((s) => s.length)
  const [possible] = useState(apiScopes)
  const grantedScopes = item.scopes.filter((s) => s.length)
  const [given, setGiven] = useState(grantedScopes)
  const [dirty, setDirty] = useState(false)

  const add = (scope) => {
    setGiven([...given, scope])
  }
  const remove = (scope) => {
    setGiven(given.filter((s) => s !== scope))
  }

  const handleSaveGrant = () => {
    updateGrantById(item.grantId, given, api.identifier).then(() => {
      navigate(`/api/${api.id}?tab=grants`)
    })
  }

  const handleSelectAll = () => {
    setGiven([...possible])
  }

  const handleSelectNone = () => {
    setGiven([])
  }

  useEffect(() => {
    setDirty(!eqSet(new Set(given), new Set(grantedScopes)))
  }, [given, grantedScopes])

  const buttonVariant = scheme === 'dark' ? 'filled' : 'outline'
  return (
    <Stack>
      <Group justify="flex-start">
        <Button
          leftSection={<IconCheckbox size={18} />}
          onClick={() => handleSelectAll()}
          variant={'light'}
        >
          All
        </Button>
        <Button
          leftSection={<IconForbid size={18} />}
          onClick={() => handleSelectNone()}
          color={theme.colors.gray[5]}
          variant="outline"
        >
          None
        </Button>
      </Group>
      <Paper shadow="lg" radius="lg" p="xl">
        <Group justify="flex-start">
          {possible.map((scope) => {
            return given.includes(scope) ? (
              <Button
                c={theme.colors.myColor[3]}
                variant={'light'}
                size="compact-sm"
                radius={'lg'}
                key={scope}
                rightSection={<IconCheckbox size={16} />}
                onClick={() => remove(scope)}
              >
                {scope}
              </Button>
            ) : (
              <Button
                size="compact-sm"
                color={theme.colors.gray[scheme === 'dark' ? 5 : 6]}
                key={scope}
                radius={'lg'}
                variant={'light'}
                rightSection={<IconForbid size={16} />}
                onClick={() => add(scope)}
              >
                {scope}
              </Button>
            )
          })}
        </Group>
      </Paper>
      <Space />
      <Paper>
        <Button
          size="md"
          disabled={!dirty}
          variant={buttonVariant}
          onClick={() => handleSaveGrant()}
        >
          Save
        </Button>
      </Paper>
    </Stack>
  )
}

function ApiHeader({ api }) {
  return (
    <>
      <h3>{api.name}</h3>
      <Group>
        <Badge size="md" color="blue">
          {api.identifier}
        </Badge>
        <CopyButton value={api.identifier} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? 'Copied' : 'Copy'}
              withArrow
              position="right"
            >
              <ActionIcon
                color={copied ? 'teal' : 'gray'}
                variant="subtle"
                onClick={copy}
              >
                {copied ? (
                  <IconCheck style={{ width: rem(18) }} />
                ) : (
                  <IconCopy style={{ width: rem(18) }} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </>
  )
}

function Settings({ api }) {
  const navigate = useNavigate()
  const [dirty, setDirty] = useState(false)
  const form = useForm({
    initialValues: {
      name: api.name,
      ttl: api.ttl || 86000,
      ttl_browser: api.ttl_browser || 7200,
      allow_skip_consent: api.allow_skip_consent || true
    },
    onValuesChange: () => setDirty(true),
    validate: {
      name: (value) =>
        value.length >= 2
          ? null
          : 'Invalid value. Must be at least 2 chars at least.',
      ttl: (value) =>
        Number.isFinite(value) && value > 0
          ? null
          : 'Invalid value. Must be a number greater than 0',
      ttl_browser: (value) =>
        Number.isFinite(value) && value > 0 && value <= form.values.ttl
          ? null
          : 'Invalid value. Must be a number greater than 0 and less than TTL',
      allow_skip_consent: (value) => null
    }
  })

  const handleSave = () => {
    if (form.validate().hasErrors) {
      return
    }
    updateApi(api.id, form.values).then(() => {
      navigate(`/api/${api.id}?tab=settings`)
    })
  }

  return (
    <Stack gap="xl">
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        General Settings
        <Stack gap="xs">
          <TextInput
            withAsterisk
            label="ID"
            value={api.id}
            description="The API ID in db"
            inputWrapperOrder={['label', 'input', 'description']}
            disabled
          />
          <TextInput
            withAsterisk
            label="Api name"
            description="API name as shown to users"
            {...form.getInputProps('name')}
            inputWrapperOrder={['label', 'input', 'description', 'errors']}
          />
          <TextInput
            withAsterisk
            label="API Identifier"
            value={api.identifier}
            description={
              'The Unique API identifier. This value will be used as the audience parameter when resource indicators are used.'
            }
            inputWrapperOrder={['label', 'input', 'description']}
            disabled
            rightSection={
              <CopyButton value={api.identifier} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? 'Copied' : 'Copy'}
                    withArrow
                    position="right"
                  >
                    <ActionIcon
                      color={copied ? 'teal' : 'gray'}
                      variant="subtle"
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck style={{ width: rem(18) }} />
                      ) : (
                        <IconCopy style={{ width: rem(18) }} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            }
          />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        Token Settings
        <Stack gap="xs">
          <TextInput
            withAsterisk
            label="Token Expiration TTL (in seconds)"
            description="Expiration value (in seconds) for access tokens issued for this API from the Token Endpoint."
            {...form.getInputProps('ttl')}
            onChange={(e) => {
              form.setFieldValue('ttl', parseInt(e.target.value))
              form.validate()
            }}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
          />
          <TextInput
            withAsterisk
            label="Token Expiration for Browser Flows (in seconds)"
            description="Expiration value (in seconds) for access tokens issued for this API using Implicit flow. Cannot be greater than the Token TTL value."
            {...form.getInputProps('ttl_browser')}
            onChange={(e) => {
              form.setFieldValue('ttl_browser', parseInt(e.target.value))
              form.validate()
            }}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
          />
          <TextInput
            withAsterisk
            label="Signing Algorithm"
            value={api.signingAlg}
            description="Algorithm to be used when signing the access tokens for this API."
            inputWrapperOrder={['label', 'input', 'description']}
            disabled
          />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        Access Settings
        <Stack gap="sm">
          <Switch.Group
            defaultValue={['react']}
            label="Skip user consent for first party apps"
            description="Toggling this on will allow first party applications to skip the consent prompt when requesting access to this API."
            withAsterisk
          >
            <Group mt="xs">
              <Switch
                {...form.getInputProps('allow_skip_consent')}
                onChange={(e) => {
                  form.setFieldValue(
                    'allow_skip_consent',
                    !form.values.allow_skip_consent
                  )
                }}
                value="allow_skip_consent"
                label="Allow"
                size="lg"
              />
            </Group>
          </Switch.Group>
        </Stack>
      </Group>
      <Group justify="center">
        <Button size="md" disabled={!dirty} onClick={handleSave}>
          Save
        </Button>
      </Group>
      <Divider />
    </Stack>
  )
}
