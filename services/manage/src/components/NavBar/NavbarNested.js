import {
  Group,
  ScrollArea
  // rem
} from '@mantine/core'
import {
  IconAdjustments,
  IconGauge,
  IconLock,
  IconNotes,
  IconPresentationAnalytics,
  IconUser
} from '@tabler/icons-react'
import { LinksGroup } from '../NavbarLinksGroup/NavbarLinksGroup'
import { UserButton } from '../UserButton'
import classes from './NavbarNested.module.css'

const mockdata = [
  { label: 'Activity', icon: IconGauge },
  {
    label: 'Applications',
    icon: IconNotes,
    links: [
      { label: 'APIs', link: '/apis' },
      { label: 'Applications', link: '/apps' }
    ]
  },
  {
    label: 'Authentication',
    icon: IconLock,
    links: [
      { label: 'Database', link: '/authn/db' },
      { label: 'Social', link: '/authn/social' }
    ]
  },
  {
    label: 'User Management',
    icon: IconUser,
    links: [
      { label: 'Users', link: '/users' },
      { label: 'Roles', link: '/authz' }
    ]
  },
  {
    label: 'Branding',
    icon: IconPresentationAnalytics,
    links: [
      { label: 'Customize', link: '/branding/looks' },
      { label: 'Authentication Profile', link: '/branding/profile' }
    ]
  },
  { label: 'Settings', icon: IconAdjustments },
  {
    label: 'Security',
    icon: IconLock,
    links: [
      { label: 'Enable 2FA', link: '/' },
      { label: 'Change password', link: '/' },
      { label: 'Recovery codes', link: '/' }
    ]
  }
]

export function NavbarNested({ active }) {
  const links = mockdata.map((item) => (
    <LinksGroup {...item} key={item.label} activeLink={active} />
  ))

  return (
    <nav className={classes.navbar}>
      {/* <div className={classes.header}>
        <Group justify="space-between">
          <Logo style={{ width: rem(120) }} />
        </Group>
      </div> */}

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>

      <div className={classes.footer}>
        <UserButton />
      </div>
    </nav>
  )
}
