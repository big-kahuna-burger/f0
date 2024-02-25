import {
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { createSocialConnection } from '../../api'
import { IconBrandGithub } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

const scopeMap = {}
const requiredScopes = []

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
          <Text>Configure Github Connection</Text>
          <IconBrandGithub />
        </Stack>
        <Group justify="space-between" p="lg">
          <Group miw={250}>
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
                description="Your Github Client ID. You can find this in the Github Settings under 'Github Apps' / 'OAuth Apps'."
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
              {scopeKeys.map((key) => (
                <Group>
                  <Checkbox
                    m="xs"
                    key={key}
                    checked={form.values.scopes.includes(key)}
                    value={key}
                    label={key}
                    disabled={scopeMap[key].required}
                  />
                  {scopeMap[key].required && (
                    <Badge variant="outline">Required</Badge>
                  )}
                </Group>
              ))}
            </form>
          </Paper>
        </Group>
        <hr />
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
