import {
  Alert,
  Button,
  Code,
  Group,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  rem
} from '@mantine/core'
import { useForm } from '@mantine/form'

import { IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useLoaderData } from 'react-router-dom'
import classes from './AppServer.module.css'

export function AppServer() {
  const { activeApi } = useLoaderData()
  return (
    <>
      <Tabs defaultValue="permissions">
        <Tabs.List>
          <Tabs.Tab value="quick">Quick Start</Tabs.Tab>
          <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
          <Tabs.Tab value="applications">Applications</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="quick">
          <Code block>{JSON.stringify(activeApi, null, 2)}</Code>
        </Tabs.Panel>
        <Tabs.Panel value="permissions">
          <Permissions
            name={activeApi.name}
            scopes={activeApi.scopes}
            isReadonly={activeApi.readonly}
          />
        </Tabs.Panel>
        <Tabs.Panel value="applications">Applications</Tabs.Panel>
      </Tabs>
    </>
  )
}

const algosSupported = ['RS256', 'HS256']

const Permissions = ({
  name = 'API',
  identifier,
  isReadonly = false,
  scopes = []
}) => {
  const icon = <IconInfoCircle />
  return (
    <Stack w="100%" h="100%" bg="var(--mantine-color-body)" align="center">
      <h1>{name}</h1>
      <h3>Scopes</h3>

      <Text ta="center" fw={500} mt="sm">
        Scopes are permissions that can be requested by applications to access
        your API.
      </Text>
      <AddAScope available={!isReadonly} />
      {scopes.length ? (
        <Scopes items={scopes} isReadonly={isReadonly} />
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

function AddAScope({ available }) {
  const icon = <IconInfoCircle />
  return (
    <>
      <h3>Add a Permission</h3>
      {!available ? (
        <Alert variant="light" color="yellow" title="Not Available" icon={icon}>
          Scope management is not available for this API since this is a
          management API built-in definition already, you would need to change
          source code for this.
        </Alert>
      ) : (
        <AddAPermissionForm />
      )}
    </>
  )
}

const AddAPermissionForm = () => {
  const form = useForm({
    initialValues: {
      value: '',
      description: ''
    },

    validate: {
      value: (value) =>
        value.length >= 2 ? null : 'Invalid value. Must be at least 2 chars',
      description: (description) =>
        description.length >= 2
          ? null
          : 'Invalid description. Must be at least 2 chars'
    }
  })
  return (
    <Stack mx="auto" w={{ base: 200, sm: 400, lg: 1000 }}>
      <form onSubmit={form.onSubmit((values) => console.log(values))}>
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
            withAsterisk
            label="Description"
            placeholder="Read All Products"
            {...form.getInputProps('description')}
          />

          <Group align="center" mt="lg">
            <Button type="submit">Submit</Button>
          </Group>
        </Group>
      </form>
    </Stack>
  )
}
