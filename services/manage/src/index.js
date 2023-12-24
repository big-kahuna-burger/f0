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
  "#f7f2f6",
  "#e9e2e8",
  "#d4c3d1",
  "#bfa2ba",
  "#ad85a5",
  "#a27398",
  "#9d6993",
  "#895980",
  "#7a4e72",
  "#6c4264"
]
const myAltColor = [
  '#f6fae8',
  '#edf1da',
  '#dae1b9',
  '#c6d094',
  '#b4c274',
  '#aab95f',
  '#a4b454',
  '#8f9e44',
  '#7e8c39',
  '#6b7a2b'
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
  extraAuthParams: {
    resource: 'http://localhost:9876/manage/v1'
  }, // this is confusing... if they remove the param from auth then what?
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
      defaultColorScheme="dark"
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
