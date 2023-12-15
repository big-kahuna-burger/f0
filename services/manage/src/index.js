import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oauth2-code-pkce'
import App from './App'
import './index.css'
import reportWebVitals from './reportWebVitals'

const authConfig = {
  clientId: 'myClientID',
  authorizationEndpoint: 'http://localhost:9876/oidc/auth',
  tokenEndpoint: 'http://localhost:9876/oidc/token',
  redirectUri: 'http://localhost:3036/cb',
  postLogoutRedirectUri: 'http://localhost:3036/',
  scope: 'openid email profile',
  onRefreshTokenExpire: (event) =>
    window.confirm(
      'Session expired. Refresh page to continue using the site?'
    ) && event.login(),
  logoutEndpoint: 'http://localhost:9876/oidc/session/end',
  logoutRedirect: 'http://localhost:3036/logged-out',
  autoLogin: true
}

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <AuthProvider authConfig={authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
