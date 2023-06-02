/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import { NotificationCategories } from 'common-common/src/types';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';

import { Errors as createErrors } from '../../../server/routes/createRole';
import { Errors as deleteErrors } from '../../../server/routes/deleteRole';
import { Errors as upgradeErrors } from '../../../server/routes/upgradeMember';
import * as modelUtils from '../../util/modelUtils';
import { generateEthAddress } from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Roles Test', () => {
  let jwtToken;
  let loggedInAddr;
  let loggedInAddrId;
  let adminUserId;
  const chain = 'ethereum';

  before('reset database', async () => {
    await resetDatabase();
    const res = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = res.address;
    loggedInAddrId = res.address_id;
    jwtToken = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminUserId = res.user_id;
    const isAdmin = await modelUtils.updateRole({
      address_id: res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
  });

  describe('/createRole route tests', () => {
    it('should create a member role for a public community', async () => {
      const user = await modelUtils.createAndVerifyAddress({ chain });
      const res = await chai
        .request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET),
          chain,
          address_id: user.address_id,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.role.address_id).to.be.equal(user.address_id);
      expect(res.body.result.role.chain_id).to.be.equal(chain);
      expect(res.body.result.subscription).to.not.be.null;
      expect(res.body.result.subscription.object_id).to.be.equal(chain);
      expect(res.body.result.subscription.category_id).to.be.equal(
        NotificationCategories.NewThread
      );
    });

    it('should return existing role for a public community a user is already a member of', async () => {
      const res = await chai
        .request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address_id: loggedInAddrId,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.role.address_id).to.be.equal(loggedInAddrId);
      expect(res.body.result.role.chain_id).to.be.equal(chain);
      expect(res.body.result.role.permission).to.be.equal('admin');
    });

    it('should fail to create a role without address_id', async () => {
      const res = await chai
        .request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
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

    beforeEach(
      'Create a new user as member of community or upgrade',
      async () => {
        const res = await modelUtils.createAndVerifyAddress({ chain });
        newUserAddress = res.address;
        newUserAddressId = res.address_id;
        newJwt = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
        newUserId = res.user_id;
        const isMember = await modelUtils.updateRole({
          address_id: newUserAddressId,
          chainOrCommObj: { chain_id: chain },
          role: 'member',
        });
      }
    );

    it('should pass when admin upgrades new member', async () => {
      const role = 'moderator';
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: newUserAddress,
          new_role: role,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.permission).to.be.equal(role);
    });

    it('should fail when admin upgrades without address', async () => {
      const role = 'moderator';
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          new_role: role,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidAddress);
    });

    it('should fail when admin upgrades invalid address', async () => {
      const role = 'moderator';
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: 'invalid address',
          new_role: role,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.NoMember);
    });

    it('should fail when admin upgrades without role', async () => {
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: newUserAddress,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidRole);
    });

    it('should fail when admin upgrades with invalid role', async () => {
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: newUserAddress,
          new_role: 'commander in chief',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidRole);
    });

    it('should fail when a non-admin upgrades a member', async () => {
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: newJwt,
          chain,
          address: newUserAddress,
          new_role: 'moderator',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.MustBeAdmin);
    });

    it('should fail to upgrade a nonexistent member', async () => {
      const temp = await modelUtils.createAndVerifyAddress({ chain });
      const tempJwt = jwt.sign(
        { id: temp.user_id, email: temp.email },
        JWT_SECRET
      );
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: generateEthAddress().address,
          new_role: 'admin',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.NoMember);
    });

    it('should fail when the only admin demotes self', async () => {
      const role = 'member';
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: loggedInAddr,
          new_role: role,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.MustHaveAdmin);
    });

    it('should pass when admin demotes self', async () => {
      // set new user as new admin
      const role = 'admin';
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: newUserAddress,
          new_role: role,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.permission).to.be.equal(role);

      const newAdminRole = 'member';
      const demoteRes = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          chain,
          address: loggedInAddr,
          new_role: newAdminRole,
        });
      expect(demoteRes.body.status).to.be.equal('Success');
      expect(demoteRes.body.result.permission).to.be.equal(newAdminRole);
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
      const isMember = await modelUtils.updateRole({
        address_id: memberAddressId,
        chainOrCommObj: { chain_id: chain },
        role: 'member',
      });
    });

    it('should delete member role', async () => {
      const res = await chai
        .request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          chain,
          address_id: memberAddressId,
        });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to delete role without address_id', async () => {
      const res = await chai
        .request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          chain,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(deleteErrors.InvalidAddress);
    });

    it('should fail to delete role with invalid address_id', async () => {
      const res = await chai
        .request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          chain,
          address_id: 123456,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(deleteErrors.InvalidAddress);
    });

    it('should fail to delete role where there is none in chain community', async () => {
      // ensure does not exist before attempting to delete
      await chai
        .request(app)
        .post('/api/deleteRole')
        .set('Accept', 'application/json')
        .send({
          jwt: memberJwt,
          chain,
          address_id: memberAddressId,
        });
      const res = await chai
        .request(app)
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
});
