import '@mantine/code-highlight/styles.css'
import '@mantine/core/styles.css'
import './index.css'

import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager
} from '@mantine/core'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oauth2-code-pkce'
import App from './App'
import reportWebVitals from './reportWebVitals'
const ISSUER = process.env.REACT_APP_ISSUER
const issUrl = new URL(ISSUER)
const ORIGIN = window.location.origin

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mng-color-scheme'
})

const myColor = [
  '#e7fcf4',
  '#daf2e8',
  '#b9e1d2',
  '#94d0b9',
  '#75c2a3',
  '#60b996',
  '#54b48f',
  '#439e7c',
  '#368d6d',
  '#257b5b'
]
const myAltColor = [
  '#fbf1fb',
  '#ede3eb',
  '#d5c6d4',
  '#bda6bb',
  '#a88ca6',
  '#9c7b99',
  '#967193',
  '#836080',
  '#755473',
  '#684766'
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
    window.confirm('Session expired. Refresh?') && event.login(),
  logoutEndpoint: `${ISSUER}/session/end`,
  // logoutRedirect: `${ORIGIN}/logged-out`,
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
