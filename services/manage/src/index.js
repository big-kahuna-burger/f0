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
  '#f6eeff',
  '#e7daf7',
  '#cab1ea',
  '#ad86dd',
  '#9562d2',
  '#854bcb',
  '#7d3ec9',
  '#6b31b2',
  '#5f2aa0',
  '#52228d'
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
  scope: 'openid email profile',
  onRefreshTokenExpire: (event) =>
    window.confirm(
      'Session expired. Refresh page to continue using the site?'
    ) && event.login(),
  //logoutEndpoint: `${ISSUER}/session/end`,
  //logoutRedirect: `${ORIGIN}/logged-out`,
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
