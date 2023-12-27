import {
  Card,
  Group,
  Image,
  Text,
  TextInput,
  useMantineTheme
} from '@mantine/core'
import { useState } from 'react'
import classes from './ApplicationLogo.module.css'

const skeletonLogo = `${window.location.origin}/svg/fastify-seeklogo.com.svg`

export function ArticleCard({ logoUrl, onChange = () => {} } = {}) {
  const [url, setUrl] = useState(logoUrl)
  const theme = useMantineTheme()

  return (
    <Card withBorder radius="md" className={classes.card}>
      <Group justify="center" m="sm">
        <Card.Section mah={70}>
          {url ? (
            <img
              src={url}
              style={{ height: 60, maxWidth: 'auto', display: 'inline' }}
              alt="logo-preview"
            />
          ) : (
            <img
              src={skeletonLogo}
              style={{ height: 60, maxWidth: 'auto', display: 'inline' }}
              alt="logo-preview"
            />
          )}
        </Card.Section>
      </Group>
      <TextInput
        className={classes.input}
        placeholder="https://my.app/logo-small.png"
        value={url}
        onChange={(event) => {
          setUrl(event.currentTarget.value)
          onChange(event.currentTarget.value)
        }}
      />
      <Text className={classes.title} fw={500}>
        Application Logo
      </Text>

      <Text fz="sm" c="dimmed" lineClamp={4}>
        Add image that will be visible on all your consent screens.
      </Text>
    </Card>
  )
}