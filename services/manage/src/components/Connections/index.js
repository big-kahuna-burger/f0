import {
  Alert,
  Anchor,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Switch,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  rem
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useColorScheme, useDisclosure } from '@mantine/hooks'
import { IconDatabase } from '@tabler/icons-react'
import { IconPlus } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { createDBConnection } from '../../api'

export function Connections() {
  const colorScheme = useColorScheme()
  const { connections } = useLoaderData()
  const rows = connections.map((conn) => (
    <Table.Tr key={conn.id}>
      <Table.Td>
        <Group>
          <ThemeIcon variant={colorScheme.colorScheme} size={38}>
            <IconDatabase style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Anchor href={`/authn/db/${conn.id}`}>{conn.name}</Anchor>
        </Group>
      </Table.Td>
      <Table.Td>{conn.position}</Table.Td>
    </Table.Tr>
  ))

  return (
    <>
      <CreateDBConnectionModal />
      <Table
        striped
        highlightOnHover
        verticalSpacing={'lg'}
        horizontalSpacing={'xl'}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Connection</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}

function CreateDBConnectionModal() {
  const [opened, { open, close }] = useDisclosure(false)
  const [hasErrors, setHasErrors] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const [createErrorText, setCreateErrorText] = useState(null)

  const navigate = useNavigate()

  const form = useForm({
    validateInputOnChange: true,
    onValuesChange: () => {
      setDirty(true)
    },
    initialValues: {
      name: '',
      disableSignup: false,
    },
    validate: {
      name: (value) => {
        if (!value) {
          return 'Name is required'
        }
        if (!/^[a-zA-Z0-9]/.test(value)) {
          return 'Must start with an alphanumeric character'
        }
        if (!/^[a-zA-Z0-9-]{0,35}$/.test(value)) {
          return 'Can only contain alphanumeric characters and -'
        }
        if (!/[a-zA-Z0-9]$/.test(value)) {
          return 'Must end with an alphanumeric character'
        }
        return null
      },
    }
  })

  useEffect(() => {
    if (!dirty) return
    const errors = Object.keys(form.errors).length > 0
    setHasErrors(errors)
  }, [form.errors, dirty])

  const handleCreateConnection = async () => {
    setDirty(false)
    setLoading(true)
    const { name, disableSignup } = form.values
    try {
      const { id } = await createDBConnection({ name, disableSignup })
      setCreated(true)
      setTimeout(() => {
        navigate(`/authn/db/${id}`)
      }, 1500)
    } catch (error) {
      setCreateErrorText(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal size={'xl'} opened={opened} onClose={close} title={'Create a new connection'} >
        <LoadingOverlay
          mx="auto"
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        {created && (<Alert mt="md" mb="lg" color="teal" title="Connection created" />)}
        {createErrorText && (<Alert mt="md" mb="lg" color="red" title={createErrorText} />)}
        <Paper p={'md'}>
          <TextInput
            m='md'
            label='Name'
            description={`Must start and end with an alphanumeric character and can only contain alphanumeric characters and '-'. Max 35 characters.`}
            inputWrapperOrder={[
              'label',
              'input',
              'error',
              'description',
            ]}
            {...form.getInputProps('name')}
          />
          <Paper withBorder p='sm' m='md'>
            <Group justify='space-between' align='center'>
              <div>
                <Text>
                  Disable Sign Ups
                </Text>
                <Text size='xs' c='dimmed'>
                  Prevent new user sign ups to your application from public (unauthenticated) endpoints. You will still be able to create users with your API credentials or from the Management dashboard.
                </Text>
              </div>
              <Switch
                {...form.getInputProps('disableSignup')}
              />
            </Group>

          </Paper>
          <Group m='md'>
            <Button type='submit' onClick={handleCreateConnection} disabled={hasErrors}>Create</Button>
            <Button variant='outline' onClick={close}>Cancel</Button>
          </Group>
        </Paper>
      </Modal>
      <Button
        onClick={open}
        rightSection={
          <IconPlus style={{ width: rem(25), height: rem(25) }} stroke={1.5} />
        }
        radius="xl"
        size="md"
        styles={{
          root: { paddingRight: rem(14), height: rem(48) },
          section: { marginLeft: rem(22) }
        }}
      >
        Create New
      </Button>
    </>
  )
}
