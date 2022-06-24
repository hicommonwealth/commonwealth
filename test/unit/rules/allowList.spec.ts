import { assert } from 'chai';
import { validateRule } from '../../../server/util/rules/ruleParser';
import AllowListRule from '../../../server/ruleTypes/allowList';

describe('AllowList rule tests', () => {
  it('should validate correct allowList rule', () => {
    const allowListRule = { AllowListRule: [ ['hello', 'world'] ] as [string[]] };
    const sanitizedRule = validateRule(allowListRule);
    assert.deepEqual(allowListRule, sanitizedRule);
  });

  it('should pass allowList rule', async () => {
    const allowListRule = { AllowListRule: [ ['hello', 'world'] ] as [string[]] };
    const allowListType = new AllowListRule();
    const result = await allowListType.check(allowListRule, 'world');
    assert.isTrue(result);
  });

  it('should fail allowList rule', async () => {
    const allowListRule = { AllowListRule: [ ['hello', 'world'] ] as [string[]] };
    const allowListType = new AllowListRule();
    const result = await allowListType.check(allowListRule, 'whoops');
    assert.isFalse(result);
  });
});
