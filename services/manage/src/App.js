import { useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import Shell from './Shell'
import {
  getApplication,
  getApplications,
  getClientGrantsByClientId,
  getClientGrantsByResourceServerId,
  getConnections,
  getOidcMetadata,
  getResourceServer,
  getResourceServers,
  getConnection,
} from './api'
import { Application } from './components/Application'
import { AppServer } from './components/ApplicationServer'
import { AppServers } from './components/ApplicationServers'
import { Applications } from './components/Applications'
import { Connections } from './components/Connections'
import { UsersRolesTable } from './components/UserTableWithRoles'
import { UsersTable } from './components/UsersTable'
import { Connection } from './components/Connection'

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
        loader: async ({ params, request }) => {
          const activeApi = await getResourceServer(params.id)
          const grants = await getClientGrantsByResourceServerId(params.id)
          const searchParams = new URL(request.url).searchParams
          const page = searchParams.get('page')
            ? parseInt(searchParams.get('page'))
            : 1
          const size = searchParams.get('size')
            ? parseInt(searchParams.get('size'))
            : 5
          const { apps, total } = await getApplications({
            page,
            size,
            include: ['client_id', 'client_name', 'logo_uri'],
            grant_types_include: 'client_credentials',
            token_endpoint_auth_method_not: 'none'
          })
          return {
            activeApi,
            grants,
            page,
            applications: apps,
            totalApps: total,
            tab: params.tab
          }
        }
      },
      {
        path: '/app/:id/:tab',
        element: <Application />,
        loader: async ({ params }) => {
          const activeApp = await getApplication(params.id)
          if (params.tab === 'connections') {
            const connections = await getConnections({
              page: 0,
              size: 20,
              type: 'db'
            })
            return { activeApp, tab: params.tab, connections }
          }
          if (params.tab === 'settings') {
            const metadata = await getOidcMetadata()
            return { activeApp, tab: params.tab, metadata }
          }
          if (
            params.tab === 'quick' &&
            activeApp.token_endpoint_auth_method === 'private_key_jwt'
          ) {
            const apis = await getResourceServers()
            const grants = await getClientGrantsByClientId(params.id)
            return { activeApp, tab: params.tab, apis, grants }
          }
          return { activeApp, tab: params.tab }
        }
      },
      {
        path: '/apps',
        loader: async ({ params, request }) => {
          const searchParams = new URL(request.url).searchParams
          const page = searchParams.get('page')
            ? parseInt(searchParams.get('page'))
            : 1
          const size = searchParams.get('size')
            ? parseInt(searchParams.get('size'))
            : 8
          const { apps, total } = await getApplications({ page, size })
          return { apps, total, page, size }
        },
        element: <Applications />
      },
      {
        path: '/authn/db/:id',
        element: <Connection />,
        loader: async ({ params }) => {
          const connection = await getConnection(params.id)
          return { connection }
        }
      },
      {
        path: '/authn/db/:id/:tab',
        element: <Connection />,
        loader: async ({ params }) => {
          const connection = await getConnection(params.id)
          return { connection }
        }
      },
      {
        path: '/authn/db',
        element: <Connections />,
        loader: async ({ params }) => {
          const connections = await getConnections({
            page: 0,
            size: 20,
            type: 'db'
          })
          return { connections }
        }
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
