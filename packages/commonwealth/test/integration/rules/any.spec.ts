import { assert } from 'chai';
import models from '../../../server/database';
import AnyRule from '../../../server/ruleTypes/any';
import { validateRule } from '../../../server/util/rules/ruleParser';
import type { DefaultSchemaT } from '../../../server/util/rules/ruleTypes';
import * as modelUtils from '../../util/modelUtils';

describe('Any rule tests', () => {
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

  it('should validate correct any rule', () => {
    const rule = {
      AnyRule: [
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

  it('should pass any rule on admin subRule', async () => {
    const memberClass = await models.MemberClass.findOne({
      where: { chain_id: chain, name: 'admin' },
    });
    await models['Membership'].create({
      address_id: loggedInAddrId,
      member_class_id: memberClass.id,
    });
    const rule = {
      AnyRule: [
        [
          {
            AdminOnlyRule: [] as [],
          },
          {
            AllowListRule: [['unknown']] as [string[]],
          },
        ],
      ] as [Array<DefaultSchemaT>],
    };
    const ruleType = new AnyRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isTrue(result);
  });

  it('should pass any rule on allowList subRule', async () => {
    const memberClass = await models.MemberClass.findOne({
      where: { chain_id: chain, name: 'member' },
    });
    await models['Membership'].create({
      address_id: loggedInAddrId,
      member_class_id: memberClass.id,
    });
    const rule = {
      AnyRule: [
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
    const ruleType = new AnyRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isTrue(result);
  });

  it('should fail all rule', async () => {
    const memberClass = await models.MemberClass.findOne({
      where: { chain_id: chain, name: 'member' },
    });
    await models['Membership'].create({
      address_id: loggedInAddrId,
      member_class_id: memberClass.id,
    });
    const rule = {
      AnyRule: [
        [
          {
            AdminOnlyRule: [] as [],
          },
          {
            AllowListRule: [['unknown']] as [string[]],
          },
        ],
      ] as [Array<DefaultSchemaT>],
    };
    const ruleType = new AnyRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });
});
