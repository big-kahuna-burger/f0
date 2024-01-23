import {
  Anchor,
  Avatar,
  Badge,
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Modal,
  Pagination,
  Stack,
  Table,
  Text,
  ThemeIcon,
  rem,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'

import { useDisclosure, usePagination } from '@mantine/hooks'
import {
  IconBrandReact,
  IconDeviceMobile,
  IconExchange,
  IconPlus,
  IconServer2,
  IconServerCog
} from '@tabler/icons-react'

import { useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import classes from './Applications.module.css'
import { FeaturesCards } from './FeatureCards'

export function Applications() {
  const { apps, total, page = 1, size = 20 } = useLoaderData()
  const colorScheme = useMantineColorScheme()
  const theme = useMantineTheme()
  const realTotal = Math.floor(total / size) + 1

  const navigate = useNavigate()
  const AppRow = ({ item }) => {
    const AppIcon =
      {
        native: IconDeviceMobile,
        spa: IconBrandReact,
        web: IconServerCog,
        m2m: IconExchange
      }[item['urn:f0:type']] || IconServer2

    return (
      <Table.Tr variant={colorScheme.colorScheme}>
        <Table.Td>
          <ThemeIcon
            variant={colorScheme.colorScheme}
            size={38}
            color={theme.colors.myAltColor[3]}
          >
            <AppIcon style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
        </Table.Td>
        <Table.Td>
          <Group gap="sm">
            <Flex
              mih={50}
              gap="sm"
              justify="center"
              align="flex-start"
              direction="column"
              wrap="wrap"
            >
              <Anchor href={`/app/${item.client_id}/settings`}>
                <Text size="lg">{item.client_name}</Text>
              </Anchor>
              <Text size="sm" c={'dimmed'}>
                {item.client_id}
              </Text>
            </Flex>
          </Group>
        </Table.Td>
        <Table.Td>
          {item?.logo_uri ? (
            <Avatar radius="xs" src={item.logo_uri} size={'lg'} />
          ) : (
            'NOT SET'
          )}
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
    )
  }

  return (
    <>
      <CreateModal />
      <Flex
        grow={1}
        mih={50}
        gap="md"
        justify="flex-start"
        direction="column"
        wrap="wrap"
      >
        <Table.ScrollContainer>
          <Table verticalSpacing="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Name (Client ID)</Table.Th>
                <Table.Th>App Logo</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th>-</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {apps.map((item, i) => (
                <AppRow item={item} key={item.client_id} />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Group justify="center" align="flex-end">
          <Pagination
            total={realTotal}
            onChange={(page) => {
              navigate(`/apps?page=${page}&size=${size}`)
            }}
          />
        </Group>
      </Flex>
    </>
  )
}

function CreateModal() {
  const [opened, { open, close }] = useDisclosure(false)

  const [visible, { toggle }] = useDisclosure(false)
  const [title, setTitle] = useState(false)
  const featureType = ({ name, title }) => {
    setTitle(title)
  }
  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size={'xl'}
        title="Create new Application (OIDC client)"
      >
        <>
          <LoadingOverlay
            mx="auto"
            visible={visible}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <FeaturesCards
            onChange={({ name, title }) => featureType({ name, title })}
          />
        </>
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
