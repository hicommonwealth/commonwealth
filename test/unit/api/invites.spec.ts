/* eslint-disable no-unused-expressions */
require('dotenv').config();
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

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
    const userEmail = 'zak@commonwealth.im';

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
      if (!process.env.SENDGRID_API_KEY) return;

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
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.community_id).to.be.equal(community);
      expect(res.body.result.invited_email).to.be.equal(userEmail);
      expect(res.body.result.used).to.be.false;
    });

    it('/createInvite as user', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const res = await modelUtils.createAndVerifyAddress({ chain });
      const newUserAddress = res.address;
      const newUserEmail = 'zak2@commonwealth.im';
      const newUserJWT = jwt.sign({ id: res.user_id, email: newUserEmail }, JWT_SECRET);

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          community,
          author_chain: chain,
          address: userAddress,
        });
      expect(invite.body.status).to.be.equal('Success');
      expect(invite.body.result.community_id).to.be.equal(community);
      expect(invite.body.result.invited_email).to.be.equal(newUserEmail);
      expect(invite.body.result.used).to.be.false;
    });

    it('/acceptInvite', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
          author_chain: chain,
          address: adminAddress,
        });
      expect(invite.body.status).to.be.equal('Success');
      const res = await chai.request(app)
        .post('/api/acceptInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          reject: false,
          inviteCode: invite.body.result.id,
          address: userAddress,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.updatedCode.community_id).to.be.equal(community);
      expect(res.body.result.updatedCode.invited_email).to.be.equal(userEmail);
      expect(res.body.result.updatedCode.used).to.be.true;
      expect(res.body.result.membership.active).to.be.true;
      expect(res.body.result.membership.community).to.be.equal(community);
    });
  });

  describe('Invite Link Tests', () => {
    const community = 'staking';
    const chain = 'ethereum';
    let adminJWT;
    let adminAddress;
    let userJWT;
    let userAddress;
    const userEmail = 'zak@commonwealth.im';
    let inviteCodeId;

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

    it('/createInviteLink as admin', async () => {
      const res = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          community_id: community,
          time: 'none',
          uses: 'none',
          jwt: adminJWT,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.community_id).to.be.equal(community);
      expect(res.body.result.time_limit).to.be.equal('none');
      expect(res.body.result.multi_use).to.be.null;
      expect(res.body.result.active).to.be.true;
      inviteCodeId = res.body.result.id;
    });

    it('/createInviteLink as user', async () => {
      const res = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          community_id: community,
          time: 'none',
          uses: 'none',
          jwt: userJWT,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.community_id).to.be.equal(community);
      expect(res.body.result.time_limit).to.be.equal('none');
      expect(res.body.result.multi_use).to.be.null;
      expect(res.body.result.active).to.be.true;
      inviteCodeId = res.body.result.id;
    });
  });
});
