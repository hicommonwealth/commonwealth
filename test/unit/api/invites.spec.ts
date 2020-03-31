/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import wallet from 'ethereumjs-wallet';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import app, { resetDatabase, closeServer } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;

describe('Invite Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('Email Invite Tests', () => {
    const community = 'staking';
    const chain = 'ethereum';
    let adminJWT;
    let adminAddress;
    let userJWT;
    let userAddress;
    const userEmail = 'hello@commonwealth.im';

    before(async () => {
      let res = await modelUtils.createAndVerifyAddress({ chain });
      adminAddress = res.address;
      adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
      const isAdmin = await modelUtils.assignAdmin(res.address_id, community);
      res = await modelUtils.createAndVerifyAddress({ chain });
      userAddress = res.address;
      userJWT = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;
      expect(userAddress).to.not.be.null;
      expect(userEmail).to.not.be.null;
      expect(userJWT).to.not.be.null;
    });

    it('/createInvite as admin', async () => {
      const res = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
          author_chain: chain,
          address: adminAddress,
        });
      console.dir(res.body);
      expect(res.body.status).to.be.equal('Success');
    });

    it('/createInvite as user', async () => {

      const res = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({});
    });

    it('/getInvites', async () => {
      const res = await chai.request(app)
      .post('/api/createInvite')
      .set('Accept', 'application/json')
      .send({});

    });

    it('/acceptInvite', async () => {
      const res = await chai.request(app)
      .post('/api/createInvite')
      .set('Accept', 'application/json')
      .send({});

    });
  });

  describe('Invite Link Tests', () => {
    it('/createInviteLink', async () => {

    });

    it('/getInviteLinks', async () => {

    });

    it('/acceptInviteLink', async () => {

    });

  });

});
