import { Button, Group, Paper, Stack } from '@mantine/core'
import { useContext, useState } from 'react'
import { AuthContext, AuthProvider } from 'react-oauth2-code-pkce'
import { useLoaderData } from 'react-router-dom'
import { userInfo } from '../../api'
const ISSUER = process.env.REACT_APP_ISSUER
const ORIGIN = window.location.origin
const authConfig = {
  clientId: 'tester',
  authorizationEndpoint: `${ISSUER}/auth`,
  tokenEndpoint: `${ISSUER}/token`,
  redirectUri: `${ORIGIN}/tester/callback`,
  scope: ['openid', 'profile', 'email', 'address', 'phone'].join(' '),
  extraAuthParameters: {
    prompt: 'login'
  },
  autoLogin: true,
  decodeToken: false,
  clearURL: true,
  prompt: 'login',
  storageKeyPrefix: '_TESTER_'
}

export function Tester() {
  const { connectionName } = useLoaderData()
  // prevents sending a stringified 'null'
  if (connectionName) {
    authConfig.extraAuthParameters.connection = connectionName
  }
  return (
    <AuthProvider authConfig={authConfig}>
      <IsolatedApp />
    </AuthProvider>
  )
}

function IsolatedApp() {
  const context = useContext(AuthContext)
  const { login, logOut, token } = context
  const [userinfo, setUserinfo] = useState(null)
  const handleGetUserinfo = async () => {
    const ui = await userInfo(token)
    setUserinfo(ui)
  }
  return (
    <Group maw={650}>
      <div>IsolatedContext</div>
      <Stack>
        <Paper maw={650}>
          <div>
            {!context.token ? (
              <Button onClick={login}>Login</Button>
            ) : (
              <>
                <Button onClick={() => logOut()}>Isolated Logout</Button>
                <pre>{JSON.stringify(context, null, 2)}</pre>
              </>
            )}
          </div>
          <div>
            {context.token && (
              <Button onClick={handleGetUserinfo}>Get Userinfo</Button>
            )}
            {context.token && userinfo && (
              <pre>{JSON.stringify(userinfo, null, 2)}</pre>
            )}
          </div>
        </Paper>
      </Stack>
    </Group>
  )
}
