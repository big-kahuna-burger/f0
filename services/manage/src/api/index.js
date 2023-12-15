export { getUsers }

async function getUsers() {
  console.log(
    localStorage
      .getItem('ROCP_token')
      .split('"')
      .filter((x) => x.length)[0]
  )
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return [
    {
      avatar:
        'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png',
      name: 'Robert Wolfkisser',
      job: 'Engineer',
      email: 'rob_wolf@gmail.com',
      phone: '+44 (452) 886 09 12'
    },
    {
      avatar:
        'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png',
      name: 'Jill Jailbreaker',
      job: 'Engineer',
      email: 'jj@breaker.com',
      phone: '+44 (934) 777 12 76'
    },
    {
      avatar:
        'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png',
      name: 'Henry Silkeater',
      job: 'Designer',
      email: 'henry@silkeater.io',
      phone: '+44 (901) 384 88 34'
    },
    {
      avatar:
        'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-3.png',
      name: 'Bill Horsefighter',
      job: 'Designer',
      email: 'bhorsefighter@gmail.com',
      phone: '+44 (667) 341 45 22'
    },
    {
      avatar:
        'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-10.png',
      name: 'Jeremy Footviewer',
      job: 'Manager',
      email: 'jeremy@foot.dev',
      phone: '+44 (881) 245 65 65'
    }
  ].map((u) => ({
    ...u,
    stats: [
      { value: Math.round(Math.random() * 255), label: 'Logins' },
      { value: '2h ago', label: 'Last Login' },
      { value: '4', label: 'Devices' },
      { value: '2', label: 'IPs' },
      { value: '1.1.1.1', label: 'Last IP' }
    ]
  }))
}
