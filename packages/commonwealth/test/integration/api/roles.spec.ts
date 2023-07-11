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
import models from '../../../server/database';

chai.use(chaiHttp);
const { expect } = chai;

describe('Roles Test', () => {
  let adminJwt;
  let adminAddress;
  let adminAddressId;
  let adminUserId;
  const chain = 'ethereum';

  before('reset database', async () => {
    await resetDatabase();
    const res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminAddressId = res.address_id;
    adminJwt = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminUserId = res.user_id;
    await modelUtils.updateRole({
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

    it('should fail to create a role without address_id', async () => {
      const res = await chai
        .request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(createErrors.InvalidAddress);
    });
  });

  describe.only('/upgradeMember route tests', () => {
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
        await modelUtils.updateRole({
          address_id: newUserAddressId,
          chainOrCommObj: { chain_id: chain },
          role: 'member',
        });
      }
    );

    afterEach(async () => {
      await models.Address.destroy({
        where: {
          id: newUserAddressId,
        },
      });
    });

    it('should be able to upgrade a member or moderator as an admin', async () => {
      const modRole = 'moderator';
      const modRes = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
          address: newUserAddress,
          new_role: modRole,
        });
      expect(modRes.body.status).to.be.equal('Success');
      expect(modRes.body.result.permission).to.be.equal(modRole);

      const adminRole = 'admin';
      const adminRes = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
          address: newUserAddress,
          new_role: adminRole,
        });
      expect(adminRes.body.status).to.be.equal('Success');
      expect(adminRes.body.result.permission).to.be.equal(adminRole);
    });

    it('should fail when admin upgrades without address', async () => {
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
          new_role: 'moderator',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.InvalidAddress);
    });

    it('should fail when admin upgrades invalid address', async () => {
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
          address: 'invalid address',
          new_role: 'moderator',
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
          jwt: adminJwt,
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
          jwt: adminJwt,
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
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
          address: generateEthAddress().address,
          new_role: 'admin',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.NoMember);
    });

    it('should fail when the only admin demotes self', async () => {
      const res = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJwt,
          chain,
          address: adminAddress,
          new_role: 'member',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(upgradeErrors.MustHaveAdmin);
    });

    it('should pass when admin demotes self', async () => {
      await models.Address.update(
        {
          role: 'admin',
        },
        {
          where: {
            id: newUserAddressId,
          },
        }
      );

      const role = 'member';
      const demoteRes = await chai
        .request(app)
        .post('/api/upgradeMember')
        .set('Accept', 'application/json')
        .send({
          jwt: newJwt,
          chain,
          address: newUserAddress,
          new_role: role,
        });
      expect(demoteRes.body.status).to.be.equal('Success');
      expect(demoteRes.body.result.permission).to.be.equal(role);
    });
  });

  describe('/deleteRole route tests', () => {
    let memberAddress;
    let memberAddressId;
    let memberJwt;
    let memberUserId;

    before('Create a member role to delete', async () => {
      await resetDatabase();
      const res = await modelUtils.createAndVerifyAddress({ chain });
      memberAddress = res.address;
      memberAddressId = res.address_id;
      memberJwt = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
      memberUserId = res.user_id;
      // make the user an admin
      await modelUtils.updateRole({
        address_id: memberAddressId,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
    });

    it('should fail to delete admin role when there are no other admins', async () => {
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
      expect(res.body.error).to.be.equal(deleteErrors.OtherAdminDNE);
    });

    it('should delete member role', async () => {
      // create another admin
      const newAddress = await modelUtils.createAndVerifyAddress({ chain });
      await modelUtils.updateRole({
        address_id: newAddress.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
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
      console.log(res.body);
      expect(res.body.status).to.be.equal('Success');
      const address = await models.Address.findOne({
        where: {
          id: memberAddressId,
        },
      });
      expect(address.role).to.equal('member');
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
  });

  describe('/bulkMembers route test', () => {
    it('should grab bulk members for a public community', async () => {
      const res = await chai.request
        .agent(app)
        .get('/api/bulkMembers')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJwt,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.length).to.be.greaterThan(0);
    });

    it.skip('should fail to grab bulk members if community is not visible to user', async () => {
      const communityArgs: modelUtils.CommunityArgs = {
        jwt: adminJwt,
        isAuthenticatedForum: 'false',
        privacyEnabled: 'true',
        id: 'test',
        name: 'test community',
        creator_address: adminAddress,
        creator_chain: chain,
        description: 'test enabled community',
        default_chain: chain,
      };
      const testCommunity = await modelUtils.createCommunity(communityArgs);
      const res = await chai.request
        .agent(app)
        .get('/api/bulkMembers')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJwt,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.length).to.be.greaterThan(0);
    });
  });
});
