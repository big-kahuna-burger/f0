import {
  Alert,
  Box,
  Button,
  Code,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconEyeCheck, IconEyeOff } from '@tabler/icons-react'
import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { updateApplication } from '../../api'
import { CopyButton } from '../CopyButton'
import { ArticleCard } from './ApplicationLogo'
import classes from './ApplicationLogo.module.css'
const issuer = process.env.REACT_APP_ISSUER

const isValidUrlArray = (value) => {
  if (typeof value !== 'string') {
    return 'Invalid value'
  }
  const urls = value.split(',')

  const index = urls.findIndex((url) => !URL.canParse(url))
  if (index >= 0) return index
  return null
}

export const Settings = ({ app: activeApp }) => {
  const navigate = useNavigate()
  const { metadata } = useLoaderData()
  const supportedGrantTypes = metadata?.grant_types_supported || []
  const [selectedGrantTypes, setSelectedGrantTypes] = useState(
    activeApp.grant_types
  )
  const [grantTypesDirty, setGrantTypesDirty] = useState(false)

  const form = useForm({
    initialValues: {
      initiate_login_uri: '',
      logo_uri: '',
      client_name: '',
      ...activeApp
    },
    validate: {
      client_name: (value) =>
        value?.trim().length > 3 ? null : 'Name is required',
      'urn:f0:type': (value) =>
        ['native', 'spa', 'web', 'm2m'].includes(value) ? null : 'Invalid type',
      initiate_login_uri: (value) =>
        !value ? null : URL.canParse(value) ? null : 'Invalid URI',
      logo_uri: (value) =>
        !value || URL.canParse(value) ? null : 'Invalid URI',
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
      navigate(`/app/${activeApp.client_id}/settings`)
    })
  }
  const handleGrantTypeToggle = (grantType) => {
    if (selectedGrantTypes.includes(grantType)) {
      setSelectedGrantTypes(selectedGrantTypes.filter((i) => i !== grantType))
    } else {
      setSelectedGrantTypes([...selectedGrantTypes, grantType])
    }
    setGrantTypesDirty(true)
  }

  const saveGrantTypes = () => {
    setGrantTypesDirty(false)
    updateApplication(activeApp.client_id, {
      grant_types: selectedGrantTypes
    }).finally(() => {
      navigate(`/app/${activeApp.client_id}/settings`)
    })
  }

  return (
    <Paper
      shadow="md"
      mt="xs"
      withBorder
      p="sm"
      radius={'sm'}
      maw={832}
      miw={330}
    >
      <Stack fw={600} mt="xs">
        <Group grow align="center" justify="space-around">
          <Text maw={150}>Basic Information</Text>
          <Box p={'xs'}>
            <TextInput
              fw={600}
              label="Name (client_name)"
              radius="sm"
              m="sm"
              description={
                'Recognizable name for your application. Will be shown in consent prompt interactions interface.'
              }
              {...form.getInputProps('client_name')}
              inputWrapperOrder={['label', 'input', 'error', 'description']}
              withAsterisk
              disabled={activeApp.readonly}
            />
            <TextInput
              fw={600}
              label="Issuer (oidc issuer)"
              radius="sm"
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
              radius="sm"
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
                  radius="sm"
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
          <Text maw={150}>Application Properties</Text>
          <Stack p={'xs'}>
            <ArticleCard url={form.values.logo_uri} />
            <TextInput
              className={classes.input}
              placeholder="https://my.app/logo-small.png"
              {...form.getInputProps('logo_uri')}
              disabled={activeApp.readonly}
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
              disabled={activeApp.readonly}
            />
          </Stack>
        </Group>
        <Divider />
        <Group grow align="center" justify="space-around">
          <Text maw={150}>Application URIs</Text>
          <Stack p={'xs'}>
            <TextInput
              fw={600}
              ml="sm"
              label="Initial Login URI (initiate_login_uri)"
              {...form.getInputProps('initiate_login_uri')}
              inputWrapperOrder={['label', 'input', 'error', 'description']}
              placeholder="https://example.com/login/start"
              disabled={activeApp.readonly}
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
              disabled={activeApp.readonly}
            />
            <Text ml="sm" c="dimmed" fw={600} size={'xs'}>
              After the user authenticates we will only call back to any of
              these URLs. You can specify multiple valid URLs by
              comma-separating them (typically to handle different environments
              like QA or testing). Make sure to specify the protocol (like{' '}
              {<Code>https://</Code>}). With the exception of custom URI schemes
              for native clients, all callbacks should use protocols like
              http/https.
            </Text>
            <Textarea
              fw={600}
              rows={4}
              ml="sm"
              label="Allowed Logout URLs (post_logout_redirect_uris)"
              {...form.getInputProps('post_logout_redirect_uris')}
              inputWrapperOrder={['label', 'input', 'error', 'description']}
              placeholder="https://example.com/auth/signed-out,https://example.dev/auth/post-logout"
              disabled={activeApp.readonly}
            />
            <Text ml="sm" c="dimmed" fw={600} size={'xs'}>
              A set of URLs that are valid to redirect to after logout from OIDC
              Provider. After a user logs out from OIDC you can redirect them
              with the <Code>returnTo</Code> query parameter. The URL that you
              use in <Code>returnTo</Code>
              must be listed here. You can specify multiple valid URLs by
              comma-separating them. You can use the star symbol as a wildcard
              for subdomains (*.mycompany.com). Query strings and hash
              information are not taken into account when validating these URLs.
              Read more about this at:
            </Text>
          </Stack>
        </Group>
        <Group grow align="center" justify="space-around">
          <Button maw={300} onClick={() => handleSubmit()} justify="center">
            Save
          </Button>
        </Group>
        <Divider />
        <Group align="center" justify="center">
          <Text>Advanced Settings</Text>
          <Alert title="Grant Types Enabled">
            {supportedGrantTypes.map((i) => {
              const enabled = selectedGrantTypes.includes(i)
              const disabled =
                activeApp.token_endpoint_auth_method === 'none' &&
                i === 'client_credentials'
              return (
                <Button
                  disabled={disabled}
                  variant={enabled ? 'filled' : 'outline'}
                  size="compact-xs"
                  key={i}
                  onClick={() => handleGrantTypeToggle(i)}
                  m="xs"
                >
                  {i}
                </Button>
              )
            })}
            <Divider />
            <Button
              disabled={!grantTypesDirty}
              m="xs"
              type="submit"
              onClick={() => saveGrantTypes()}
            >
              Save
            </Button>
          </Alert>
        </Group>
      </Stack>
    </Paper>
  )
}
