import { assert } from 'chai';
import models from '../../../server/database';
import { validateRule } from '../../../server/util/rules/ruleParser';
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
});
