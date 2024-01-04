import '@mantine/code-highlight/styles.css'
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
const ISSUER = process.env.REACT_APP_ISSUER
const issUrl = new URL(ISSUER)
const ORIGIN = window.location.origin

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mng-color-scheme'
})

const myColor = [
  '#f2f0ff',
  '#e0dff2',
  '#bfbdde',
  '#9b98ca',
  '#7d79ba',
  '#6a65b0',
  '#605bac',
  '#504c97',
  '#464388',
  '#3b3979'
]
const myAltColor = [
  '#fdfce5',
  '#f8f6d3',
  '#f0ecaa',
  '#e7e17c',
  '#e0d957',
  '#dbd33e',
  '#d9d02f',
  '#c0b820',
  '#aaa316',
  '#938c03'
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
  clientId: process.env.REACT_APP_DASHBOARD_CLIENT_ID,
  authorizationEndpoint: `${ISSUER}/auth`,
  tokenEndpoint: `${ISSUER}/token`,
  redirectUri: `${ORIGIN}/cb`,
  postLogoutRedirectUri: `${ORIGIN}/cb`,
  scope: [
    'openid',
    'offline_access',
    'address',
    'email',
    'profile',
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
    resource: `${issUrl.origin}/manage/v1`
  },
  postLogin: () => {
    window.location.href = `${ORIGIN}/`
  },
  autoLogin: false,
  decodeToken: false,
  clearURL: true
}

console.log(authConfig)

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  // <React.StrictMode>
  <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
    <AuthProvider authConfig={authConfig}>
      <App />
    </AuthProvider>
  </MantineProvider>
  // </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
