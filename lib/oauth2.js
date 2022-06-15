/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {httpClient} from '@digitalbazaar/http-client';
import {agent} from './constants.js';

export async function constructOAuthHeader({
  clientId,
  clientSecret,
  tokenAudience,
  tokenEndpoint
}) {
  const client_secret = process.env[clientSecret];
  if(!client_secret) {
    console.warn(`Env variable ${clientSecret} not set.`);
    return;
  }
  const {accessToken} = await _getNewAccessToken({
    client_id: clientId,
    client_secret,
    token_endpoint: tokenEndpoint,
    audience: tokenAudience,
    grant_type: 'client_credentials'
  });
  return `Bearer ${accessToken}`;
}

/**
 * Gets a new access token from the provided URL.
 *
 * @param {object} options - Options to use.
 * @param {string} options.client_id - The ID of the client.
 * @param {string} options.client_secret - The client secret.
 * @param {string} options.token_endpoint - The URL to call.
 * @param {string} options.grant_type - The grant type.
 * @param {number} options.maxRetries - The maximum number of times to retry
 *  the request.
 * @param {string} options.audience - The URL of resource server.
 *
 * @returns {object} The access token.
 */
async function _getNewAccessToken({
  client_id, client_secret, token_endpoint, grant_type, audience,
  maxRetries = 3
}) {
  // FIXME other implementations appear to post json
  const body = new URLSearchParams({
    client_id, client_secret, grant_type
  });

  for(; maxRetries >= 0; --maxRetries) {
    const access_token = await _requestAccessToken(
      {url: token_endpoint, body});
    if(access_token) {
      return {accessToken: access_token};
    }
  }
  throw new Error(
    `Service Unavailable: Could not renew token for ${audience}.`);
}

async function _requestAccessToken({url, body}) {
  let data;
  try {
    ({data} = await httpClient.post(url, {
      body,
      agent
    }));
  } catch(error) {
    console.error('Error getting access token.', {error});
    throw error;
  }
  if(data && data.access_token) {
    return data.access_token;
  }
  return false;
}
