import { CORS_PROP, F0_TYPE_PROP } from '../oidc/client-based-cors/index.js'

export const allowedClientFields = [
  'application_type',
  'client_id',
  'client_name',
  'client_secret',
  'client_uri',
  'contacts',
  'default_acr_values',
  'default_max_age',
  'grant_types',
  'id_token_signed_response_alg',
  'initiate_login_uri',
  'jwks',
  'jwks_uri',
  'logo_uri',
  'policy_uri',
  'post_logout_redirect_uris',
  'redirect_uris',
  'require_auth_time',
  'response_types',
  'scope',
  'sector_identifier_uri',
  'subject_type',
  'token_endpoint_auth_method',
  'tos_uri',
  'userinfo_signed_response_alg',
  'authorization_encrypted_response_alg',
  'authorization_encrypted_response_enc',
  'authorization_signed_response_alg',
  'backchannel_logout_session_required',
  'backchannel_logout_uri',
  'id_token_encrypted_response_alg',
  'id_token_encrypted_response_enc',
  'introspection_encrypted_response_alg',
  'introspection_encrypted_response_enc',
  'introspection_signed_response_alg',
  'request_object_encryption_alg',
  'request_object_encryption_enc',
  'request_object_signing_alg',
  'request_uris',
  'tls_client_auth_san_dns',
  'tls_client_auth_san_email',
  'tls_client_auth_san_ip',
  'tls_client_auth_san_uri',
  'tls_client_auth_subject_dn',
  'tls_client_certificate_bound_access_tokens',
  'token_endpoint_auth_signing_alg',
  'userinfo_encrypted_response_alg',
  'userinfo_encrypted_response_enc',
  'web_message_uris',
  F0_TYPE_PROP,
  CORS_PROP,
  'updatedAt',
  'readonly'
]

export const DEFAULT_CLIENT_INCLUDE = [
  'client_id',
  'client_name',
  'client_secret',
  'application_type',
  'client_uri',
  'initiate_login_uri',
  'logo_uri',
  'grant_types',
  'token_endpoint_auth_method',
  'redirect_uris',
  'post_logout_redirect_uris',
  'initiate_login_uri',
  'urn:f0:type',
  'updatedAt',
  'readonly'
]
