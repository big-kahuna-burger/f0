import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  IconBrandReact,
  IconDeviceMobile,
  IconExchange,
  IconServerCog
} from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApplication } from '../../api'
import classes from './FeatureCards.module.css'

const mockdata = [
  {
    title: 'Native',
    description:
      'This dust is actually a powerful poison that will even make a pro wrestler sick, Regice cloaks itself with frigid air of -328 degrees Fahrenheit',
    icon: IconDeviceMobile
  },
  {
    title: 'SPA',
    description:
      'People say it can run at the same speed as lightning striking, Its icy body is so cold, it will not melt even if it is immersed in magma',
    icon: IconBrandReact
  },
  {
    title: 'Web',
    description:
      'Trainers who show them off recklessly may be targeted by thieves',
    icon: IconServerCog
  },
  {
    title: 'M2M',
    description:
      'They’re popular, but they’re rare. Trainers who show them off recklessly may be targeted by thieves',
    icon: IconExchange
  }
]

export function FeaturesCards() {
  const navigate = useNavigate()
  const theme = useMantineTheme()
  const [card, setCard] = useState(null)

  const form = useForm({
    initialValues: {
      name: ''
    },
    validate: {
      name: (value) =>
        value.length < 4 ? 'Name must have at least 4 letters' : null
    },
    validateInputOnChange: true
  })

  const handleButton = () => {
    if (form.validate().hasErrors) {
      console.log('errors', form.errors)
      return
    }
    createApplication({ name: form.values.name, type: card }).then(
      ({ client_id }) => {
        navigate(`/app/${client_id}/quick`)
      }
    )
  }

  const features = mockdata.map((feature) => (
    <Card
      key={feature.title}
      shadow="sm"
      radius="md"
      className={classes.card}
      padding="sm"
      c={card === feature.title ? theme.colors.myAltColor[7] : undefined}
      bg={card === feature.title ? theme.colors.myColor[7] : undefined}
      onClick={() => {
        setCard(feature.title)
        form.setFieldValue('selected', feature.title)
      }}
    >
      <feature.icon style={{ width: rem(50), height: rem(50) }} stroke={2} />
      <Text fz="lg" fw={500} className={classes.cardTitle} mt="md">
        {feature.title}
      </Text>
      <Text fz="sm" mt="sm">
        {feature.description}
      </Text>
    </Card>
  ))

  return (
    <Stack mx="auto" pos="relative" align="center">
      <Container size="lg" py="md">
        <Group justify="center">
          <Badge variant="filled" size="lg">
            OIDC APP
          </Badge>
        </Group>

        <Title order={2} className={classes.title} ta="center" mt="sm">
          Integrate effortlessly with any technology stack
        </Title>

        <TextInput
          label="Name"
          placeholder="Name"
          withAsterisk
          size="md"
          p="lg"
          {...form.getInputProps('name')}
        />

        <Text c="dimmed" className={classes.description} ta="center" mt="md">
          Every once in a while, you’ll see a Golbat that’s missing some fangs.
          This happens when hunger drives it to try biting a Steel-type Pokémon.
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt={50}>
          {features}
        </SimpleGrid>
      </Container>
      <Group>
        <Button
          w={250}
          size="md"
          disabled={!card || form.errors.name}
          onClick={(e) => handleButton()}
        >
          Create
        </Button>
      </Group>
    </Stack>
  )
}
