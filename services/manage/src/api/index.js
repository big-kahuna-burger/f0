export { getUsers }

async function getUsers() {
  const token =
    localStorage.getItem('ROCP_token') ||
    ''.split('"').filter((x) => x.length)[0]
  const usersResponse = await fetch('http://localhost:9876/manage/users', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const usersJson = await usersResponse.json()
  return usersJson.map((u, i) => ({
    ...u,
    name: `${u.profile.given_name} ${u.profile.family_name}`,
    picture: `https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-${
      (i % 10) + 1
    }.png`,
    stats: [
      { value: Math.round(Math.random() * 255), label: 'Logins' },
      { value: '2h ago', label: 'Last Login' },
      { value: '4', label: 'Devices' },
      { value: '2', label: 'IPs' },
      { value: '1.1.1.1', label: 'Last IP' }
    ]
  }))
}
