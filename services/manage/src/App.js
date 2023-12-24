import { useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import Shell from './Shell'
import {
  getApplications,
  getApplicationsGrantable,
  getResourceServer,
  getResourceServers
} from './api'
import { AppServer } from './components/ApplicationServer'
import { AppServers } from './components/ApplicationServers'
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
        element:<AppServers />
      },
      {
        path: '/api/:id',
        loader: async ({ params }) => {
          const activeApi = await getResourceServer(params.id)
          const clients = await getApplicationsGrantable(params.id)
          return { activeApi, clients }
        },
        element: <AppServer />
      },
      {
        path: '/apps',
        element: <></>
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
