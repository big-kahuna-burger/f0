import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Button,
  Code,
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
import { useLoaderData, useNavigate } from 'react-router-dom'

import { useColorScheme } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import {
  createGrant,
  deleteGrantById,
  updateApi,
  updateGrantById,
  updateResourceServerScopes
} from '../../api'

import { CopyButton } from '../CopyButton'
import classes from './AppServer.module.css'
import QuickStart from './QuickStart'

export function AppServer() {
  const navigate = useNavigate()
  const { activeApi, grants, applications, tab } = useLoaderData()
  return (
    <Group grow align="center" justify="center">
      <Tabs
        defaultValue={tab}
        onChange={(value) => navigate(`/api/${activeApi.id}/${value}`)}
      >
        <Tabs.List grow justify="center">
          <Tabs.Tab value="quick">Quick Start</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
          <Tabs.Tab value="grants">Grants</Tabs.Tab>
        </Tabs.List>

        <ApiHeader api={activeApi} />
        <Tabs.Panel value="quick">
          <QuickStart api={activeApi} />
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <Settings api={activeApi} />
        </Tabs.Panel>
        <Tabs.Panel value="permissions">
          <Permissions
            name={activeApi.name}
            scopes={activeApi.scopes}
            isReadonly={activeApi.readOnly}
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
    </Group>
  )
}

const Permissions = ({ api }) => {
  const icon = <IconInfoCircle />
  return (
    <Stack maw={1200} bg="var(--mantine-color-body)">
      <Text fw={500} mt="sm">
        Scopes are permissions that can be requested by applications to access
        APIs.
      </Text>
      <AddAScope available={!api.readOnly} api={api} />
      {Object.keys(api.scopes).length ? (
        <Scopes api={api} />
      ) : (
        <Alert variant="light" color="blue" title="No Scopes" icon={icon}>
          No scopes are defined for this API
        </Alert>
      )}
    </Stack>
  )
}

const Scopes = ({ api }) => {
  return (
    <>
      <h3>List of Permissions</h3>
      <ScopeListEditable api={api} />
    </>
  )
}

function ScopeListEditable({ api }) {
  const elements = api.scopes
  const navigate = useNavigate()
  const handleScopeDelete = (scope) => {
    updateResourceServerScopes(api.id, {
      add: [],
      remove: [scope]
    }).then(() => {
      navigate(`/api/${api.id}/permissions`)
    })
  }
  const readonly = api.readOnly
  const rows = Object.entries(elements).map(([scope, description]) => (
    <Table.Tr key={scope}>
      <Table.Td>
        <Code>{scope}</Code>
      </Table.Td>
      <Table.Td>{description}</Table.Td>
      {!readonly && (
        <Table.Td>
          <ActionIcon
            variant="filled"
            aria-label="Delete Scope"
            onClick={(e) => handleScopeDelete(scope)}
          >
            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ActionIcon>
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
  const existing = Object.keys(api.scopes)
  const form = useForm({
    initialValues: {
      value: '',
      description: ''
    },

    validate: {
      value: (value) =>
        value.length >= 2
          ? !existing.includes(value)
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
      navigate(`/api/${api.id}/permissions`)
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
    <Stack maw={1200}>
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
        navigate(`/api/${api.id}/grants`)
      })
    }
    const handleWithDelete = () => {
      deleteGrantById(grantFound.grantId).then(() => {
        navigate(`/api/${api.id}/grants`)
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
  const apiScopes = Object.keys(api.scopes)
  const [possible] = useState(apiScopes)
  const grantedScopes = item.scopes
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
      navigate(`/api/${api.id}/grants`)
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
    <Group maw={600} justify="space-around" align="center">
      <h3>{api.name}</h3>
      {/* {Object.entries(api).map(([key, value]) => {
        return (
          <Badge key={key} size="xs" color="blue">
            {key}: {JSON.stringify(value)}
          </Badge>
        )
      })} */}
      <Badge size="md" color="blue">
        {api.identifier}
      </Badge>
    </Group>
  )
}

function Settings({ api }) {
  const navigate = useNavigate()
  const [dirty, setDirty] = useState(false)
  const form = useForm({
    initialValues: {
      name: api.name,
      ttl: api.ttl || 86000,
      ttlBrowser: api.ttlBrowser || 7200,
      allowSkipConsent: api.allowSkipConsent || true
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
      ttlBrowser: (value) =>
        Number.isFinite(value) && value > 0 && value <= form.values.ttl
          ? null
          : 'Invalid value. Must be a number greater than 0 and less than TTL',
      allowSkipConsent: (value) => null
    }
  })
  const [checked, setChecked] = useState(api.allowSkipConsent)

  const handleSave = () => {
    if (form.validate().hasErrors) {
      return
    }
    setDirty(false)
    updateApi(api.id, form.values).then(() => {
      setDirty(false)
      navigate(`/api/${api.id}/settings`)
    })
  }

  return (
    <Stack maw={1200}>
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
            rightSection={<CopyButton value={api.identifier} />}
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
            {...form.getInputProps('ttlBrowser')}
            onChange={(e) => {
              form.setFieldValue('ttlBrowser', parseInt(e.target.value))
              form.validate()
            }}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
          />
          <TextInput
            w={150}
            withAsterisk
            label="Signing Algorithm"
            value={api.signingAlg}
            description="Algorithm to be used when signing the access tokens for this API."
            inputWrapperOrder={['label', 'input', 'description']}
            disabled
          />
          {api.signingAlg === 'HS256' && (
            <Group>
              <TextInput
                w={400}
                fw={300}
                withAsterisk
                label="Signing Secret"
                value={api.signingSecret}
                description="Secret to be used when signing the access tokens for this API."
                inputWrapperOrder={['label', 'input', 'description']}
                disabled
                rightSection={<CopyButton value={api.signingSecret} />}
              />
            </Group>
          )}
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        Access Settings
        <Stack gap="sm">
          <Switch.Group
            label="Skip user consent for first party apps"
            description="Toggling this on will allow first party applications to skip the consent prompt when requesting access to this API."
            withAsterisk
          />
          <Switch
            checked={checked}
            onChange={(event) => {
              setDirty(true)
              setChecked(event.currentTarget.checked)
              form.setFieldValue(
                'allowSkipConsent',
                event.currentTarget.checked
              )
            }}
          />
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
