import { assert } from 'chai';
import models from '../../../server/database';
import AdminOnlyRule from '../../../server/ruleTypes/adminOnly';
import { validateRule } from '../../../server/util/rules/ruleParser';
import * as modelUtils from '../../util/modelUtils';

describe('AdminOnly rule tests', () => {
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

  it('should validate correct adminOnly rule', () => {
    const rule = { AdminOnlyRule: [] };
    const sanitizedRule = validateRule(rule);
    assert.deepEqual(rule, sanitizedRule);
  });

  it('should pass adminOnly rule on admin', async () => {
    // assign admin role to loggedInAddr
    const memberClass = await models.MemberClass.findOne({
      where: { chain_id: chain, name: 'admin' },
    });
    await models['Membership'].create({
      address_id: loggedInAddrId,
      member_class_id: memberClass.id,
    });
    const rule = { AdminOnlyRule: [] as [] };
    const ruleType = new AdminOnlyRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isTrue(result);
  });

  it('should fail adminOnly rule on member', async () => {
    // assign member role to loggedInAddr
    const memberClass = await models.MemberClass.findOne({
      where: { chain_id: chain, name: 'member' },
    });
    await models['Membership'].create({
      address_id: loggedInAddrId,
      member_class_id: memberClass.id,
    });
    const rule = { AdminOnlyRule: [] as [] };
    const ruleType = new AdminOnlyRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });

  it('should fail adminOnly rule when no role exists', async () => {
    const rule = { AdminOnlyRule: [] as [] };
    const ruleType = new AdminOnlyRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });
});
