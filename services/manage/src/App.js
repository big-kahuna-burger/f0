import { useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import Shell from './Shell'
import {
  getApplication,
  getApplicationGrants,
  getApplications,
  getResourceServer,
  getResourceServers
} from './api'
import { Application } from './components/Application'
import { AppServer } from './components/ApplicationServer'
import { AppServers } from './components/ApplicationServers'
import { Applications } from './components/Applications'
import { UsersRolesTable } from './components/UserTableWithRoles'
import { UsersTable } from './components/UsersTable'

const routes = [
  {
    root: '*',
    element: <Shell />,
    children: [
      {
        path: '/',
        element: <></>
      },
      {
        path: '/apis',
        loader: async ({ params }) => {
          const apis = await getResourceServers()
          return { apis }
        },
        element: <AppServers />
      },
      {
        path: '/api/:id/:tab',
        element: <AppServer />,
        loader: async ({ params }) => {
          const activeApi = await getResourceServer(params.id)
          const grants = await getApplicationGrants(params.id)
          const applications = await getApplications({
            page: 0,
            size: 20,
            include: ['client_id', 'client_name'],
            grant_types_include: 'client_credentials',
            token_endpoint_auth_method_not: 'none'
          })
          return { activeApi, grants, applications, tab: params.tab }
        }
      },
      {
        path: '/app/:id/:tab',
        element: <Application />,
        loader: async ({ params }) => {
          const activeApp = await getApplication(params.id)
          return { activeApp, tab: params.tab }
        }
      },
      {
        path: '/apps',
        loader: async ({ params }) => {
          const apps = await getApplications({
            page: 0,
            size: 20
          })
          return { apps }
        },
        element: <Applications />
      },
      {
        path: '/authn/db',
        element: <></>
      },
      {
        path: '/authn/social',
        element: <></>
      },
      {
        path: '/users',
        element: <UsersTable />
      },
      {
        path: '/authz',
        element: <></>
      },
      {
        path: '/branding/looks',
        element: <></>
      },
      {
        path: '/branding/profile',
        element: <UsersRolesTable />
      },
      {
        path: '/cb',
        element: <></>
      }
    ]
  }
]
function App() {
  const router = createBrowserRouter(routes)
  const [user, setUser] = useState({})
  return (
    <SelectedUserContext.Provider value={{ user, setUser }}>
      <RouterProvider router={router} fallbackElement={<div>LOADING...</div>} />
    </SelectedUserContext.Provider>
  )
}

export default App
