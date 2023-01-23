import Web3 from 'web3';
import { AbiInput, AbiItem } from 'web3-utils';
import { BigNumber, ethers } from 'ethers';
import { ValidationStatus } from '../views/components/component_kit/cw_validation_text';

const Bytes32 = ethers.utils.formatBytes32String;

export function encodeFunctionSignature(abi: AbiItem): string {
  const coder = new Web3().eth.abi;
  return coder.encodeFunctionSignature(abi);
}

export function validateAbiInput(
  val: string,
  inputType: string
): [ValidationStatus, string] {
  const coder = new Web3().eth.abi;
  try {
    if (inputType.slice(-2) === '[]') {
      coder.encodeParameter(inputType, JSON.parse(val));
    } else {
      if (inputType === 'bool') {
        if (val !== 'true' && val !== 'false') {
          return ['failure', 'Input must be a boolean'];
        }
      }
      coder.encodeParameter(inputType, val);
    }
    return ['success', ''];
  } catch (e) {
    return ['failure', e.message];
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
  const processedArgs: any[] = functionInputs.map(
    (arg: AbiInput, index: number) => {
      const type = arg.type;
      if (type.substring(0, 4) === 'uint')
        return BigNumber.from(inputsMap.get(functionName).get(index));
      if (type.substring(0, 4) === 'byte')
        return Bytes32(inputsMap.get(functionName).get(index));
      if (type.slice(-2) === '[]')
        return JSON.parse(inputsMap.get(functionName).get(index));
      return inputsMap.get(functionName).get(index);
    }
  );
  return processedArgs;
}
