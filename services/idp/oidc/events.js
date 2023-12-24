import debug from 'debug'
export default subscribe

// How to use this file
// Start server with DEBUG=oidc:event:*
// or individually DEBUG=oidc:event:access_token.destroyed
// or for all events of a type DEBUG=oidc:event:access_token.*
// or for couple of events DEBUG=oidc:event:access_token.destroyed,oidc:event:access_token.saved
// or for groups of events DEBUG=oidc:event:interaction.*,oidc:event:authorization.*

function subscribe(provider) {
	const eventHandlers = [
		['access_token.destroyed', onAccessTokenDestroyed],
		['access_token.saved', onAccessTokenSaved],
		['access_token.issued', onAccessTokenIssued],
		['authorization_code.consumed', onAuthorizationCodeConsumed],
		['authorization_code.destroyed', onAuthorizationCodeDestroyed],
		['authorization_code.saved', onAuthorizationCodeSaved],
		['authorization.accepted', onAuthorizationAccepted],
		['authorization.error', onAuthorizationError],
		['authorization.success', onAuthorizationSuccess],
		['backchannel.error', onBackchannelError],
		['backchannel.success', onBackchannelSuccess],
		['jwks.error', onJwksError],
		['client_credentials.destroyed', onClientCredentialsDestroyed],
		['client_credentials.saved', onClientCredentialsSaved],
		['client_credentials.issued', onClientCredentialsIssued],
		['device_code.consumed', onDeviceCodeConsumed],
		['device_code.destroyed', onDeviceCodeDestroyed],
		['device_code.saved', onDeviceCodeSaved],
		['discovery.error', onDiscoveryError],
		['end_session.error', onEndSessionError],
		['end_session.success', onEndSessionSuccess],
		['grant.error', onGrantError],
		['grant.revoked', onGrantRevoked],
		['grant.success', onGrantSuccess],
		['initial_access_token.destroyed', onInitialAccessTokenDestroyed],
		['initial_access_token.saved', onInitialAccessTokenSaved],
		['interaction.destroyed', onInteractionDestroyed],
		['interaction.ended', onInteractionEnded],
		['interaction.saved', onInteractionSaved],
		['interaction.started', onInteractionStarted],
		['introspection.error', onIntrospectionError],
		['replay_detection.destroyed', onReplayDetectionDestroyed],
		['replay_detection.saved', onReplayDetectionSaved],
		['pushed_authorization_request.error', onPushedAuthorizationRequestError],
		['pushed_authorization_request.success', onPushedAuthorizationRequestSuccess],
		['pushed_authorization_request.destroyed', onPushedAuthorizationRequestDestroyed],
		['pushed_authorization_request.saved', onPushedAuthorizationRequestSaved],
		['refresh_token.consumed', onRefreshTokenConsumed],
		['refresh_token.destroyed', onRefreshTokenDestroyed],
		['refresh_token.saved', onRefreshTokenSaved],
		['registration_access_token.destroyed', onRegistrationAccessTokenDestroyed],
		['registration_access_token.saved', onRegistrationAccessTokenSaved],
		['registration_create.error', onRegistrationCreateError],
		['registration_create.success', onRegistrationCreateSuccess],
		['registration_delete.error', onRegistrationDeleteError],
		['registration_delete.success', onRegistrationDeleteSuccess],
		['registration_read.error', onRegistrationReadError],
		['registration_update.error', onRegistrationUpdateError],
		['registration_update.success', onRegistrationUpdateSuccess],
		['revocation.error', onRevocationError],
		['server_error', onServerError],
		['session.destroyed', onSessionDestroyed],
		['session.saved', onSessionSaved],
		['userinfo.error', onUserinfoError]
	]

	eventHandlers.map(([event, handler]) => {
		const eventLocalDebug = debug(`oidc:event:${event}`)
		provider.on(event, (...args) => {
			eventLocalDebug(handler.name, ...args)
			handler(...args)
		})
	})
}

/**
 * Triggered whenever an access token is destroyed.
 *
 * @param {string} token - The access token that was destroyed.
 */
function onAccessTokenDestroyed(token) {}

/**
 * Callback function called when an access token is saved.
 *
 * @param {string} token - The access token.
 */
function onAccessTokenSaved(token) {}

/**
 * Handles the event when an access token is issued.
 *
 * @param {string} token - The issued access token.
 */
function onAccessTokenIssued(token) {}

/**
 * Handles whenever an authorization code is consumed.
 *
 * @param {string} code - The authorization code to be consumed.
 */
function onAuthorizationCodeConsumed(code) {}

/**
 * Handles the event when an authorization code is destroyed.
 *
 * @param {string} code - The authorization code that is destroyed.
 */
function onAuthorizationCodeDestroyed(code) {}

/**
 * Handles the event whenever an authorization code is saved
 *
 * @param {string} code - The authorization code.
 */
