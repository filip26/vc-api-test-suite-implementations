/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {DidResolver} from './DidResolver.js';
import {Issuer} from './Issuer.js';
import {Verifier} from './Verifier.js';

export class Implementation {
  constructor(settings) {
    this.settings = settings;
  }
  get issuers() {
    return this.settings.issuers.map(issuer => new Issuer({
      issuer,
      oauth2: this.settings.oauth2
    }));
  }
  get verifiers() {
    return this.settings.verifiers.map(verifier => new Verifier({
      verifier,
      oauth2: this.settings.oauth2
    }));
  }
  get didResolvers() {
    const didResolvers = this.settings.didResolvers || [];
    return didResolvers.map(didResolver => new DidResolver({
      didResolver,
      oauth2: this.settings.oauth2
    }));
  }
}
