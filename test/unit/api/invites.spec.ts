/* eslint-disable no-unused-expressions */
require('dotenv').config();
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import { Errors as CreateInviteErrors } from 'server/routes/createInvite';
import { Errors as AcceptInviteErrors } from 'server/routes/acceptInvite';
import { Errors as CreateInviteLinkErrors } from 'server/routes/createInviteLink';
import { JWT_SECRET } from 'server/config';
import * as modelUtils from '../../util/modelUtils';
import app, { resetDatabase } from '../../../server-test';
import { NotificationCategories } from '../../../shared/types';

chai.use(chaiHttp);
const { expect } = chai;

describe('Invite Tests', () => {
  const community = 'staking';
  const chain = 'ethereum';
  let adminJWT;
  let adminAddress;
  let adminUserId;
  let userJWT;
  let userAddress;
  let userUserId;
  const userEmail = 'test@commonwealth.im';

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminUserId = res.user_id;
    const isAdmin = await modelUtils.assignRole({
      address_id: res.address_id,
      chainOrCommObj: { offchain_community_id: community },
      role: 'admin',
    });

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);
    userUserId = res.user_id;
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;
    expect(userAddress).to.not.be.null;
    expect(userEmail).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('/createInvite', () => {
    it('should create an invite for an email from an invites disabled community as admin', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const res = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
          address: adminAddress,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.community_id).to.be.equal(community);
      expect(res.body.result.invited_email).to.be.equal(userEmail);
      expect(res.body.result.used).to.be.false;
    });

    it('should create an invite for an address from a invites disabled community as admin', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const addrRes = await modelUtils.createAndVerifyAddress({ chain });

      const res = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedAddress: addrRes.address,
          community,
          address: adminAddress,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.offchain_community_id).to.be.equal(community);
      expect(res.body.result.address_id).to.be.equal(addrRes.address_id);
    });

    it('should create an invite from a community as user in an invites enabled community', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const communityArgs: modelUtils.CommunityArgs = {
        jwt: userJWT,
        isAuthenticatedForum: 'false',
        privacyEnabled: 'false',
        invitesEnabled: 'true',
        id: 'invites',
        name: 'invites community',
        creator_address: userAddress,
        creator_chain: chain,
        description: 'Invites enabled community',
        default_chain: chain,
      };

      const invCommunity = await modelUtils.createCommunity(communityArgs);
      const newUserEmail = 'test@commonwealth.im';

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          community: invCommunity.id,
          author_chain: invCommunity.default_chain,
          address: userAddress,
        });
      expect(invite.body.status).to.be.equal('Success');
      expect(invite.body.result.community_id).to.be.equal(invCommunity.id);
      expect(invite.body.result.invited_email).to.be.equal(newUserEmail);
      expect(invite.body.result.used).to.be.false;
    });

    it('should fail to invite an address that does not exist', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const { address } = modelUtils.generateEthAddress();

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedAddress: address,
          community,
          address: adminAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.AddressNotFound);
    });

    it('should fail to invite an address that is already a member', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const res = await modelUtils.createAndVerifyAddress({ chain });
      await modelUtils.assignRole({
        address_id: res.address_id,
        chainOrCommObj: { offchain_community_id: community },
        role: 'member',
      });

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedAddress: res.address,
          community,
          address: adminAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.IsAlreadyMember);
    });

    it('should fail to create an invite from an invites disabled community as a user', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const newUserEmail = 'test@commonwealth.im';

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          community,
          address: userAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.MustBeAdminOrMod);
    });

    it('should fail to create an invite with an invalid JWT', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const newUserEmail = 'test@commonwealth.im';
      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: 'jwt',
          invitedEmail: newUserEmail,
          community,
          address: userAddress,
        });

      expect(invite.status).to.be.equal(401);
    });

    it('should fail to create an invite with an invalid email', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const res = await modelUtils.createAndVerifyAddress({ chain });
      const newUserAddress = res.address;
      const newUserEmail = 'test-commonwealth.im';
      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: newUserEmail,
          community,
          address: adminAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.InvalidEmail);
    });

    it('should fail to create an invite with an address and an email', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const res = await modelUtils.createAndVerifyAddress({ chain });
      const newUserAddress = res.address;
      const newUserEmail = 'test@commonwealth.im';
      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          invitedAddress: newUserAddress,
          community,
          address: userAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.NoEmailAndAddress);
    });

    it('should fail to create an invite without an address or an email', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const res = await modelUtils.createAndVerifyAddress({ chain });
      const newUserAddress = res.address;
      const newUserEmail = 'test@commonwealth.im';
      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          community,
          address: userAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.NoEmailOrAddress);
    });

    it('should fail to create an invite with a non-existent address', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const newUserEmail = 'test@commonwealth.im';
      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          community,
          address: '',
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.AddressNotFound);
    });

    it('should fail to create an invite from a non-admin user passing in an admin address', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const newUserEmail = 'test@commonwealth.im';

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          community,
          address: adminAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.AddressNotFound);
    });

    it('should fail to create an invite from a non-admin user passing in an admin address in an invites disabled community', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const newUserEmail = 'test@commonwealth.im';

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          invitedEmail: newUserEmail,
          community,
          address: adminAddress,
        });

      expect(invite.status).to.be.equal(500);
      expect(invite.body.error).to.not.be.null;
      expect(invite.body.error).to.be.equal(CreateInviteErrors.AddressNotFound);
    });
  });

  describe('/acceptInvite', () => {
    it('should accept an invite created by an admin as a user', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
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
      expect(res.body.result.subscription).to.not.be.null;
      expect(res.body.result.subscription.object_id).to.be.equal(community);
      expect(res.body.result.subscription.category_id).to.be.equal(NotificationCategories.NewThread);
    });

    it('should fail to accept an invite created by an admin as a user who does not own the address', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
          address: adminAddress,
        });

      const newUserRes = await modelUtils.createAndVerifyAddress({ chain });
      const newUserAddress = newUserRes.address;
      const res = await chai.request(app)
        .post('/api/acceptInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          reject: false,
          inviteCode: invite.body.result.id,
          address: newUserAddress,
        });
      expect(res.status).to.be.equal(500);
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(AcceptInviteErrors.WrongOwner);
    });

    it('should fail to accept an invite that does not exist', async () => {
      const res = await chai.request(app)
        .post('/api/acceptInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          reject: false,
          inviteCode: '',
          address: userAddress,
        });
      expect(res.status).to.be.equal(500);
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(AcceptInviteErrors.NoInviteCodeFound(''));
    });

    it('should fail to accept invite with invalid address', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
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
          address: '1234',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(AcceptInviteErrors.NoAddressFound('1234'));
    });

    it('should successfully reject an invite', async () => {
      if (!process.env.SENDGRID_API_KEY) return;

      const invite = await chai.request(app)
        .post('/api/createInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          invitedEmail: userEmail,
          community,
          address: adminAddress,
        });
      expect(invite.body.status).to.be.equal('Success');
      const res = await chai.request(app)
        .post('/api/acceptInvite')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          reject: 'true',
          inviteCode: invite.body.result.id,
          address: userAddress,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.used).to.be.true;
      expect(res.body.result.community_id).to.be.equal(community);
      expect(res.body.result.invited_email).to.be.equal(userEmail);
    });
  });

  describe('/createInviteLink', () => {
    it('should create an invite link as an admin', async () => {
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
    });

    it('should create an invite link as a user', async () => {
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
    });

    it('should fail to create an invite link without a community', async () => {
      const res = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          time: 'none',
          uses: 'none',
          jwt: userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(CreateInviteLinkErrors.NoCommunityId);
    });

    it('should fail to create an invite link without a time', async () => {
      const res = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          community_id: community,
          uses: 'none',
          jwt: userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(CreateInviteLinkErrors.NoTimeLimit);
    });

    it('should fail to create an invite link without uses', async () => {
      const res = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          community_id: community,
          time: 'none',
          jwt: userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(CreateInviteLinkErrors.InvalidUses);
    });

    it('should fail to create an invite link with invalid uses', async () => {
      const res = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          community_id: community,
          time: 'none',
          uses: 'hello',
          jwt: userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(CreateInviteLinkErrors.InvalidUses);
    });

    it('should fail to create a new forever invite link if one already exists', async () => {
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
      const res2 = await chai.request(app)
        .post('/api/createInviteLink')
        .set('Accept', 'application/json')
        .send({
          community_id: community,
          time: 'none',
          uses: 'none',
          jwt: userJWT,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.id).to.be.equal(res2.body.result.id);
    });

  });
});
