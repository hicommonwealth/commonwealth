/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { NotificationCategories } from 'types';
import { NotificationSubscription } from 'models';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

import { Errors as createErrors } from '../../../server/routes/createRole';
import { Errors as upgradeErrors } from '../../../server/routes/upgradeMember';
import { Errors as deleteErrors } from '../../../server/routes/deleteRole';


chai.use(chaiHttp);
const { expect } = chai;

describe('Roles Test', () => {
  let jwtToken;
  let loggedInAddr;
  let loggedInAddrId;
  let adminUserId;
  const chain = 'ethereum';
  const community = 'staking';

  before('reset database', async () => {
    await resetDatabase();
    const res = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = res.address;
    loggedInAddrId = res.address_id;
    jwtToken = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminUserId = res.user_id;
    const isAdmin = await modelUtils.assignRole({
      address_id: res.address_id,
      chainOrCommObj: { offchain_community_id: community },
      role: 'admin',
    });
  });

  describe('/createRole route tests', () => {
    it('should create a member role for a public community', async () => {
      const user = await modelUtils.createAndVerifyAddress({ chain });
      const res = await chai.request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET),
          community,
          address_id: user.address_id,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.address_id).to.be.equal(user.address_id);
      expect(res.body.result.offchain_community_id).to.be.equal(community);
    });

    it('should fail to create duplicate role for a public community a user is a member of', async () => {
      const res = await chai.request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address_id: loggedInAddrId,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(createErrors.RoleAlreadyExists);
    });

    it('should fail to create a role without address_id', async () => {
      const res = await chai.request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(createErrors.InvalidAddress);
    });
  });

  describe('/upgradeMember route tests', () => {
    let newUserAddress;
    let newUserAddressId;
    let newJwt;
    let newUserId;

    beforeEach('Create a new user as member of community to invite or upgrade', async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
      newUserAddress = res.address;
      newUserAddressId = res.address_id;
      newJwt = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
      newUserId = res.user_id;
      const isMember = await modelUtils.assignRole({
        address_id: newUserAddressId,
        chainOrCommObj: { offchain_community_id: community },
        role: 'member',
      });
    });

    it('should pass when admin upgrades new member', async () => {
      const role = 'moderator';
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address: newUserAddress,
          new_role: role,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.permission).to.be.equal(role);
    });

    it('should fail when admin upgrades without address', async () => {
      const role = 'moderator';
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          new_role: role,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidAddress);
    });

    it('should fail when admin upgrades invalid address', async () => {
      const role = 'moderator';
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address: 'invalid address',
          new_role: role,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidAddress);
    });

    it('should fail when admin upgrades without role', async () => {
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address: newUserAddress,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidRole);
    });

    it('should fail when admin upgrades with invalid role', async () => {
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address: newUserAddress,
          new_role: 'commander in chief',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidRole);
    });

    it('should fail when a non-admin upgrades a member', async () => {
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: newJwt,
          community,
          address: newUserAddress,
          new_role: 'moderator',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.MustBeAdmin);
    });

    it('should fail to demote an admin if self is admin', async () => {
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address: loggedInAddr,
          new_role: 'member',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.NoAdminDemotion);
    });

    it('should fail to upgrade a nonexistent member', async () => {
      const temp = await modelUtils.createAndVerifyAddress({ chain });
      const tempJwt = jwt.sign({ id: temp.user_id, email: temp.email }, JWT_SECRET);
      const res = await chai.request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address: temp.address,
          new_role: 'admin',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.NoMember);
    });
  });

  describe('/deleteRole route tests', () => {
    let memberAddress;
    let memberAddressId;
    let memberJwt;
    let memberUserId;

    beforeEach('Create a member role to delete', async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
      memberAddress = res.address;
      memberAddressId = res.address_id;
      memberJwt = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
      memberUserId = res.user_id;
      const isMember = await modelUtils.assignRole({
        address_id: memberAddressId,
        chainOrCommObj: { offchain_community_id: community },
        role: 'member',
      });
    });

    it('should delete member role', async () => {
      const res = await chai.request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          community,
          address_id: memberAddressId,
        });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to delete role without address_id', async () => {
      const res = await chai.request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          community,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(deleteErrors.InvalidAddress);
    });

    it('should fail to delete role with invalid address_id', async () => {
      const res = await chai.request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          community,
          address_id: 123456,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(deleteErrors.InvalidAddress);
    });

    it('should fail to delete role where there is none in chain community', async () => {
      const res = await chai.request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          chain,
          address_id: memberAddressId,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(deleteErrors.RoleDNE);
    });
  });

  describe('/bulkMembers route test', () => {
    it('should grab bulk members for a public community', async () => {
      const res = await chai.request.agent(app)
        .get('/api/bulkMembers')
        .set('Accept', 'application/json')
        .query({
          community,
          jwt: jwtToken
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.length).to.be.greaterThan(0);
    });

    it('should fail to grab bulk members if community is not visible to user', async () => {
      const communityArgs: modelUtils.CommunityArgs = {
        jwt: jwtToken,
        isAuthenticatedForum: 'false',
        privacyEnabled: 'true',
        invitesEnabled: 'true',
        id: 'test',
        name: 'test community',
        creator_address: loggedInAddr,
        creator_chain: chain,
        description: 'test enabled community',
        default_chain: chain,
      };
      const testCommunity = await modelUtils.createCommunity(communityArgs);
      const communityId = testCommunity.id;
      const res = await chai.request.agent(app)
        .get('/api/bulkMembers')
        .set('Accept', 'application/json')
        .query({
          community,
          jwt: jwtToken
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.length).to.be.greaterThan(0);
    });
  });
});
