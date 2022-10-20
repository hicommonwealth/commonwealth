import { chain } from 'web3-core/types';
import { AbiItem, AbiInput, AbiOutput, StateMutabilityType, AbiType } from 'web3-utils/types';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';

export function parseAbiItemsFromABI(abi: Array<Record<string, unknown>>): AbiItem[] {
  try {
    return abi.map((item) => {
      const { name, type, inputs, outputs, stateMutability } = item;
      const abiItem: AbiItem = {
        name: name as string,
        type: type as AbiType,
        inputs: inputs as AbiInput[],
        outputs: outputs as AbiOutput[],
        stateMutability: stateMutability as StateMutabilityType,
      };
      return abiItem;
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function parseFunctionsFromABI(abi: Array<Record<string, unknown>>): AbiItem[] {
  let fns: AbiItem[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi)
    fns = abiItems.filter((x) => x.type === "function")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseWriteFunctionsFromABI(abi: Array<Record<string, unknown>>): AbiItem[] {
  let fns: AbiItem[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi)
    fns = abiItems.filter((x) => x.type === "function" && x.stateMutability !== "view"
    && x.stateMutability !== "pure" && x.constant !== true)
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseFunctionFromABI(abi: Array<Record<string, unknown>>, functionName: string): AbiItem {
  const abiFunctions = parseFunctionsFromABI(abi);
  const functionItem = abiFunctions.find((abiItem) => abiItem.name === functionName);
  if (!functionItem) {
    throw new Error(`Could not find function ${functionName} in ABI`);
  }
  return functionItem;
}


export function parseEventsFromABI(abi: Array<Record<string, unknown>>): AbiItem[] {
  let events: AbiItem[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi)
    events = abiItems.filter((x) => x.type === "event")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return events;
}

export function parseEventFromABI(abi: Array<Record<string, unknown>>, eventName: string): AbiItem {
  const abiEvents = parseEventsFromABI(abi);
  const eventItem = abiEvents.find((abiItem) => abiItem.name === eventName);
  if (!eventItem) {
    throw new Error(`Could not find event ${eventName} in ABI`);
  }
  return eventItem;
}

function getSourceCodeEnpoint(network: chain, address: string): string {
  // Ethers JS default API key
  const apiKey = "8FG3JMZ9USS4NTA6YKEKHINU56SEPPVBJR";

  const fqdn =
    network === "mainnet" ? "api" : `api-${network.toLowerCase()}`;

  return `https://${fqdn}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
}

export async function getEtherscanABI(network: chain, address: string): Promise<Array<Record<string,unknown>>> {
  try {
    console.log("fetching from etherscan...");
    const resp = await fetch(getSourceCodeEnpoint(network, address));
    const data = await resp.json();
    const respResult = data.result[0];
    return respResult.ABI;
  } catch (e) {
    console.log("error", e);
  }
}

export function validateAbiInput(val: string, input: AbiInput): [ValidationStatus, string] {
    // TODO Array Validation will be complex. Check what cases we want to cover here
    if (input.type.slice(-2) === '[]') {
      if (
        val[0] !== '[' ||
        val[val.length - 1] !== ']'
      ) {
        return [
          'failure',
          'Input must be an array',
        ];
      } else {
        return ['success', ''];
      }
    }
    if (input.type === 'bool') {
      if (val !== 'true' && val !== 'false') {
        return [
          'failure',
          'Input must be a boolean',
        ];
      }
    }
    if (input.type.substring(0, 4) === 'uint') {
      if (!Number.isNaN(Number(val))) {
        return ['success', ''];
      } else {
        return [
          'failure',
          'Input must be a number',
        ];
      }
    } else if (input.type === 'bool') {
      if (val === 'true' || val === 'false') {
        return ['success', ''];
      } else {
        return [
          'failure',
          'Input must be a boolean',
        ];
      }
    } else if (input.type === 'address') {
      if (val.length === 42) {
        return ['success', ''];
      } else {
        return [
          'failure',
          'Input must be an address',
        ];
      }
    } else {
      return ['success', ''];
    }
  }
}
