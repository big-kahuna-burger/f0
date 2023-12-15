import { useContext } from 'react'
import { AuthContext } from 'react-oauth2-code-pkce'
import './App.css'

function App() {
  /*
token: string;
    logOut: (state?: string, logoutHint?: string) => void;
    login: (state?: string) => void;
    error: string | null;
    tokenData?: TTokenData;
    idToken?: string;
    idTokenData?: TTokenData;
    loginInProgress: boolean;
*/

  const { token, idToken, login, logOut } = useContext(AuthContext)
  return (
    <div className="App">
      <header className="App-header">
        {token ? (
          <button
            type="button"
            className="button-logout"
            onClick={() => {
              logOut(undefined, idToken)
            }}
          >
            Logout
          </button>
        ) : (
          <button
            type="button"
            className="button-logout"
            onClick={() => login()}
          >
            Login
          </button>
        )}
      </header>
      <UserInfo />
    </div>
  )
}

const UserInfo = () => {
  const { token, idTokenData } = useContext(AuthContext)

  return (
    <>
      <h4>Access Token</h4>
      <pre>{token}</pre>
      <h4>User Information from ID Token JWT</h4>
      <pre>{JSON.stringify(idTokenData, null, 2)}</pre>
    </>
  )
}

export default App
