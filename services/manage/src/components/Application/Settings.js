import {
  Box,
  Button,
  Code,
  Dialog,
  Divider,
  Group,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  useMantineTheme
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { IconEyeCheck, IconEyeOff } from '@tabler/icons-react'
import { useState } from 'react'
import { updateApplication } from '../../api'
import { CopyButton } from '../CopyButton'
import { ArticleCard } from './ApplicationLogo'
import classes from './ApplicationLogo.module.css'
const issuer = process.env.REACT_APP_ISSUER

const isValidUrl = (value) => {
  if (typeof value !== 'string') {
    return false
  }
  try {
    new URL(value)
    return true
  } catch (err) {
    return false
  }
}

const isValidUrlArray = (value) => {
  if (typeof value !== 'string') {
    return 'Invalid value'
  }
  const urls = value.split(',')

  const index = urls.findIndex((url) => !isValidUrl(url))
  if (index >= 0) return index
  return null
}

export const Settings = ({ app: activeApp }) => {
  const theme = useMantineTheme()
  const [opened, { toggle, close }] = useDisclosure(false)
  const [apiResponse, setApiResponse] = useState()
  const form = useForm({
    initialValues: {
      initiate_login_uri: '',
      logo_uri: '',
      ...activeApp
    },
    validate: {
      client_name: (value) =>
        value.trim().length > 3 ? null : 'Name is required',
      'urn:f0:type': (value) =>
        ['native', 'spa', 'web', 'm2m'].includes(value) ? null : 'Invalid type',
      initiate_login_uri: (value) =>
        !value ? null : isValidUrl(value) ? null : 'Invalid URI',
      logo_uri: (value) => (!value || isValidUrl(value) ? null : 'Invalid URI'),
      redirect_uris: (value) =>
        !value || value.length === 0
          ? null
          : isValidUrlArray(value) === null
            ? null
            : `Invalid URI at index ${isValidUrlArray(value)}`,
      post_logout_redirect_uris: (value) =>
        !value || value.length === 0
          ? null
          : isValidUrlArray(value) === null
            ? null
            : `Invalid URI at index ${isValidUrlArray(value)}`
    }
  })

  const handleSubmit = () => {
    if (form.validate().hasErrors) {
      console.log(form.errors, form.values)
      return
    }
    updateApplication(activeApp.client_id, form.values).then((res) => {
      setApiResponse(JSON.stringify(res, null, 2))
      toggle()
      setTimeout(() => {
        close()
      }, 20000)
    })
  }

  return (
    <Stack maw={1200} gap={'xs'} fw={600}>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>Basic Information</Text>
        <Box p={'xs'}>
          <TextInput
            fw={600}
            label="Name (client_name)"
            radius="xl"
            m="sm"
            description={
              'Recognizable name for your application. Will be shown in consent prompt interactions interface.'
            }
            {...form.getInputProps('client_name')}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
            withAsterisk
          />
          <TextInput
            fw={600}
            label="Issuer (oidc issuer)"
            radius="xl"
            m="sm"
            disabled
            defaultValue={issuer}
            description={'Issuer Identifier for the OIDC server.'}
            inputWrapperOrder={['label', 'input', 'description']}
            rightSection={<CopyButton value={issuer} />}
          />
          <TextInput
            fw={600}
            label="Client ID (client_id)"
            radius="xl"
            m="sm"
            disabled
            defaultValue={activeApp.client_id}
            description={'Client Identifier for the application.'}
            inputWrapperOrder={['label', 'input', 'description']}
            rightSection={<CopyButton value={activeApp.client_id} />}
          />
          {activeApp.client_secret && (
            <Group grow m="sm">
              <PasswordInput
                fw={600}
                radius="xl"
                label="Client Secret (client_secret)"
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
          )}
        </Box>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>Application Properties</Text>
        <Stack p={'xs'}>
          <ArticleCard url={form.values.logo_uri} />
          <TextInput
            className={classes.input}
            placeholder="https://my.app/logo-small.png"
            {...form.getInputProps('logo_uri')}
          />
          <Select
            m="sm"
            label="Application Type (urn:f0:type)"
            description={`
            The type of application will determine which settings you can configure from the dashboard.
            If you try to change from confidential application type to public, you will be stopped because that is often mistake in UI. 
            It's best to create a new application intentionally with the correct type.
            Changing from public to confidential is allowed.
            `}
            {...form.getInputProps('urn:f0:type')}
            data={[
              { group: 'Public', items: ['native', 'spa'] },
              { group: 'General Purpose', items: ['web'] },
              { group: 'Confidential', items: ['m2m'] }
            ]}
            inputWrapperOrder={['label', 'input', 'description', 'errors']}
          />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>Application URIs</Text>
        <Stack p={'xs'}>
          <TextInput
            fw={600}
            ml="sm"
            label="Initial Login URI (initiate_login_uri)"
            {...form.getInputProps('initiate_login_uri')}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
            placeholder="https://example.com/login/start"
          />
          <Text ml="sm" c="dimmed" fw={600} size={'xs'}>
            Sometimes OIDC Provider needs to redirect to your application’s
            login page. This URI should point to a route in your application
            that redirects to {<Code>{'/auth'}</Code>} endpoint.
          </Text>
          <Textarea
            fw={600}
            rows={4}
            ml="sm"
            label="Allowed Callback URLs (redirect_uris)"
            {...form.getInputProps('redirect_uris')}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
            placeholder="https://example.com/auth/callback,https://example.dev/auth/cb"
          />
          <Text ml="sm" c="dimmed" fw={600} size={'xs'}>
            After the user authenticates we will only call back to any of these
            URLs. You can specify multiple valid URLs by comma-separating them
            (typically to handle different environments like QA or testing).
            Make sure to specify the protocol (like {<Code>https://</Code>}).
            With the exception of custom URI schemes for native clients, all
            callbacks should use protocols like http/https.
          </Text>
          <Textarea
            fw={600}
            rows={4}
            ml="sm"
            label="Allowed Logout URLs (post_logout_redirect_uris)"
            {...form.getInputProps('post_logout_redirect_uris')}
            inputWrapperOrder={['label', 'input', 'error', 'description']}
            placeholder="https://example.com/auth/signed-out,https://example.dev/auth/post-logout"
          />
          <Text ml="sm" c="dimmed" fw={600} size={'xs'}>
            A set of URLs that are valid to redirect to after logout from OIDC
            Provider. After a user logs out from OIDC you can redirect them with
            the <Code>returnTo</Code> query parameter. The URL that you use in{' '}
            <Code>returnTo</Code>
            must be listed here. You can specify multiple valid URLs by
            comma-separating them. You can use the star symbol as a wildcard for
            subdomains (*.mycompany.com). Query strings and hash information are
            not taken into account when validating these URLs. Read more about
            this at:
          </Text>
        </Stack>
      </Group>
      <Group grow align="center" justify="space-around">
        <Button maw={300} onClick={() => handleSubmit()} justify="center">
          Save
        </Button>
      </Group>
      {/* <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>OpenID Connect Back-Channel Logout</Text>
        <Stack>TBD</Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>ID Token</Text>
        <Stack>
          <TextInput
            label="ID Token Expiration"
            size="sm"
            {...form.getInputProps('id_token_expiration')}
            inputWrapperOrder={['label', 'input', 'description', 'errors']}
            description={
              'This setting allows you to set the lifetime of the id_token (in seconds)'
            }
          />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>Refresh Token Rotation TODO</Text>
        <Stack>
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>Refresh Token Expiration TODO</Text>
        <Stack>
          <TextInput label="input1" />
        </Stack>
      </Group>
      <Divider />
      <Group grow align="center" justify="space-around">
        <Text maw={350}>Grant Types TODO</Text>
        <Stack>
          <TextInput label="todo" />
        </Stack>
      </Group> */}
      <Dialog
        className="dialog"
        position={{ top: 50, right: 50 }}
        opened={opened}
        size="xl"
        radius="md"
        c={theme.colors.myColor[9]}
        bg={theme.colors.gray[5]}
      >
        <Text size="lg" mb="xs" fw={800}>
          Saved successfully.
        </Text>
        <aside>
          <CopyButton value={apiResponse} />
          <Code block>{apiResponse}</Code>
        </aside>
      </Dialog>
    </Stack>
  )
}
