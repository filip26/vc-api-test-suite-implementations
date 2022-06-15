/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {agent, didKeyDriver} from './constants.js';
import {constructOAuthHeader} from './oauth2.js';
import {decodeSecretKeySeed} from 'bnid';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {httpClient} from '@digitalbazaar/http-client';
import {ZcapClient} from '@digitalbazaar/ezcap';

const defaultHeaders = {
  Accept: 'application/json, application/ld+json, */*'
};

const postHeaders = {
  'Content-Type': 'application/json',
  ...defaultHeaders
};

export async function httpGet({url, headers = {}, oauth2}) {
  let result;
  let error;
  try {
    if(oauth2) {
      headers.Authorization = await constructOAuthHeader({...oauth2});
    }
    result = await httpClient.get(
      url, {headers: {...defaultHeaders, ...headers}, agent});
  } catch(e) {
    error = e;
  }
  return {result, error};
}

export async function httpPost({
  endpoint,
  json,
  oauth2,
  headers = {}
}) {
  let result;
  let error;
  if(oauth2) {
    headers.Authorization = await constructOAuthHeader({...oauth2});
  }
  try {
    result = await httpClient.post(
      endpoint,
      {
        json,
        agent,
        headers: {
          ...postHeaders,
          // passed in headers will overwrite postHeaders
          ...headers
        }
      });
  } catch(e) {
    if(e.response) {
      const {headers: responseHeaders} = e.response;
      // Clone the request headers
      const newHeaders = new globalThis.Headers(responseHeaders);
      // delete the Authorization header to prevent
      // oauth2 headers potentially in logs
      newHeaders.delete('Authorization');
      const newResponse = new globalThis.Response(e.response, {
        headers: newHeaders
      });
      e.response = newResponse;
    }
    error = e;
  }
  const {data, statusCode} = _getDataAndStatus({result, error});
  return {result, error, data, statusCode};
}

const _getZcapClient = async ({secretKeySeed}) => {
  const seed = await decodeSecretKeySeed({secretKeySeed});
  const didKey = await didKeyDriver.generate({seed});
  const {didDocument: {capabilityInvocation}} = didKey;
  return new ZcapClient({
    SuiteClass: Ed25519Signature2020,
    invocationSigner: didKey.keyPairs.get(capabilityInvocation[0]).signer(),
    agent
  });
};

export async function zcapRequest({
  endpoint,
  json,
  zcap,
  headers = defaultHeaders
}) {
  let result;
  let error;
  let capability;
  if(endpoint.endsWith('/publish')) {
    capability = zcap.slcsCapability;
  } else {
    capability = zcap.capability;
  }
  // we are storing the zcaps stringified right now
  if(typeof capability === 'string') {
    capability = JSON.parse(capability);
  }
  try {
    // assume that the clientSecret is set in the test environment
    const secretKeySeed = process.env[zcap.clientSecret];
    if(!secretKeySeed) {
      console.warn(`ENV variable ${zcap.clientSecret} is required.`);
    }
    const zcapClient = await _getZcapClient({secretKeySeed});
    result = await zcapClient.write({
      url: endpoint,
      json,
      headers: {
        ...postHeaders,
        // passed in headers will overwrite postHeaders
        ...headers
      },
      capability
    });
  } catch(e) {
    error = e;
  }
  const {data, statusCode} = _getDataAndStatus({result, error});
  return {result, error, data, statusCode};
}

function _getDataAndStatus({result = {}, error = {}}) {
  let data = result.data || error.data;
  // FIXME remove this once VC-API returns from the issuer
  // are finalized.
  if(data && data.verifiableCredential) {
    data = data.verifiableCredential;
  }
  const statusCode = result.status || error.status;
  return {data, statusCode};
}
