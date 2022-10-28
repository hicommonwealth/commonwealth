import { assert } from 'chai';
import {
  handleMappingAbiInputs,
  processAbiInputsToDataTypes,
  validateAbiInput,
} from 'client/scripts/helpers/abi_form_helpers';
import { validateRule } from '../../../server/util/rules/ruleParser';

describe('validateAbiInput() unit tests', () => {
  it('should validate correct address args', () => {
    const input = '0x0000000000000000000000000000000000000000';
    const inputType = 'address';

    const [validation_status, message] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  it('should validate correct uint args', () => {
    const input = '123';
    const inputType = 'uint256';

    const [validation_status, message] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  it('should validate correct bool args', () => {
    const input = 'true';
    const inputType = 'bool';

    const [validation_status, message] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  it('should validate correct bytes args', () => {
    const input = '0x0000000000000000000000000000000000000000';
    const inputType = 'bytes32';

    const [validation_status, message] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  it('should validate correct string args', () => {
    const input = 'hello world';
    const inputType = 'string';

    const [validation_status, message] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  it('should validate correct array args', () => {
    const input = '[1,2,3]';
    const inputType = 'uint256[]';

    const [validation_status, message] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
});

// describe('handleMappingAbiInputs() unit tests', () => {
//   it('should validate correct address args', () => {
//     const allowListRule = { AllowListRule: [['hello', 'world']] };
//     const sanitizedRule = handleMappingAbiInputs(allowListRule);
//     assert.deepEqual(allowListRule, sanitizedRule);
//   });

//   it('should not validate incorrect address arg type', () => {
//     const badAllowList = { AllowListRule: [['hello', 1]] };
//     assert.throw(() => validateRule(badAllowList));
//   });

//   it('should not validate incorrect address arg format', () => {
//     const badAllowList = { AllowListRule: ['hello'] };
//     assert.throw(() => validateRule(badAllowList));
//   });
// });

// describe('processAbiInputsToDataTypes() unit tests', () => {
//   it('should validate correct address args', () => {
//     const allowListRule = { AllowListRule: [['hello', 'world']] };
//     const sanitizedRule = processAbiInputsToDataTypes(allowListRule);
//     assert.deepEqual(allowListRule, sanitizedRule);
//   });

//   it('should not validate incorrect address arg type', () => {
//     const badAllowList = { AllowListRule: [['hello', 1]] };
//     assert.throw(() => validateRule(badAllowList));
//   });

//   it('should not validate incorrect address arg format', () => {
//     const badAllowList = { AllowListRule: ['hello'] };
//     assert.throw(() => validateRule(badAllowList));
//   });
// });
