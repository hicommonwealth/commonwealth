import { assert } from 'chai';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { Op } from 'sequelize';
import models from 'server/database';
import type { CommunityInstance } from 'server/models/communities';
import {
  createDefaultCommunityRoles,
  createRole,
  findAllRoles,
  findOneRole,
} from 'server/util/roles';
import * as modelUtils from 'test/util/modelUtils';

describe('findAllRoles and findOneRole tests', () => {
  let loggedInAddr, loggedInAddr2: string;
  let loggedInAddrId, loggedInAddrId2: number;
  const chain = 'ethereum';
  let newChain: CommunityInstance;
  let newChain2: CommunityInstance;

  beforeEach(
    'reset server and create new address, user, and community roles ',
    async () => {
      const { address } = modelUtils.generateEthAddress();
      const { address: address2 } = modelUtils.generateEthAddress();
      const user = await models['User'].create({
        email: address, // use address as email to maintain uniqueness
        emailVerified: true,
        isAdmin: false,
        lastVisited: '{}',
      });

      const addressObj = await models['Address'].create({
        user_id: user.id,
        address,
        chain,
        // selected: true,
        verification_token: 'PLACEHOLDER',
        verification_token_expires: null,
        verified: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
      const addressObj2 = await models['Address'].create({
        user_id: user.id,
        address: address2,
        chain,
        // selected: true,
        verification_token: 'PLACEHOLDER',
        verification_token_expires: null,
        verified: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      loggedInAddr = addressObj.address;
      loggedInAddrId = addressObj.id;
      loggedInAddr2 = addressObj2.address;
      loggedInAddrId2 = addressObj2.id;

      const chainName = `newtestChain${Math.random()}`;
      const chainName2 = `newtestChain${Math.random()}`;

      newChain = await models.Community.create({
        id: chainName,
        name: chainName,
        chain_node_id: 1,
        default_symbol: '',
        network: ChainNetwork.ERC20,
        base: ChainBase.Ethereum,
        icon_url: 'https://commonwealth.im/static/media/eth.5b2b1b1f.svg',
        active: false,
        type: ChainType.Token,
        default_allow_permissions: BigInt(0),
        default_deny_permissions: BigInt(2048),
      });

      newChain2 = await models.Community.create({
        id: chainName2,
        name: chainName2,
        chain_node_id: 1,
        default_symbol: '',
        network: ChainNetwork.ERC20,
        base: ChainBase.Ethereum,
        icon_url: 'https://commonwealth.im/static/media/eth.5b2b1b1f.svg',
        active: false,
        type: ChainType.Token,
        default_allow_permissions: BigInt(0),
        default_deny_permissions: BigInt(2048),
      });

      await createDefaultCommunityRoles(models, newChain.id);
      await createDefaultCommunityRoles(models, newChain2.id);

      await createRole(models, loggedInAddrId, newChain.id, 'member');

      await createRole(models, loggedInAddrId, newChain.id, 'admin');

      await createRole(models, loggedInAddrId2, newChain.id, 'member');

      await createRole(models, loggedInAddrId, newChain2.id, 'member');
    }
  );
  describe('findAllRoles', () => {
    it('should return an empty array if no roles are found', async () => {
      const roles = await findAllRoles(models, {}, newChain.id, ['moderator']);
      assert.deepEqual(roles, []);
    });

    it('should return an array of roles', async () => {
      const roles = await findAllRoles(models, {}, newChain.id, [
        'member',
        'admin',
        'moderator',
      ]);
      assert.equal(roles.length, 3);
    });

    it('it should return an array of roles with the specified address', async () => {
      const roles = await findAllRoles(
        models,
        { where: { address_id: loggedInAddrId } },
        newChain.id,
        ['member', 'admin', 'moderator']
      );
      assert.equal(roles.length, 2);
    });

    it('it should return an array of roles with the specified permission', async () => {
      const roles = await findAllRoles(models, {}, newChain.id, ['admin']);
      assert.equal(roles.length, 1);
    });

    it('it should return an array of roles if permissions are not specified', async () => {
      const roles = await findAllRoles(models, {}, newChain.id);
      assert.equal(roles.length, 3);
    });

    it('it should return an array of roles if a complex filter is specified', async () => {
      const roles = await findAllRoles(
        models,
        {
          include: [
            {
              model: models.Address,
              required: true,
            },
          ],
          order: [['created_at', 'DESC']],
        },
        newChain.id
      );
      assert.equal(roles[0].toJSON().Address.id, loggedInAddrId);
    });

    it('it should return an array of roles if only a filter option is passed in and chain_id is empty', async () => {
      const myAddressIds = [loggedInAddrId2];
      const roles = await findAllRoles(models, {
        where: { address_id: { [Op.in]: myAddressIds } },
        include: [models.Address],
      });
      assert.equal(roles.length, 1);
    });
  });

  describe('findOneRole', () => {
    it('should return an empty array if no roles are found', async () => {
      const role = await findOneRole(models, {}, newChain.id, ['moderator']);
      assert.isNull(role, 'role should be null');
    });

    it('should return highest role first', async () => {
      const existingRole = await findOneRole(
        models,
        { where: { address_id: loggedInAddrId } },
        newChain.id
      );

      assert.equal(existingRole.permission, 'admin');
    });

    it('should return the role corresponding to the address id and permission', async () => {
      const existingRole = await findOneRole(
        models,
        { where: { address_id: loggedInAddrId2 } },
        newChain.id
      );

      assert.equal(existingRole.toJSON().permission, 'member');
      assert.equal(existingRole.toJSON().address_id, loggedInAddrId2);
    });
  });
});
