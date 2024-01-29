const { DASHBOARD_ORIGIN } = process.env

const TESTER = {
  client_id: 'tester',
  client_name: 'All Applications',
  redirect_uris: [`${DASHBOARD_ORIGIN}/tester/callback`],
  token_endpoint_auth_method: 'none',
  grant_types: ['authorization_code', 'refresh_token'],
  'urn:f0:type': 'spa',
  'urn:f0:ACO': [DASHBOARD_ORIGIN]
}

export default TESTER
