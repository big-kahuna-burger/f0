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
import { useEffect, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { updateSocialConnection } from '../../api'
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

export function GoogleEdit() {
  const { connection } = useLoaderData()
  const navigate = useNavigate()
  const [syncAttributes, setSyncAttributes] = useState(
    connection.connectionConfig.syncAttributes
  )
  const [updateDone, setUpdateDone] = useState(false)
  useEffect(() => {
    if (syncAttributes !== connection.connectionConfig.syncAttributes) {
      updateSocialConnection(connection.id, { syncAttributes }).then(() =>
        navigate(`/authn/social/${connection.strategy.toLowerCase()}`)
      )
    }
  }, [connection, syncAttributes, navigate])
  const form = useForm({
    initialValues: {
      name: 'google-oauth2',
      clientId: connection.connectionConfig.clientId,
      clientSecret: undefined,
      scopes: connection.connectionConfig.scopes,
      allowedMobileClientIds: connection.connectionConfig.allowedMobileClientIds
    },
    validate: {
      clientId: (value) => {
        if (!value?.length) {
          return 'Client ID is required'
        }
      },
      clientSecret: (value) => {
        if (!value?.length) {
          return 'Client Secret is required'
        }
      }
    }
  })
  const scopeKeys = Object.keys(scopeMap)
  const handleSubmit = async () => {
    if (!form.isDirty()) {
      return
    }
    const toPatch = {}
    if (form.values.clientId !== connection.connectionConfig.clientId) {
      toPatch.clientId = form.values.clientId
    }
    if (form.values.clientSecret !== connection.connectionConfig.clientSecret) {
      toPatch.clientSecret = form.values.clientSecret
    }
    if (
      form.values.scopes.sort().join(' ') !==
      connection.connectionConfig.scopes.sort().join(' ')
    ) {
      toPatch.scopes = form.values.scopes
    }
    if (
      form.values.allowedMobileClientIds !==
      connection.connectionConfig.allowedMobileClientIds
    ) {
      toPatch.allowedMobileClientIds = form.values.allowedMobileClientIds
    }
    await updateSocialConnection(connection.id, toPatch)
    setUpdateDone(true)
    setTimeout(() => {
      navigate('/authn/social')
    }, 1500)
  }
  return (
    <Stack align="center">
      <Paper miw={350} maw={850} withBorder p="md">
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
                <Group key={key}>
                  <Checkbox
                    m="xs"
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
            checked={syncAttributes}
            onChange={(e) => setSyncAttributes(e.target.checked)}
          />
        </Group>
        <Group justify="center" mt={'md'} p="lg">
          <Button onClick={() => handleSubmit()}>
            {updateDone ? 'Done ' : 'Update'}
          </Button>
        </Group>
      </Paper>
    </Stack>
  )
}
