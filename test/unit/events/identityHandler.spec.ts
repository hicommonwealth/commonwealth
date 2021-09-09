/* eslint-disable no-unused-expressions */
/* eslint-disable dot-notation */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwtLib from 'jsonwebtoken';

import {
  CWEvent,
  SubstrateTypes,
  SubstrateEvents
} from '@commonwealth/chain-events';

import * as modelUtils from '../../util/modelUtils';
import { resetDatabase, getIdentityFetchCache } from '../../../server-test';
import models from '../../../server/database';
import IdentityHandler from '../../../server/eventHandlers/identity';
import { JWT_SECRET } from '../../../server/config';
import IdentityFetchCache from '../../../server/util/identityFetchCache';

chai.use(chaiHttp);
const { assert } = chai;

let address_id;
let address;
let jwt;

// TODO: this test is longer valid
// describe.skip('Update Profile Identity Tests', () => {
//   let fetchCache: IdentityFetchCache;
//
//   beforeEach('reset database', async () => {
//     await resetDatabase();
//     fetchCache = getIdentityFetchCache();
//
//     const res = await modelUtils.createAndVerifyAddress({ chain: 'edgeware' });
//     address_id = res.address_id;
//     address = res.address;
//     jwt = jwtLib.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
//   });
//
//   it('should discover chain identity on /updateProfile', async () => {
//     // Fake the fetcher object and then start the cache (set to 0 job time so we will manually
//     // trigger the job event)
//     const fakeFetcher = ({
//       fetchIdentities: async (
//         addresses: string[]
//       ): Promise<CWEvent<SubstrateTypes.IIdentitySet>[]> => {
//         if (addresses.includes(address)) {
//           return [
//             {
//               blockNumber: 5,
//               data: {
//                 kind: SubstrateTypes.EventKind.IdentitySet,
//                 who: address,
//                 displayName: 'alice',
//                 judgements: [
//                   ['bob', SubstrateTypes.IdentityJudgement.KnownGood],
//                   ['charlie', SubstrateTypes.IdentityJudgement.LowQuality]
//                 ]
//               }
//             }
//           ];
//         } else {
//           return [];
//         }
//       }
//     } as unknown) as SubstrateEvents.StorageFetcher;
//     fetchCache.start(models, { edgeware: fakeFetcher });
//
//     // perform the updateProfile call with the previously registered address
//     const data = {
//       bio: 'test bio',
//       headline: 'test headline',
//       name: 'test name'
//     };
//     await modelUtils.updateProfile({
//       chain: 'edgeware',
//       address,
//       data: JSON.stringify(data),
//       jwt,
//       skipChainFetch: false
//     });
//
//     let profile = await models['OffchainProfile'].findOne();
//     assert.equal(profile.address_id, address_id);
//     assert.notExists(profile.identity);
//     assert.notExists(profile.judgements);
//
//     // verify that the object made it into the cache
//     await fetchCache.access(async (c) => {
//       assert.deepEqual(c, { edgeware: [address] });
//     });
//
//     // run the cache and verify the identity was found and created
//     await fetchCache.run();
//     await fetchCache.access(async (c) => {
//       assert.deepEqual(c, { edgeware: [] });
//     });
//
//     profile = await models['OffchainProfile'].findOne();
//     assert.equal(profile.identity, 'alice');
//     assert.deepEqual(profile.judgements, {
//       bob: SubstrateTypes.IdentityJudgement.KnownGood,
//       charlie: SubstrateTypes.IdentityJudgement.LowQuality
//     });
//   });
// });

