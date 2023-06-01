import { assert } from 'chai';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import models from 'server/database';
import * as modelUtils from 'test/util/modelUtils';
import { createRole } from '../../../server/util/roles';

describe('createRole tests', () => {
  let loggedInAddr: string;
  let loggedInAddrId: number;
  const chain = 'ethereum';

  beforeEach('reset server and create new address and user', async () => {
    const { address } = modelUtils.generateEthAddress();
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

    loggedInAddr = addressObj.address;
    loggedInAddrId = addressObj.id;
  });

  it('should create a proper role assignment', async () => {
    const oldRole = await models.Address.create({
      id: loggedInAddrId,
      chain: chain,
      role: 'member',
    });

    const roleInstanceWithPermission = await createRole(
      models,
      loggedInAddrId,
      chain,
      'member'
    );

    assert.deepEqual(
      oldRole.toJSON().chain,
      roleInstanceWithPermission.toJSON().chain_id
    );
    assert.deepEqual(
      oldRole.toJSON().id,
      roleInstanceWithPermission.toJSON().address_id
    );
    assert.deepEqual(
      oldRole.toJSON().role,
      roleInstanceWithPermission.toJSON().permission
    );
  });

  it('should throw an error if the address does not exist', async () => {
    try {
      await createRole(models, -1, chain, 'member');
    } catch (error) {
      assert.deepEqual(
        error.message,
        'insert or update on table "RoleAssignments" violates foreign key constraint "RoleAssignments_id_fkey"'
      );
    }
  });

  it('should throw an error if the chain does not exist', async () => {
    try {
      await createRole(models, loggedInAddrId, 'nonexistent', 'member');
    } catch (error) {
      assert.deepEqual(
        error.message,
        'insert or update on table "CommunityRoles" violates foreign key constraint "CommunityRoles_chain_fkey"'
      );
    }
  });

  it('create default community roles should properly create all permission roles for a new chain', async () => {
    const newChain = `newtestChain${Math.random()}`;
    const chainObj = await models.Chain.create({
      id: newChain,
      name: newChain,
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

    const roles = await models.Chain.findAll({
      where: { id: chainObj.id },
    });
    assert.deepEqual(roles.length, 1);
    assert.deepEqual(roles[0].allowed_roles, 7);
  });
});
