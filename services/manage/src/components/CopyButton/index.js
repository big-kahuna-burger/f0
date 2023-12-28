import {
  ActionIcon,
  CopyButton as MantineCopyButton,
  Tooltip,
  rem
} from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

export const CopyButton = ({ value, timeout = 2000 }) => {
  return (
    <MantineCopyButton value={value} timeout={timeout}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon
            color={copied ? 'teal' : 'gray'}
            variant="subtle"
            onClick={copy}
            maw={37}
          >
            {copied ? (
              <IconCheck style={{ width: rem(18) }} />
            ) : (
              <IconCopy style={{ width: rem(18) }} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </MantineCopyButton>
  )
}
