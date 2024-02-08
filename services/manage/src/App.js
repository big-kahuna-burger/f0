import { useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { SelectedUserContext } from './SelectedUser.context'
import Shell from './Shell'
import {
  getApplication,
  getApplications,
  getClientGrantsByClientId,
  getClientGrantsByResourceServerId,
  getConnection,
  getConnections,
  getOidcMetadata,
  getResourceServer,
  getResourceServers
} from './api'
import { Application } from './components/Application'
import { AppServer } from './components/ApplicationServer'
import { AppServers } from './components/ApplicationServers'
import { Applications } from './components/Applications'
import { Connection } from './components/Connection'
import { GoogleEdit } from './components/Connection/GoogleEdit'
import { Tester } from './components/Connection/Tester'
import { Connections } from './components/Connections'
import { SocialConnections } from './components/Connections/Social'
import { NewSocialConnection } from './components/NewSocialConnection'
import { NewGoogle } from './components/NewSocialConnection/NewGoogle'
import { UsersRolesTable } from './components/UserTableWithRoles'
import { UsersTable } from './components/UsersTable'

const children = [
  {
    path: 'tester/callback',
    element: <Tester />,
    loader: async ({ request }) => {
      const searchParams = new URL(request.url).searchParams
      const connectionName = searchParams.get('connection')
      return { connectionName }
    }
  },
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
        const socialConnections = await getConnections({
          page: 0,
          size: 20,
          type: 'social'
        })
        return {
          activeApp,
          tab: params.tab,
          connections,
          socialConnections
        }
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
      if (params.tab === 'apps') {
        const applications = await getApplications({
          page: 0,
          size: 20
        })
        return { connection, applications, tab: 'apps' }
      }
      return { connection, tab: params.tab }
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
    element: <SocialConnections />,
    loader: async ({ params }) => {
      const connections = await getConnections({
        page: 0,
        size: 20,
        type: 'social'
      })
      return { connections }
    }
  },
  {
    path: '/authn/social/google',
    element: <GoogleEdit />,
    loader: async ({ params }) => {
      const connections = await getConnections({
        page: 0,
        size: 20,
        type: 'social'
      })
      return { connection: connections.find((c) => c.strategy === 'GOOGLE') }
    }
  },
  {
    path: '/authn/social/new',
    element: <NewSocialConnection />
  },
  {
    path: '/authn/social/new/google',
    element: <NewGoogle />
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
const routes = [
  {
    root: '*',
    element: <Shell />,
    children
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
