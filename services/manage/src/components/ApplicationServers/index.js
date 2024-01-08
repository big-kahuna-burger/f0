import {
  Anchor,
  Badge,
  Box,
  Button,
  Combobox,
  Flex,
  Group,
  Input,
  InputBase,
  LoadingOverlay,
  Modal,
  NavLink,
  Table,
  TextInput,
  ThemeIcon,
  rem,
  useCombobox,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'

import { useForm } from '@mantine/form'

import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconServer2 } from '@tabler/icons-react'

import { useEffect, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { createResourceServer } from '../../api'
import classes from './AppServers.module.css'

export function AppServers() {
  const { apis } = useLoaderData()
  const colorScheme = useMantineColorScheme()
  const theme = useMantineTheme()
  const navigate = useNavigate()
  return (
    <>
      <CreateModal
        onApiCreated={(api) => {
          navigate(`/api/${api.id}/quick`)
        }}
      />
      <Table.ScrollContainer>
        <Table verticalSpacing="lg">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>API</Table.Th>
              <Table.Th>Identifier</Table.Th>
              <Table.Th>Signing Alg</Table.Th>
              <Table.Th>Updated At</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {apis.map((item, i) => (
              <Table.Tr
                className={classes['api-row']}
                key={item.identifier}
                variant={colorScheme.colorScheme}
              >
                <Table.Td>
                  <Group gap="sm">
                    <ThemeIcon
                      variant={colorScheme.colorScheme}
                      size={38}
                      color={theme.colors.myAltColor[3]}
                    >
                      <IconServer2
                        style={{ width: rem(20), height: rem(20) }}
                      />
                    </ThemeIcon>
                    <Flex
                      mih={50}
                      gap="sm"
                      justify="center"
                      align="flex-start"
                      direction="column"
                      wrap="wrap"
                    >
                      <NavLink
                        label={item.name}
                        href={`/api/${item.id}/quick`}
                      />
                      {item.readonly && (
                        <Badge
                          color={theme.colors.myAltColor[3]}
                          variant={colorScheme.colorScheme}
                        >
                          readonly
                        </Badge>
                      )}
                    </Flex>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group>
                    <Anchor
                      c={
                        colorScheme.colorScheme === 'light'
                          ? theme.colors.myAltColor[7]
                          : theme.colors.myColor[3]
                      }
                      variant={colorScheme.colorScheme}
                      component="button"
                    >
                      {item.identifier}
                    </Anchor>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={theme.colors.myAltColor[3]}
                    variant={colorScheme.colorScheme}
                  >
                    {item.signingAlg}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={theme.colors.myAltColor[3]}
                    variant={colorScheme.colorScheme}
                  >
                    {item.formattedUpdatedAt}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  )
}

function CreateModal(props) {
  const [opened, { open, close }] = useDisclosure(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  useEffect(() => {
    if (submitStatus !== 'submitting' && submitting) {
      setSubmitStatus('submitting')
      createResourceServer(submitting)
        .then((api) => {
          props?.onApiCreated(api)
        })
        .catch((error) => {
          console.error(error)
          setSubmitStatus('error')
        })
        .finally(() => setSubmitting(false))
    }
  }, [submitStatus, submitting, props])

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Create new API (Resource server)"
      >
        <CreateFormBox onSubmit={(values) => setSubmitting(values)} />
      </Modal>

      <ButtonCreate onClick={open}>Create API</ButtonCreate>
    </>
  )
}
function ButtonCreate({ ...props }) {
  return (
    <Button
      {...props}
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
  )
}

const algosSupported = ['RS256', 'HS256']

function CreateFormBox(props) {
  const [visible, { toggle }] = useDisclosure(false)
  const form = useForm({
    initialValues: {
      name: '',
      identifier: '',
      signingAlg: null
    },
    validate: {
      name: (value) =>
        value.length < 2 ? 'Name must have at least 2 letters' : null,
      identifier: (value) =>
        URL.canParse(value) ? null : 'Invalid identifier. Use URI format',
      signingAlg: (value) =>
        !algosSupported.includes(value) ? 'Bad algorithm' : null
    }
  })

  return (
    <>
      <LoadingOverlay
        mx="auto"
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <Box maw={340} mx="auto" pos="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <TextInput
            label="Name"
            placeholder="Name"
            {...form.getInputProps('name')}
          />
          <TextInput
            mt="md"
            label="Identifier"
            placeholder="https://myapi.identifier.dev"
            {...form.getInputProps('identifier')}
          />
          <BasicSelect
            mt="md"
            {...form.getInputProps('signingAlg')}
            onChange={(val) => {
              form.setFieldValue('signingAlg', val)
            }}
          />
          <Group justify="center" mt="xl">
            <Button
              type="submit"
              m="lg"
              onClick={() => {
                if (form.validate().hasErrors) {
                  return
                }
                toggle()
                props?.onSubmit(form.values)
              }}
            >
              Submit
            </Button>
          </Group>
        </form>
      </Box>
    </>
  )
}

export function BasicSelect(props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const [value, setValue] = useState(null)

  const options = algosSupported.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ))

  return (
    <Combobox
      {...props}
      label="Signing Algorithm"
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        setValue(val)
        props?.onChange(val)
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
        >
          {value || (
            <Input.Placeholder>Select Signing Algorithm</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
