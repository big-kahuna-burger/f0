import {
  Container,
  Image,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import classes from './FeaturesImages.module.css'
import IMAGES from './images'

const data = [
  {
    image: 'google',
    title: 'Google',
    description: 'Allows Users to Login with their Google Account' //
  },
  {
    image: 'github',
    title: 'Github',
    description: 'Allows Users to Login with their Github Account' //
  },
  {
    image: 'apple',
    title: 'Apple',
    description: 'Allows Users to Login with their Apple Account' //
  },
  {
    image: 'microsoft',
    title: 'Microsoft',
    description: 'Allows Users to Login with their Microsoft Account' //
  }
]

export function NewSocialConnection() {
  const navigate = useNavigate()
  const handleCreate = (image) => {
    navigate(`/authn/social/new/${image}`)
  }
  const items = data.map((item) => (
    <Paper
      withBorder
      p={'md'}
      radius="sm"
      onClick={() => handleCreate(item.image)}
    >
      <div className={classes.item} key={item.image}>
        <ThemeIcon
          variant="light"
          className={classes.itemIcon}
          size={60}
          radius="md"
        >
          <Image src={IMAGES[item.image]} />
        </ThemeIcon>

        <div>
          <Text fw={700} className={classes.itemTitle}>
            {item.title}
          </Text>
          <Text fz={'xs'} c="dimmed">
            {item.description}
          </Text>
        </div>
      </div>
    </Paper>
  ))

  return (
    <Container size={700} className={classes.wrapper}>
      <Text className={classes.supTitle}>New Connection</Text>

      <Title className={classes.title} order={2}>
        Create a <span className={classes.highlight}>new</span> social
        connection
      </Title>

      <Container size={660} p={0}>
        <Text c="dimmed" className={classes.description}>
          You can enable your users trough social connections, bellow are
          supported integrations
        </Text>
      </Container>

      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={50} mt={30}>
        {items}
      </SimpleGrid>
    </Container>
  )
}
