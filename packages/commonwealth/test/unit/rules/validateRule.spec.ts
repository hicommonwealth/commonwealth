import { assert } from 'chai';
import { validateRule } from '../../../server/util/rules/ruleParser';

describe('validateRule() unit tests', () => {
  it('should not validate incorrect rule id', () => {
    const invalidRule = { ABCD: [] };
    assert.throw(() => validateRule(invalidRule));
  })

  it('should validate correct address args', () => {
    const allowListRule = { AllowListRule: [ ['hello', 'world'] ]};
    const sanitizedRule = validateRule(allowListRule);
    assert.deepEqual(allowListRule, sanitizedRule);
  });

  it('should not validate incorrect address arg type', () => {
    const badAllowList = { AllowListRule: [ ['hello', 1] ]};
    assert.throw(() => validateRule(badAllowList));
  });

  it('should not validate incorrect address arg format', () => {
    const badAllowList = { AllowListRule: ['hello'] };
    assert.throw(() => validateRule(badAllowList));
  });

  it('should validate correct rule[] args', () => {
    const goodAnyRule = {
      AnyRule: [ [
        { AllowListRule: [ ['a', 'b'] ] },
        { AllowListRule: [ ['c', 'd'] ] }
      ] ]
    };
    const sanitizedRule = validateRule(goodAnyRule);
    assert.deepEqual(goodAnyRule, sanitizedRule);
  });

  it('should not validate correct rule[] args', () => {
    const badAnyRule = {
      AnyRule: [
        { AnyRule: [
          { AllowListRule: [ ['a'] ] },
          { ABCD: [] }, // BAD
        ] },
        { AllowListRule: [ ['b'] ] }
      ]
    };
    assert.throw(() => validateRule(badAnyRule));
  });
});