function onAuthorizationCodeSaved(code) {}

/**
 * with every syntactically correct authorization request pending resolving.
 *
 * @param {Object} ctx - The context object.
 */
function onAuthorizationAccepted(ctx) {}

/**
 * @event authorization.error
 * @description Triggered whenever a handled error is encountered at the authorization_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */

function onAuthorizationError(ctx, error) {}

/**
 * @event authorization.success
 * @description Triggered with every successfully completed authorization request.
 * @param {Object} ctx - The context object.
 */
function onAuthorizationSuccess(ctx) {}

/**
 * @event backchannel.error
 * @description Triggered whenever an error is encountered for a client during backchannel-logout.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 * @param {Object} client - The client object.
 * @param {string} accountId - The account ID.
 * @param {string} sid - The session ID.
 */
function onBackchannelError(ctx, error, client, accountId, sid) {}

/**
 * @event backchannel.success
 * @description Triggered whenever a client is successfully notified about logout through backchannel-logout features.
 * @param {Object} ctx - The context object.
 * @param {Object} client - The client object.
 * @param {string} accountId - The account ID.
 * @param {string} sid - The session ID.
 */
function onBackchannelSuccess(ctx, client, accountId, sid) {}

/**
 * @event jwks.error
 * @description Triggered whenever a handled error is encountered at the jwks_uri.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onJwksError(ctx, error) {}

/**
 * @event client_credentials.destroyed
 * @description Triggered whenever a client credentials token is destroyed.
 * @param {Object} token - The destroyed client credentials token.
 */
function onClientCredentialsDestroyed(token) {}

/**
 * @event client_credentials.saved
 * @description Triggered whenever an opaque client credentials token is saved.
 * @param {Object} token - The saved client credentials token.
 */
function onClientCredentialsSaved(token) {}

/**
 * @event client_credentials.issued
 * @description Triggered whenever a structured client credentials token is issued.
 * @param {Object} token - The issued client credentials token.
 */
function onClientCredentialsIssued(token) {}

/**
 * @event device_code.consumed
 * @description Triggered whenever a device code is consumed.
 * @param {Object} code - The consumed device code.
 */
function onDeviceCodeConsumed(code) {}

/**
 * @event device_code.destroyed
 * @description Triggered whenever a device code is destroyed.
 * @param {Object} code - The destroyed device code.
 */
function onDeviceCodeDestroyed(code) {}

/**
 * @event device_code.saved
 * @description Triggered whenever a device code is saved.
 * @param {Object} code - The saved device code.
 */
function onDeviceCodeSaved(code) {}

/**
 * @event discovery.error
 * @description Triggered whenever a handled error is encountered at the /.well-known/openid-configuration endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onDiscoveryError(ctx, error) {}

/**
 * @event end_session.error
 * @description Triggered whenever a handled error is encountered at the end_session endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onEndSessionError(ctx, error) {}

/**
 * @event end_session.success
 * @description Triggered with every successful end session request.
 * @param {Object} ctx - The context object.
 */
function onEndSessionSuccess(ctx) {}

/**
 * @event grant.error
 * @description Triggered whenever a handled error is encountered at the token_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onGrantError(ctx, error) {}

/**
 * @event grant.revoked
 * @description Triggered whenever tokens resulting from a single grant are about to be revoked.
 * @param {Object} ctx - The context object.
 * @param {string} grantId - The grant ID.
 */
function onGrantRevoked(ctx, grantId) {}
/**
 * @event grant.success
 * @description Triggered with every successful grant request.
 * @param {Object} ctx - The context object.
 */
function onGrantSuccess(ctx) {}

/**
 * @event initial_access_token.destroyed
 * @description Triggered whenever an initial access token is destroyed.
 * @param {Object} token - The destroyed initial access token.
 */
function onInitialAccessTokenDestroyed(token) {}

/**
 * @event initial_access_token.saved
 * @description Triggered whenever an initial access token is saved.
 * @param {Object} token - The saved initial access token.
 */
function onInitialAccessTokenSaved(token) {}

/**
 * @event interaction.destroyed
 * @description Triggered whenever an interaction session is destroyed.
 * @param {Object} interaction - The destroyed interaction session.
 */

function onInteractionDestroyed(interaction) {}
/**
 * @event interaction.ended
 * @description Triggered whenever an interaction has been resolved and the authorization request continues being processed.
 * @param {Object} ctx - The context object.
 */

function onInteractionEnded(ctx) {}
/**
 * @event interaction.saved
 * @description Triggered whenever an interaction session is saved.
 * @param {Object} interaction - The saved interaction session.
 */

function onInteractionSaved(interaction) {}
/**
 * @event interaction.started
 * @description Triggered whenever an interaction is being requested from the end-user.
 * @param {Object} ctx - The context object.
 * @param {string} prompt - The interaction prompt.
 */

