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
import { IconBrandGoogle } from '@tabler/icons-react'
const scopeMap = {
  openid: {
    default: true,
    required: true
  },
  profile: {
    default: true,
    required: true
  }
}
const requiredScopes = ['openid', 'profile']
export function NewGoogle() {
  const form = useForm({
    initialValues: {
      name: 'google-oauth2',
      clientId: '',
      clientSecret: '',
      scopes: requiredScopes,
      allowedMobileClientIds: '',
      syncAttributes: true
    },

    validate: {}
  })
  const scopeKeys = Object.keys(scopeMap)
  const handleSubmit = async () => {
    await createSocialConnection({
      name: 'google-oauth2',
      strategy: 'google',
      clientId: form.values.clientId,
      clientSecret: form.values.clientSecret,
      scopes: form.values.scopes,
      allowedMobileClientIds: form.values.allowedMobileClientIds,
      syncAttributes: form.values.syncAttributes
    })
  }
  return (
    <Stack align="center">
      <Paper miw={350} maw={850} withBorder p="md">
        <Stack align="center">
          <Text>Configure Google Connection</Text>
          <IconBrandGoogle />
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
                placeholder="google-oauth2"
                description="If you are triggering a login manually, this is the identifier you would use on the connection parameter."
                required
                {...form.getInputProps('name')}
                disabled
              />
              <TextInput
                m="xs"
                label="Client ID"
                placeholder="Enter Client ID"
                description="Your Google Client ID. You can find this in the Google Developer Console."
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
              <TextInput
                m="xs"
                label="Mobile Client IDs"
                placeholder="Enter Mobile Client IDs"
                description="Comma separated list of client IDs that are allowed to use the connection."
                {...form.getInputProps('allowedMobileClientIds')}
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
