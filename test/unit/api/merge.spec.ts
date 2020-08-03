/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt, { sign } from 'jsonwebtoken';
import { NotificationCategories } from 'types';
import { NotificationSubscription } from 'models';
import app, { resetDatabase } from '../../../server-test';
import models from '../../../server/database';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';
const ethUtil = require('ethereumjs-util');

import { Errors as createErrors } from '../../../server/routes/createRole';
import { Errors as upgradeErrors } from '../../../server/routes/upgradeMember';
import { Errors as deleteErrors } from '../../../server/routes/deleteRole';


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
    const chain = 'ethereum';
    const community = 'staking';
  
    before('set up user with addresses', async () => {
      // 1. create first address in order to create the new User/get user id
      // 2. create JWT with user id
      // 3. create second address and pass in JWT
  
  
      // generate first address & user
      let res = await modelUtils.createAndVerifyAddress({ chain });
      console.log('first address', res);
      userAddress1 = res.address;
      let userEmail = res.email;
      userJWT = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);
      // console.log('userAddress1:', userAddress1);
      // console.log('user_id:', res.user_id);
      // console.log('userJWT:', userJWT);
  
      // generate second address with user JWT
      const { keypair, address } = await modelUtils.generateEthAddress();
      const res2 = await models['Address'].createWithToken(
        res.user_id, chain, address, 
      )
      // console.log('res2', res2);
      // console.log('address2:', res2.body.result);
      const address_id = res2.id;
      const token = res2.verification_token;
      const msgHash = ethUtil.hashPersonalMessage(Buffer.from(token));
      const sig = ethUtil.ecsign(msgHash, Buffer.from(keypair.getPrivateKey(), 'hex'));
      const signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
      let res3 = await chai.request.agent(app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({
          address: address,
          chain: chain,
          signature: signature,
          jwt: userJWT
        });
      const user_id = res3.body.result.user.id;
      // console.log('user_id', user_id);
      const email = res3.body.result.user.email;
      userAddress2 = address;

      // add roles
      const role1 = await modelUtils.assignRole({
        address_id: address_id,
        chainOrCommObj: { offchain_community_id: community },
        role: 'admin',
      });
      const role2 = await modelUtils.assignRole({
        address_id: address_id,
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
    });

    it('should merge accounts ???', async () => {
      const res = await chai.request(app)
        .post('/api/mergeAccounts')
        .set('Accept', 'application/json')
        .send({
          'newAddress': userAddress1,
          'oldAddress': userAddress2,
          'jwt': userJWT,
        });
      console.dir(res.body);
    });
  });
});