function onInteractionStarted(ctx, prompt) {}
/**
 * @event introspection.error
 * @description Triggered whenever a handled error is encountered at the introspection_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */

function onIntrospectionError(ctx, error) {}
/**
 * @event replay_detection.destroyed
 * @description Triggered whenever a replay detection object is destroyed.
 * @param {Object} token - The destroyed replay detection object.
 */

function onReplayDetectionDestroyed(token) {}
/**
 * @event replay_detection.saved
 * @description Triggered whenever a replay detection object is saved.
 * @param {Object} token - The saved replay detection object.
 */

function onReplayDetectionSaved(token) {}
/**
 * @event pushed_authorization_request.error
 * @description Triggered whenever a handled error is encountered in the POST pushed_authorization_request endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */

function onPushedAuthorizationRequestError(ctx, error) {}
/**
 * @event pushed_authorization_request.success
 * @description Triggered with every successful request object endpoint response.
 * @param {Object} ctx - The context object.
 * @param {Object} client - The client object.
 */

function onPushedAuthorizationRequestSuccess(ctx, client) {}
/**
 * @event pushed_authorization_request.destroyed
 * @description Triggered whenever a pushed authorization request object is destroyed.
 * @param {Object} token - The destroyed pushed authorization request object.
 */

function onPushedAuthorizationRequestDestroyed(token) {}
/**
 * @event pushed_authorization_request.saved
 * @description Triggered whenever a pushed authorization request object is saved.
 * @param {Object} token - The saved pushed authorization request object.
 */

function onPushedAuthorizationRequestSaved(token) {}
/**
 * @event refresh_token.consumed
 * @description Triggered whenever a refresh token is consumed.
 * @param {Object} token - The consumed refresh token.
 */

function onRefreshTokenConsumed(token) {}
/**
 * @event refresh_token.destroyed
 * @description Triggered whenever a refresh token is destroyed.
 * @param {Object} token - The destroyed refresh token.
 */

function onRefreshTokenDestroyed(token) {}
/**
 * @event refresh_token.saved
 * @description Triggered whenever a refresh token is saved.
 * @param {Object} token - The saved refresh token.
 */

function onRefreshTokenSaved(token) {}
/**
 * @event registration_access_token.destroyed
 * @description Triggered whenever a registration access token is destroyed.
 * @param {Object} token - The destroyed registration access token.
 */

function onRegistrationAccessTokenDestroyed(token) {}
/**
 * @event registration_access_token.saved
 * @description Triggered whenever a registration access token is saved.
 * @param {Object} token - The saved registration access token.
 */

function onRegistrationAccessTokenSaved(token) {}
/**
 * @event registration_create.error
 * @description Triggered whenever a handled error is encountered in the POST registration_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onRegistrationCreateError(ctx, error) {}

/**
 * @event registration_create.success
 * @description Triggered with every successful client registration request.
 * @param {Object} ctx - The context object.
 * @param {Object} client - The client object.
 */
function onRegistrationCreateSuccess(ctx, client) {}

/**
 * @event registration_delete.error
 * @description Triggered whenever a handled error is encountered in the DELETE registration_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */

function onRegistrationDeleteError(ctx, error) {}

/**
 * @event registration_delete.success
 * @description Triggered with every successful delete client registration request.
 * @param {Object} ctx - The context object.
 * @param {Object} client - The client object.
 */
function onRegistrationDeleteSuccess(ctx, client) {}

/**
 * @event registration_read.error
 * @description Triggered whenever a handled error is encountered in the GET registration_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onRegistrationReadError(ctx, error) {}

/**
 * @event registration_update.error
 * @description Triggered whenever a handled error is encountered in the PUT registration_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onRegistrationUpdateError(ctx, error) {}

/**
 * @event registration_update.success
 * @description Triggered with every successful update client registration request.
 * @param {Object} ctx - The context object.
 * @param {Object} client - The client object.
 */
function onRegistrationUpdateSuccess(ctx, client) {}

/**
 * @event revocation.error
 * @description Triggered whenever a handled error is encountered at the revocation_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onRevocationError(ctx, error) {}

/**
 * @event server_error
 * @description Triggered whenever an exception is thrown or promise rejected from either the Provider or your provided adapters. If it comes from the library you should probably report it.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onServerError(ctx, error) {}

/**
 * @event session.destroyed
 * @description Triggered whenever a session is destroyed.
 * @param {Object} session - The destroyed session.
 */
function onSessionDestroyed(session) {}

/**
 * @event session.saved
 * @description Triggered whenever a session is saved.
 * @param {Object} session - The saved session.
 */
function onSessionSaved(session) {}

/**
 * @event userinfo.error
 * @description Triggered whenever a handled error is encountered at the userinfo_endpoint.
 * @param {Object} ctx - The context object.
 * @param {Error} error - The encountered error.
 */
function onUserinfoError(ctx, error) {}