describe('Identity Chain Event Handler Tests', () => {
  beforeEach('reset database', async () => {
    await resetDatabase();

    let res = await modelUtils.createAndVerifyAddress({ chain: 'edgeware' });
    address_id = res.address_id;
    address = res.address;
    jwt = jwtLib.sign({ id: res.user_id, email: res.email }, JWT_SECRET);

    const data = {
      bio: 'test bio',
      headline: 'test headline',
      name: 'test name'
    };
    res = await modelUtils.updateProfile({
      chain: 'edgeware',
      address,
      data: JSON.stringify(data),
      jwt,
      skipChainFetch: true
    });
  });

  it('should add identity to existing offchain profile', async () => {
    const event: CWEvent<SubstrateTypes.IIdentitySet> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentitySet,
        who: address,
        displayName: 'alice',
        judgements: [
          ['bob', SubstrateTypes.IdentityJudgement.KnownGood],
          ['charlie', SubstrateTypes.IdentityJudgement.LowQuality]
        ]
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(event, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.identity, 'alice');
    assert.deepEqual(profile.judgements, {
      bob: SubstrateTypes.IdentityJudgement.KnownGood,
      charlie: SubstrateTypes.IdentityJudgement.LowQuality
    });
  });

  it('should add first judgement to existing offchain profile', async () => {
    const setEvent: CWEvent<SubstrateTypes.IIdentitySet> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentitySet,
        who: address,
        displayName: 'alice',
        judgements: []
      }
    };
    const judgementEvent: CWEvent<SubstrateTypes.IJudgementGiven> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.JudgementGiven,
        who: address,
        registrar: 'dave',
        judgement: SubstrateTypes.IdentityJudgement.Reasonable
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(setEvent, null);
    await handler.handle(judgementEvent, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.address_id, address_id);
    assert.equal(profile.identity, 'alice');
    assert.deepEqual(profile.judgements, {
      dave: SubstrateTypes.IdentityJudgement.Reasonable
    });
  });

  it('should add more judgements to existing offchain profile', async () => {
    const setEvent: CWEvent<SubstrateTypes.IIdentitySet> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentitySet,
        who: address,
        displayName: 'alice',
        judgements: [
          ['bob', SubstrateTypes.IdentityJudgement.KnownGood],
          ['charlie', SubstrateTypes.IdentityJudgement.LowQuality]
        ]
      }
    };
    const judgementEvent: CWEvent<SubstrateTypes.IJudgementGiven> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.JudgementGiven,
        who: address,
        registrar: 'dave',
        judgement: SubstrateTypes.IdentityJudgement.Reasonable
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(setEvent, null);
    const preJudgementProfile = await models['OffchainProfile'].findOne();
    assert.equal(preJudgementProfile.identity, 'alice');
    assert.deepEqual(preJudgementProfile.judgements, {
      bob: SubstrateTypes.IdentityJudgement.KnownGood,
      charlie: SubstrateTypes.IdentityJudgement.LowQuality
    });

    await handler.handle(judgementEvent, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.address_id, address_id);
    assert.equal(profile.identity, 'alice');
    assert.deepEqual(profile.judgements, {
      bob: SubstrateTypes.IdentityJudgement.KnownGood,
      charlie: SubstrateTypes.IdentityJudgement.LowQuality,
      dave: SubstrateTypes.IdentityJudgement.Reasonable
    });
  });

  it('should remove identity on identity-cleared', async () => {
    const setEvent: CWEvent<SubstrateTypes.IIdentitySet> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentitySet,
        who: address,
        displayName: 'alice',
        judgements: [
          ['bob', SubstrateTypes.IdentityJudgement.KnownGood],
          ['charlie', SubstrateTypes.IdentityJudgement.LowQuality]
        ]
      }
    };
    const clearEvent: CWEvent<SubstrateTypes.IIdentityCleared> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentityCleared,
        who: address
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(setEvent, null);
    await handler.handle(clearEvent, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.address_id, address_id);
    assert.notExists(profile.identity);
    assert.notExists(profile.judgements);
  });

  it('should remove identity on identity-killed', async () => {
    const setEvent: CWEvent<SubstrateTypes.IIdentitySet> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentitySet,
        who: address,
        displayName: 'alice',
        judgements: [
          ['bob', SubstrateTypes.IdentityJudgement.KnownGood],
          ['charlie', SubstrateTypes.IdentityJudgement.LowQuality]
        ]
      }
    };
    const killedEvent: CWEvent<SubstrateTypes.IIdentityKilled> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentityKilled,
        who: address
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(setEvent, null);
    await handler.handle(killedEvent, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.address_id, address_id);
    assert.notExists(profile.identity);
    assert.notExists(profile.judgements);
  });

  it('should do nothing if no corresponding profile found', async () => {
    const event: CWEvent<SubstrateTypes.IIdentitySet> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.IdentitySet,
        who: 'bob',
        displayName: 'bob',
        judgements: [
          ['alice', SubstrateTypes.IdentityJudgement.KnownGood],
          ['charlie', SubstrateTypes.IdentityJudgement.LowQuality]
        ]
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(event, null);
    const profiles = await models['OffchainProfile'].findAll();
    assert.lengthOf(profiles, 1);
    assert.equal(profiles[0].address_id, address_id);
  });

  it('should not add judgement to offchain profile without identity', async () => {
    const judgementEvent: CWEvent<SubstrateTypes.IJudgementGiven> = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.JudgementGiven,
        who: address,
        registrar: 'dave',
        judgement: SubstrateTypes.IdentityJudgement.Reasonable
      }
    };

    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(judgementEvent, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.address_id, address_id);
    assert.notExists(profile.identity);
    assert.notExists(profile.judgements);
  });

  it('should do nothing on unrelated events', async () => {
    const event: CWEvent = {
      blockNumber: 10,
      data: {
        kind: SubstrateTypes.EventKind.DemocracyStarted,
        referendumIndex: 0,
        endBlock: 100,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval'
      }
    };
    const handler = new IdentityHandler(models, 'edgeware');
    await handler.handle(event, null);
    const profile = await models['OffchainProfile'].findOne();
    assert.equal(profile.address_id, address_id);
    assert.notExists(profile.identity);
    assert.notExists(profile.judgements);
  });
});
