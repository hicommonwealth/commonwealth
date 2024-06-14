import { assert } from 'chai';
import { describe, test } from 'vitest';
import {
  handleMappingAbiInputs,
  validateAbiInput,
} from '../../../client/scripts/helpers/abi_form_helpers';

describe('validateAbiInput() unit tests', () => {
  test('should validate correct address args', () => {
    const input = '0x0000000000000000000000000000000000000000';
    const inputType = 'address';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  test('should validate correct uint args', () => {
    const input = '123';
    const inputType = 'uint256';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  test('should validate correct bool args', () => {
    const input = 'true';
    const inputType = 'bool';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  test('should validate correct bytes args', () => {
    const input = '0x0000000000000000000000000000000000000000';
    const inputType = 'bytes32';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  test('should validate correct string args', () => {
    const input = 'hello world';
    const inputType = 'string';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
  test('should validate correct array args', () => {
    const input = '[1,2,3]';
    const inputType = 'uint256[]';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });

  test('should fail to validate incorrect address args', () => {
    // Incorrect address length
    const input = '0x000000000000000000000000000000000000000';
    const inputType = 'address';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'failure');
  });

  test('should fail to validate incorrect uint args', () => {
    const input = '123.5';
    const inputType = 'uint256';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'failure');
  });

  test('should fail to validate incorrect bool args', () => {
    const input = 'maybe';
    const inputType = 'bool';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'failure');
  });
  test('should validate string args with mix of numeric and non-numeric characters', () => {
    const input = '123hello##@4--asdf';
    const inputType = 'string';

    const [validation_status] = validateAbiInput(input, inputType);
    assert.equal(validation_status, 'success');
  });
});

describe('handleMappingAbiInputs() unit tests', () => {
  test('should store correct address args', () => {
    const inputIndex = 5;
    const input = '0x0000000000000000000000000000000000000000';
    const functionName = 'testFunction';
    const inputMap = new Map<string, Map<number, string>>();
    handleMappingAbiInputs(inputIndex, input, functionName, inputMap);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex), input);
  });
  test('should store correct args with multiple calls', () => {
    const inputIndex = 5;
    const input = '123';
    const functionName = 'testFunction';
    const inputMap = new Map<string, Map<number, string>>();
    handleMappingAbiInputs(inputIndex, input, functionName, inputMap);
    const inputIndex2 = 6;
    const input2 = '456';
    handleMappingAbiInputs(inputIndex2, input2, functionName, inputMap);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex), input);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex2), input2);
  });
  test('should store correct args with multiple calls and multiple functions', () => {
    const inputIndex = 5;
    const input = '123';
    const functionName = 'testFunction';
    const inputMap = new Map<string, Map<number, string>>();
    handleMappingAbiInputs(inputIndex, input, functionName, inputMap);
    const inputIndex2 = 6;
    const input2 = '456';
    handleMappingAbiInputs(inputIndex2, input2, functionName, inputMap);
    const inputIndex3 = 7;
    const input3 = '789';
    const functionName2 = 'testFunction2';
    handleMappingAbiInputs(inputIndex3, input3, functionName2, inputMap);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex), input);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex2), input2);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName2).get(inputIndex3), input3);
  });

  test('should handle abi inputs that are a mix of numeric and string types', () => {
    const inputIndex = 0;
    const input = '123hello';
    const functionName = 'testFunction';
    const inputMap = new Map<string, Map<number, string>>();
    handleMappingAbiInputs(inputIndex, input, functionName, inputMap);
    const inputIndex2 = 1;
    const input2 = 'hello-world432x0x0123';
    handleMappingAbiInputs(inputIndex2, input2, functionName, inputMap);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex), input);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex2), input2);
  });

  test('should handle abi input that is a special characters with multiple calls', () => {
    const inputIndex = 0;
    const input = '123';
    const functionName = '$$%asdjfkl;12';
    const inputMap = new Map<string, Map<number, string>>();
    handleMappingAbiInputs(inputIndex, input, functionName, inputMap);
    // @ts-expect-error StrictNullChecks
    assert.equal(inputMap.get(functionName).get(inputIndex), input);
  });
});

// describe('processAbiInputsToDataTypes() unit tests', () => {
//   test('should properly parse bytes type', () => {
//     const inputIndex = 0;
//     const input = '123';
//     const functionName = 'testFunction';
//     const inputMap = new Map<string, Map<number, string>>();
//     handleMappingAbiInputs(inputIndex, input, functionName, inputMap);

//     const functionInputs = [
//       {
//         name: 'test',
//         type: 'uint256',
//       },
//     ];
//     const processedArgs = processAbiInputsToDataTypes(
//       functionName,
//       functionInputs,
//       inputMap
//     );
//     expect(processedArgs).to.deep.equal([BigNumber.from(123)]);
//   });

//   test('should return empty array if inputs array is empty', () => {
//     const inputIndex = 0;
//     const input = '123';
//     const functionName = 'testFunction';
//     const inputMap = new Map<string, Map<number, string>>();
//     handleMappingAbiInputs(inputIndex, input, functionName, inputMap);

//     const functionInputs = [];
//     const processedArgs = processAbiInputsToDataTypes(
//       functionName,
//       functionInputs,
//       inputMap
//     );
//     expect(processedArgs).to.deep.equal([]);
//   });
// });
