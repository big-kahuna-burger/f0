# A Auth0 (micro) copy

## Requirements

- Node 18/20
- Docker

## Install

Clone repo, cd to it:

#### Env

Add env files:

##### OP ENV (fastify server)
```sh
cat <<EOT > services/idp/.env
# IDP Environment Variables
ISSUER=http://localhost:9876/oidc
POSTGRES_PRISMA_URL='postgres://postgres:secret123@localhost:5432/idp'
POSTGRES_URL_NON_POOLING='postgres://postgres:secret123@localhost:5432/idp'
GRANTS_DEBUG=1
DEBUG=oidc:events:*
DASHBOARD_CLIENT_ID=
EOT
```


##### Manage ENV (React SPA)
```sh
cat <<EOT > services/manage/.env
# React App Environment Variables
PORT=3036
REACT_APP_ISSUER=http://localhost:9876/oidc
# Later
DASHBOARD_CLIENT_ID=
EOT
```


# Run installation for services/idp

Daemonize postgres and jaeger on docker

```sh
cd services/idp && docker compose up -d
```

Install deps: it will run client generation and db migrations as well

```sh
npm i
```

#### initialize 

Makes those default/readonly objects for bootstrapping:
- `Management API` ResourceServer
- `Dashboard` OidcClient
- Default `Admin Connection`
- Enables `Dashboard` OidcClient with a `Admin Connection`
```sh
npm run init
```

After initialization, output will give a client id that needs to be added to env vars

Script that needs user interaction and let's you create account. (TODO, ask for claims other than email/password)
```sh
npm run create-account
```

```sh
npm start
```

Visit well known url: http://localhost:9876/oidc/.well-known/openid-configuration
Visit jwks: http://localhost:9876/oidc/jwks

# Run installation for services/manage
```sh
cd ../manage && npm i
```

```sh
npm start
```

Visit management app: http://localhost:3036/