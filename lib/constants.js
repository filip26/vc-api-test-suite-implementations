/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import https from 'https';
import * as didKey from '@digitalbazaar/did-method-key';

export const agent = new https.Agent({rejectUnauthorized: false});

export const headers = {
  Accept: 'application/ld+json,application/json',
  'Content-Type': 'application/json',
};

export const didKeyDriver = didKey.driver();
