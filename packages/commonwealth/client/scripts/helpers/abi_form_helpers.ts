import { AbiInput, AbiItem } from 'web3-utils';
import { BigNumber, ethers } from 'ethers';
import { ValidationStatus } from '../views/components/component_kit/cw_validation_text';

const Bytes32 = ethers.utils.formatBytes32String;

export function validateAbiInput(
  val: string,
  input: AbiInput
): [ValidationStatus, string] {
  // TODO Array Validation will be complex. Check what cases we want to cover here
  if (input.type.slice(-2) === '[]') {
    if (val[0] !== '[' || val[val.length - 1] !== ']') {
      return ['failure', 'Input must be an array'];
    } else {
      return ['success', ''];
    }
  }
  if (input.type === 'bool') {
    if (val !== 'true' && val !== 'false') {
      return ['failure', 'Input must be a boolean'];
    }
  }
  if (input.type.substring(0, 4) === 'uint') {
    if (!Number.isNaN(Number(val))) {
      return ['success', ''];
    } else {
      return ['failure', 'Input must be a number'];
    }
  } else if (input.type === 'bool') {
    if (val === 'true' || val === 'false') {
      return ['success', ''];
    } else {
      return ['failure', 'Input must be a boolean'];
    }
  } else if (input.type === 'address') {
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
  abiItem: AbiItem,
  inputMap: Map<string, Map<number, string>>
) {
  if (!inputMap.has(abiItem.name)) {
    inputMap.set(abiItem.name, new Map<number, string>());
    const inputArgMap = inputMap.get(abiItem.name);
    inputArgMap.set(inputIndex, input);
    inputMap.set(abiItem.name, inputArgMap);
  } else {
    const inputArgMap = inputMap.get(abiItem.name);
    inputArgMap.set(inputIndex, input);
    inputMap.set(abiItem.name, inputArgMap);
  }
}

export function processAbiInputsToDataTypes(
  fn: AbiItem,
  inputsMap: Map<string, Map<number, string>>
): any[] {
  const processedArgs: any[] = fn.inputs.map((arg: AbiInput, index: number) => {
    const type = arg.type;
    if (type.substring(0, 4) === 'uint')
      return BigNumber.from(inputsMap.get(fn.name).get(index));
    if (type.substring(0, 4) === 'byte')
      return Bytes32(inputsMap.get(fn.name).get(index));
    if (type.slice(-2) === '[]')
      return JSON.parse(inputsMap.get(fn.name).get(index));
    return inputsMap.get(fn.name).get(index);
  });
  return processedArgs;
}
