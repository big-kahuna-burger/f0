import {
  Box,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconEyeCheck, IconEyeOff } from '@tabler/icons-react'
import { CopyButton } from '../CopyButton'
import { ArticleCard } from './ApplicationLogo'
const issuer = process.env.REACT_APP_ISSUER

export const Settings = ({ app: activeApp }) => {
  const form = useForm({
    initialValues: activeApp
  })

  return (
    <Stack maw={1200} gap={'xs'}>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>Basic Information</Text>
        <Box gap="xs">
          <TextInput
            fw={600}
            label="Name"
            radius="xl"
            description={
              'Recognizable name for your application. Will be shown in consent prompt interactions interface.'
            }
            {...form.getInputProps('client_name')}
            inputWrapperOrder={['label', 'input', 'description']}
            withAsterisk
          />
          <TextInput
            fw={600}
            label="Issuer"
            radius="xl"
            disabled
            defaultValue={issuer}
            description={'Issuer Identifier for the OIDC server.'}
            inputWrapperOrder={['label', 'input', 'description']}
            rightSection={<CopyButton value={issuer} />}
          />
          <TextInput
            fw={600}
            label="Client ID"
            radius="xl"
            disabled
            defaultValue={activeApp.client_id}
            description={'Client Identifier for the application.'}
            inputWrapperOrder={['label', 'input', 'description']}
            rightSection={<CopyButton value={activeApp.client_id} />}
          />
          <Group grow>
            <PasswordInput
              fw={600}
              radius="xl"
              label="Client Secret"
              // disabled
              defaultValue={activeApp.client_secret}
              description={'Client Secret for the application.'}
              inputWrapperOrder={['label', 'input', 'description']}
              visibilityToggleIcon={({ reveal }) =>
                reveal ? (
                  <IconEyeOff
                    style={{
                      width: 'var(--psi-icon-size)',
                      height: 'var(--psi-icon-size)'
                    }}
                  />
                ) : (
                  <IconEyeCheck
                    style={{
                      width: 'var(--psi-icon-size)',
                      height: 'var(--psi-icon-size)'
                    }}
                  />
                )
              }
            />
            <CopyButton value={activeApp.client_secret} w={75} />
          </Group>
        </Box>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>Application Properties</Text>
        <Stack gap="xs">
          <Text fw={500}>Application Logo</Text>
          <ArticleCard />
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>Application URIs</Text>
        <Stack gap="xs">
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>OpenID Connect Back-Channel Logout</Text>
        <Stack gap="xs">
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>ID Token</Text>
        <Stack gap="xs">
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>Refresh Token Rotation</Text>
        <Stack gap="xs">
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>Refresh Token Expiration</Text>
        <Stack gap="xs">
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around" gap="xs">
        <Text maw={350}>Grant Types</Text>
        <Stack gap="xs">
          <TextInput label="todo" />
        </Stack>
      </Group>
    </Stack>
  )
}
