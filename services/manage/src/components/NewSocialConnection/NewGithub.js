import {
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
  rem,
  SimpleGrid,
  Divider
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { createSocialConnection } from '../../api'
import { IconBrandGithub, IconInfoCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

const attributes = {
  user: 'Basic Profile',
  'user:email': 'Email Address'
}

const scopeMap = {
  'read:user':
    'Grants read access to profile info only. Note that this scope includes user:email and user:follow.',
  'user:follow': 'Grants access to follow or unfollow other users.',
  public_repo:
    'Grants read/write access to code, commit statuses, and deployment statuses for public repositories and organizations.',
  repo: 'Grants read/write access to code, commit statuses, and deployment statuses for public and private repositories and organizations.',
  repo_deployment:
    'Grants access to deployment statuses for public and private repositories. This scope is only necessary to grant other users or services access to deployment statuses, without granting access to the code.',
  'repo:status':
    'Grants read/write access to public and private repository commit statuses. This scope is only necessary to grant other users or services access to private repository commit statuses without granting access to the code.',
  delete_repo: 'Grants access to delete adminable repositories.',
  notifications:
    'Grants read access to a user’s notifications. repo also provides this access.',
  gist: 'Grants write access to gists.',
  'read:repo_hook':
    'Grants read and ping access to hooks in public or private repositories.',
  'write:repo_hook':
    'Grants read, write, and ping access to hooks in public or private repositories.',
  'admin:repo_hook':
    'Grants read, write, ping, and delete access to hooks in public or private repositories.',
  'read:org': 'Read-only access to organization, teams, and membership.',
  'write:org': 'Publicize and unpublicize organization membership.',
  'admin:org': 'Fully manage organization, teams, and memberships.',
  'read:public_key': 'List and view details for public keys.',
  'write:public_key': 'Create, list, and view details for public keys.',
  'admin:public_key': 'Fully manage public keys.'
}
const requiredScopes = ['openid']

export function NewGithub() {
  const navigate = useNavigate()
  const form = useForm({
    initialValues: {
      name: 'github',
      clientId: '',
      clientSecret: '',
      scopes: requiredScopes,
      syncAttributes: true
    },
    validate: {}
  })

  const scopeKeys = Object.keys(scopeMap)
  const handleScopeChange = (checked, scope) => {
    if (checked) {
      form.setFieldValue('scopes', [...form.values.scopes, scope])
    } else {
      form.setFieldValue(
        'scopes',
        form.values.scopes.filter((s) => s !== scope)
      )
    }
  }
  const handleSubmit = async () => {
    await createSocialConnection({
      name: 'github',
      strategy: 'github',
      clientId: form.values.clientId,
      clientSecret: form.values.clientSecret,
      scopes: form.values.scopes,
      syncAttributes: form.values.syncAttributes
    })
    navigate('/authn/social')
  }
  return (
    <Stack align="center">
      <Paper miw={350} maw={850} withBorder p="md">
        <Stack align="center">
          <Text size="xl">Configure Github Connection</Text>
          <IconBrandGithub style={{ width: rem(40), height: rem(40) }} />
        </Stack>
        <Group justify="space-between" p="lg">
          <Group miw={150}>
            <Text>General</Text>
          </Group>
          <Paper maw={450} p="md">
            <form onSubmit={(e) => console.log(e)}>
              <TextInput
                m="xs"
                label="Name"
                placeholder="github"
                description="If you are triggering a login manually, this is the identifier you would use on the connection parameter."
                required
                {...form.getInputProps('name')}
                disabled
              />
              <TextInput
                m="xs"
                label="Client ID"
                placeholder="Enter Client ID"
                description="Your Github Client ID. You can find this in the Github Settings under 'OAuth Apps'."
                required
                {...form.getInputProps('clientId')}
              />
              <TextInput
                m="xs"
                label="Client Secret"
                placeholder="Enter Client Secret"
                description="For security purposes, we don’t show your existing Client Secret."
                required
                {...form.getInputProps('clientSecret')}
              />
              <Divider m="md" />
              <Text>Attributes</Text>
              <SimpleGrid cols={2} verticalSpacing="xs">
                {Object.keys(attributes).map((key) => (
                  <Group>
                    <Checkbox
                      m="xs"
                      size="xs"
                      checked={form.values.scopes.includes(key)}
                      value={key}
                      label={attributes[key]}
                      disabled={requiredScopes.includes(key)}
                      onChange={(event) => {
                        handleScopeChange(event.currentTarget.checked, key)
                      }}
                    />
                    <Tooltip
                      label={
                        attributes[key] === 'Basic Profile'
                          ? 'First name, last name, and photo'
                          : 'Read Users Email Address'
                      }
                      multiline
                      w={220}
                      withArrow
                      arrowSize={8}
                    >
                      <IconInfoCircle
                        style={{ width: rem(18), height: rem(18) }}
                      />
                    </Tooltip>
                  </Group>
                ))}
              </SimpleGrid>
              <Divider m="md" />
              <Text>Permissions</Text>
              <SimpleGrid cols={2} verticalSpacing="xs">
                {scopeKeys.map((key) => (
                  <Group>
                    <Checkbox
                      size="xs"
                      m="xs"
                      key={key}
                      checked={form.values.scopes.includes(key)}
                      value={key}
                      label={key}
                      disabled={scopeMap[key].required}
                      onChange={(event) => {
                        handleScopeChange(event.currentTarget.checked, key)
                      }}
                    />
                    <Tooltip
                      label={scopeMap[key]}
                      multiline
                      w={220}
                      withArrow
                      arrowSize={8}
                    >
                      <IconInfoCircle
                        style={{ width: rem(18), height: rem(18) }}
                      />
                    </Tooltip>
                    {scopeMap[key].required && (
                      <Badge variant="outline">Required</Badge>
                    )}
                  </Group>
                ))}
              </SimpleGrid>
            </form>
          </Paper>
        </Group>
        <Divider />
        <Group justify="space-between" p="lg">
          <Group miw={250}>Advanced</Group>
          <Switch
            labelPosition="left"
            label="Sync Attributes on every login"
            checked={form.values.syncAttributes}
            {...form.getInputProps('syncAttributes')}
          />
        </Group>
        <Group justify="center" mt={'md'} p="lg">
          <Button onClick={() => handleSubmit()}>Create</Button>
        </Group>
      </Paper>
    </Stack>
  )
}
