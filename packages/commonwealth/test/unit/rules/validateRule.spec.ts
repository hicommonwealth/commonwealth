import { assert } from 'chai';
import { validateRule } from '../../../server/util/rules/ruleParser';

describe('validateRule() unit tests', () => {
  it('should not validate incorrect rule id', () => {

  })

  it('should not validate incorrect arg', () => {

  })

  it('should validate correct address args', () => {
    const allowListRule = { AllowListRule: [ ['hello', 'world'] ] as [string[]] };
    const sanitizedRule = validateRule(allowListRule);
    assert.deepEqual(allowListRule, sanitizedRule);
  });

  it('should not validate incorrect address args', () => {
    const allowListRule = { AllowListRule: [ ['hello', 1] ] as [string[]] };
    const sanitizedRule = validateRule(allowListRule);
    assert.deepEqual(allowListRule, sanitizedRule);
  });

  it('should validate correct rule[] args', () => {
    
  });

  it('should not validate correct rule[] args', () => {
    
  });
});
