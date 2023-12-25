import '@mantine/core/styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oauth2-code-pkce'
import App from './App'
import reportWebVitals from './reportWebVitals'

import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager
} from '@mantine/core'
const ISSUER = process.env.REACT_APP_ISSUER || 'http://localhost:3033'
const ORIGIN = window.location.origin

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mng-color-scheme'
})

const myColor = [
  "#ffecff",
  "#f8d7f8",
  "#eeaded",
  "#e380e1",
  "#da5bd7",
  "#d542d2",
  "#d335d0",
  "#bb28b8",
  "#a71fa5",
  "#921490"
]
const myAltColor = [
  "#e8fcf2",
  "#daf2e7",
  "#b9e1cf",
  "#94d0b5",
  "#75c29e",
  "#60b990",
  "#54b489",
  "#439e76",
  "#378d68",
  "#267b57"
]

const theme = createTheme({
  fontFamily: 'Montserrat, sans-serif',
  defaultRadius: 'md',
  colors: {
    myColor,
    myAltColor
  },
  primaryColor: 'myColor',
  defaultGradient: {
    from: 'purple',
    to: 'green',
    deg: 180
  }
})

const authConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: `${ISSUER}/auth`,
  tokenEndpoint: `${ISSUER}/token`,
  redirectUri: `${ORIGIN}/cb`,
  postLogoutRedirectUri: `${ORIGIN}/`,
  scope: [
    'read:users',
    'write:users',
    'update:users',
    'delete:users',
    'read:apis',
    'write:apis',
    'update:apis',
    'delete:apis',
    'read:client_grants',
    'write:client_grants',
    'update:client_grants',
    'delete:client_grants'
  ].join(' '),
  onRefreshTokenExpire: (event) =>
    window.confirm(
      'Session expired. Refresh page to continue using the site?'
    ) && event.login(),
  logoutEndpoint: `${ISSUER}/session/end`,
  //logoutRedirect: `${ORIGIN}/logged-out`,
  extraTokenParameters: {
    resource: 'http://localhost:9876/manage/v1'
  },
  postLogin: () => {
    window.location.href = `${ORIGIN}/`
  },
  autoLogin: false,
  decodeToken: false,
  clearURL: true
}

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
    >
      <AuthProvider authConfig={authConfig}>
        <App />
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
