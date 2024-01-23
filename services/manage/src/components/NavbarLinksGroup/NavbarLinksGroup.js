import {
  Box,
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
  rem
} from '@mantine/core'
import { useMantineColorScheme, useMantineTheme } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'
import classes from './NavbarLinksGroup.module.css'

export function LinksGroup({
  icon: Icon,
  label,
  initiallyOpened,
  links,
  activeLink
}) {
  const colorScheme = useMantineColorScheme()
  const theme = useMantineTheme()
  const hasLinks = Array.isArray(links)
  const [opened, setOpened] = useState(
    initiallyOpened || links?.filter((l) => l.link === activeLink).length > 0
  )
  const items = (hasLinks ? links : []).map((link) => (
    <Text
      component="a"
      className={classes.link}
      href={link.link}
      key={link.label}
      c={
        link.link === activeLink
          ? theme.colors.myAltColor[colorScheme.colorScheme === 'dark' ? 1 : 9]
          : undefined
      }
    >
      {link.label}
    </Text>
  ))

  return (
    <>
      <UnstyledButton
        onClick={() => setOpened((o) => !o)}
        className={classes.control}
      >
        <Group justify="space-between" gap={0}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon
              variant={colorScheme.colorScheme}
              size={38}
              color={theme.colors.myAltColor[3]}
            >
              <Icon style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              style={{
                width: rem(16),
                height: rem(16),
                transform: opened ? 'rotate(-90deg)' : 'none'
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  )
}
