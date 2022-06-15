/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {httpPost, zcapRequest} from './requests.js';

export class Verifier {
  constructor({verifier, oauth2}) {
    this.verifier = verifier;
    this.oauth2 = oauth2;
  }
  // ensure tags are unique
  get tags() {
    return new Set(this.verifier.tags);
  }
  async verify({body}) {
    const {verifier, oauth2} = this;
    const headers = {
      ...verifier.headers
    };
    if(verifier.zcap) {
      return zcapRequest({
        endpoint: verifier.endpoint,
        zcap: verifier.zcap,
        json: body,
        headers
      });
    }
    return httpPost({
      json: body,
      oauth2,
      endpoint: verifier.endpoint,
      headers
    });
  }
}
