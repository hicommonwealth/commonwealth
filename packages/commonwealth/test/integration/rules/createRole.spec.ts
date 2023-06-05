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
});
