import { assert } from 'chai';
import { validateRule } from '../../../server/util/rules/ruleParser';
import AllRule from '../../../server/ruleTypes/all';
import * as modelUtils from '../../util/integration/modelUtils';
import models from '../../../server/database';
import { DefaultSchemaT } from '../../../server/util/rules/ruleTypes';

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
    const rule = { AllRule: [ [
      {
        AdminOnlyRule: [] as [],
      }, {
        AllowListRule: [ [loggedInAddr] ] as [ string[] ],
      },
    ] ] };
    const sanitizedRule = validateRule(rule);
    assert.deepEqual(rule, sanitizedRule);
  });

  it('should pass all rule on admin + allowList', async () => {
    await models['Role'].create({
      address_id: loggedInAddrId,
      chain_id: chain,
      permission: 'admin',
    });
    const rule = { AllRule: [ [
      {
        AdminOnlyRule: [] as [],
      }, {
        AllowListRule: [ [loggedInAddr] ] as [ string[] ],
      },
    ] ] as [ Array<DefaultSchemaT> ] };
    const ruleType = new AllRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isTrue(result);
  });

  it('should fail all rule on admin subRule', async () => {
    await models['Role'].create({
      address_id: loggedInAddrId,
      chain_id: chain,
      permission: 'member',
    });
    const rule = { AllRule: [ [
      {
        AdminOnlyRule: [] as [],
      }, {
        AllowListRule: [ [loggedInAddr] ] as [ string[] ],
      },
    ] ] as [ Array<DefaultSchemaT> ] };
    const ruleType = new AllRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });

  it('should fail all rule on allowList subRule', async () => {
    await models['Role'].create({
      address_id: loggedInAddrId,
      chain_id: chain,
      permission: 'member',
    });
    const rule = { AllRule: [ [
      {
        AdminOnlyRule: [] as [],
      }, {
        AllowListRule: [ ['do not permit'] ] as [ string[] ],
      },
    ] ] as [ Array<DefaultSchemaT> ] };
    const ruleType = new AllRule();
    const result = await ruleType.check(rule, loggedInAddr, chain, models);
    assert.isFalse(result);
  });
});
