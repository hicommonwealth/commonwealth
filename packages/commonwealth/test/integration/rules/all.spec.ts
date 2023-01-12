import { assert } from 'chai';
import models from '../../../server/database';
import AllRule from '../../../server/ruleTypes/all';
import { validateRule } from '../../../server/util/rules/ruleParser';
import type { DefaultSchemaT } from '../../../server/util/rules/ruleTypes';
import * as modelUtils from '../../util/modelUtils';

describe('All rule tests', () => {
  let loggedInAddr: string;
  let loggedInAddrId: number;
  const chain = 'ethereum';

  beforeEach('reset server and create role', async () => {
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

  it('should validate correct all rule', () => {
    const rule = {
      AllRule: [
        [
          {
            AdminOnlyRule: [] as [],
          },
          {
            AllowListRule: [[loggedInAddr]] as [string[]],
          },
        ],
      ],
    };
    const sanitizedRule = validateRule(rule);
    assert.deepEqual(rule, sanitizedRule);
  });

  it('should pass all rule on admin + allowList', async () => {
    // assign admin role to loggedInAddr
    const communityRole = await models.CommunityRole.findOne({
      where: { chain_id: chain, name: 'admin' },
    });
    await models['RoleAssignment'].create({
      address_id: loggedInAddrId,
      community_role_id: communityRole.id,
    });
    const rule = {
      AllRule: [
        [
          {
            AdminOnlyRule: [] as [],
          },
          {
            AllowListRule: [[loggedInAddr]] as [string[]],
          },
        ],
      ] as [Array<DefaultSchemaT>],
    };
    const ruleType = new AllRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isTrue(result);
  });

  it('should fail all rule on admin subRule', async () => {
    const communityRole = await models.CommunityRole.findOne({
      where: { chain_id: chain, name: 'member' },
    });
    await models['RoleAssignment'].create({
      address_id: loggedInAddrId,
      community_role_id: communityRole.id,
    });
    const rule = {
      AllRule: [
        [
          {
            AdminOnlyRule: [] as [],
          },
          {
            AllowListRule: [[loggedInAddr]] as [string[]],
          },
        ],
      ] as [Array<DefaultSchemaT>],
    };
    const ruleType = new AllRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });

  it('should fail all rule on allowList subRule', async () => {
    const communityRole = await models.CommunityRole.findOne({
      where: { chain_id: chain, name: 'member' },
    });
    await models['RoleAssignment'].create({
      address_id: loggedInAddrId,
      community_role_id: communityRole.id,
    });
    const rule = {
      AllRule: [
        [
          {
            AdminOnlyRule: [] as [],
          },
          {
            AllowListRule: [['do not permit']] as [string[]],
          },
        ],
      ] as [Array<DefaultSchemaT>],
    };
    const ruleType = new AllRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });
});
