/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt, { sign } from 'jsonwebtoken';
import { NotificationCategories } from 'types';
import { NotificationSubscription } from 'models';
import { Keyring } from '@polkadot/api';
import { stringToU8a, u8aToHex, hexToU8a } from '@polkadot/util';
import app, { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';
import { Errors as mergeErrors } from '../../../server/routes/mergeAccounts';


chai.use(chaiHttp);
const { expect } = chai;

describe('Merge Account tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('/mergeAccount route test', () => {
    let userJWT;
    let userAddress1;
    let userAddress2;
    let notOwned;
    let signature;
    const message = 'Hello World';
    const chain = 'edgeware';
    const community = 'staking';


    before('set up user with addresses', async () => {
      // 1. create first address in order to create the new User/get user id
      // 2. create JWT with user id
      // 3. create second address and pass in JWT


      // generate first address & user
      const res = await modelUtils.createAndVerifyAddress({ chain: 'edgeware' });
      userAddress1 = res.address;
      const userEmail = res.email;
      userJWT = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);

      // generate second address with user JWT
      const keyPair = new Keyring({
        type: 'sr25519',
        ss58Format: 42,
      }).addFromMnemonic('In Wonderland');
      const address = keyPair.address;
      const res2 = await models['Address'].createWithToken(
        res.user_id, 'edgeware', address,
      );
      const address_id = res2.id;
      const token = res2.verification_token;
      const u8aSignature = keyPair.sign(stringToU8a(token));
      const siggy = u8aToHex(u8aSignature).slice(2);
      const res3 = await chai.request.agent(app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({ address, chain, signature: siggy, jwt: userJWT });
      const user_id = res3.body.result.user.id;
      const email = res3.body.result.user.email;
      userAddress2 = address;

      // sign message from userAddress2
      signature = u8aToHex(keyPair.sign(stringToU8a(message)));

      // create un-owned address
      notOwned = await modelUtils.createAndVerifyAddress({ chain }, 'Grapefruit');

      // add roles
      const role1 = await modelUtils.assignRole({
        address_id,
        chainOrCommObj: { offchain_community_id: community },
        role: 'admin',
      });
      const role2 = await modelUtils.assignRole({
        address_id,
        chainOrCommObj: { chain_id: 'edgeware' },
        role: 'moderator',
      });
      const role3 = await modelUtils.assignRole({
        address_id: res.address_id,
        chainOrCommObj: { offchain_community_id: community },
        role: 'moderator',
      });
      const role4 = await modelUtils.assignRole({
        address_id: res.address_id,
        chainOrCommObj: { chain_id: 'edgeware' },
        role: 'member',
      });

      // add threads
      const thread = await modelUtils.createThread({
        chainId: chain,
        communityId: community,
        address: userAddress2,
        jwt: userJWT,
        title: 'hello',
        body: 'world',
        tagName: 'test tag',
        tagId: undefined,
        kind: 'forum',
      });
      const thread2 = await modelUtils.createThread({
        chainId: chain,
        communityId: community,
        address: userAddress2,
        jwt: userJWT,
        title: 'hello 2',
        body: 'world 2',
        tagName: 'test tag',
        tagId: undefined,
        kind: 'forum',
      });

      // add comments
      const comment = await modelUtils.createComment({
        chain,
        address: userAddress2,
        jwt: userJWT,
        text: 'hi ho',
        root_id: `discussion_${thread.result.id}`,
      });

      const comment2 = await modelUtils.createComment({
        chain,
        address: userAddress2,
        jwt: userJWT,
        text: 'hi ho no go!',
        root_id: `discussion_${thread2.result.id}`,
      });

      // add reactions directly to thread
      const reaction1 = await models['OffchainReaction'].create({
        chain: null,
        thread_id: thread2.result.id,
        proposal_id: null,
        comment_id: null,
        reaction: 'like',
        community,
        address_id,
      });

      // add conflicting reaction (thread) to be deleted in route.
      const reaction2 = await models['OffchainReaction'].create({
        chain: null,
        thread_id: thread2.result.id,
        proposal_id: null,
        comment_id: null,
        reaction: 'like',
        community,
        address_id: res.address_id,
      });

      // add reaction to comment
      const reaction3 = await models['OffchainReaction'].create({
        chain: null,
        thread_id: null,
        proposal_id: null,
        comment_id: comment2.result.id,
        reaction: 'like',
        community,
        address_id,
      });

      // add conflicting reaction (comment) to be deleted in route.
      const reaction4 = await models['OffchainReaction'].create({
        chain: null,
        thread_id: null,
        proposal_id: null,
        comment_id: comment2.result.id,
        reaction: 'like',
        community,
        address_id: res.address_id,
      });

      // add reaction to proposal
      const reaction5 = await models['OffchainReaction'].create({
        chain: null,
        thread_id: null,
        proposal_id: '12',
        comment_id: comment2.result.id,
        reaction: 'like',
        community,
        address_id,
      });

      // add conflicting reaction (proposal) to be deleted in route.
      const reaction6 = await models['OffchainReaction'].create({
        chain: null,
        thread_id: null,
        proposal_id: '12',
        comment_id: null,
        reaction: 'like',
        community,
        address_id: res.address_id,
      });
    });

    it('should fail to merge if doesn\'n own both addresses', async () => {
      const res = await chai.request(app)
        .post('/api/mergeAccounts')
        .set('Accept', 'application/json')
        .send({
          'newAddress': notOwned.address,
          'oldAddress': userAddress2,
          'signature': signature,
          'message': message,
          'jwt': userJWT,
        });
      expect(res.body.error).to.be.equal(mergeErrors.AddressesNotOwned);
    });

    it('should fail to merge if there is no signature', async () => {
      const res = await chai.request(app)
        .post('/api/mergeAccounts')
        .set('Accept', 'application/json')
        .send({
          'newAddress': userAddress1,
          'oldAddress': notOwned.address,
          'message': message,
          'jwt': userJWT,
        });
      expect(res.body.error).to.be.equal(mergeErrors.NeedSignature);
    });

    it('should fail to merge if there is an invalid signature', async () => {
      const res = await chai.request(app)
        .post('/api/mergeAccounts')
        .set('Accept', 'application/json')
        .send({
          'newAddress': userAddress1,
          'oldAddress': userAddress2,
          'signature': 'bad-signature',
          'message': message,
          'jwt': userJWT,
        });
      expect(res.body.error).to.be.equal(mergeErrors.InvalidSignature);
    });

    it('should merge accounts with status Success', async () => {
      const res = await chai.request(app)
        .post('/api/mergeAccounts')
        .set('Accept', 'application/json')
        .send({
          'newAddress': userAddress1,
          'oldAddress': userAddress2,
          'signature': signature,
          'message': message,
          'jwt': userJWT,
        });
      expect(res.body.status).to.be.equal('Success');
    });
  });
});
