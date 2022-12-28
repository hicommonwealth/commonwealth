import { AbiInput, AbiItem } from 'web3-utils';
import { AbiCoder } from 'web3-eth-abi';
import { BigNumber, ethers } from 'ethers';
import { ValidationStatus } from '../views/components/component_kit/cw_validation_text';

const Bytes32 = ethers.utils.formatBytes32String;

export function validateAbiInput(
  val: string,
  inputType: string
): [ValidationStatus, string] {
  const coder = new AbiCoder();
  try {
    coder.encodeParameter(inputType, val);
    return ['success', ''];
  } catch (e) {
    return ['failure', e.message];
  }
  // TODO Array Validation will be complex. Check what cases we want to cover here
  // Cases not covered yet:
  // - Array of Arrays
  // - Array of Structs
  // - Array of Enums
  // - Array of Bytes
  // - Array of Addresses and etc
  if (inputType.slice(-2) === '[]') {
    if (val[0] !== '[' || val[val.length - 1] !== ']') {
      return ['failure', 'Input must be an array'];
    } else {
      return ['success', ''];
    }
  }
  if (inputType === 'bool') {
    if (val !== 'true' && val !== 'false') {
      return ['failure', 'Input must be a boolean'];
    }
  }
  if (inputType.substring(0, 4) === 'uint') {
    if (!Number.isNaN(Number(val))) {
      return ['success', ''];
    } else {
      return ['failure', 'Input must be a number'];
    }
  } else if (inputType === 'bool') {
    if (val === 'true' || val === 'false') {
      return ['success', ''];
    } else {
      return ['failure', 'Input must be a boolean'];
    }
  } else if (inputType === 'address') {
    if (val.length === 42) {
      return ['success', ''];
    } else {
      return ['failure', 'Input must be an address'];
    }
  } else {
    return ['success', ''];
  }
}

export function handleMappingAbiInputs(
  inputIndex: number,
  input: string,
  functionName: string,
  inputMap: Map<string, Map<number, string>>
) {
  if (!inputMap.has(functionName)) {
    inputMap.set(functionName, new Map<number, string>());
    const inputArgMap = inputMap.get(functionName);
    inputArgMap.set(inputIndex, input);
    inputMap.set(functionName, inputArgMap);
  } else {
    const inputArgMap = inputMap.get(functionName);
    inputArgMap.set(inputIndex, input);
    inputMap.set(functionName, inputArgMap);
  }
}

export function processAbiInputsToDataTypes(
  functionName: string,
  functionInputs: AbiInput[],
  inputsMap: Map<string, Map<number, string>>
): any[] {
  const processedArgs: any[] = functionInputs.map((arg: AbiInput, index: number) => {
    const type = arg.type;
    if (type.substring(0, 4) === 'uint')
      return BigNumber.from(inputsMap.get(functionName).get(index));
    if (type.substring(0, 4) === 'byte')
      return Bytes32(inputsMap.get(functionName).get(index));
    if (type.slice(-2) === '[]')
      return JSON.parse(inputsMap.get(functionName).get(index));
    return inputsMap.get(functionName).get(index);
  });
  return processedArgs;
}
