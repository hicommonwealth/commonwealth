import type {
  AbiInput,
  AbiItem,
  AbiOutput,
  AbiType,
  StateMutabilityType,
} from 'web3-utils/types';

export function parseAbiItemsFromABI(
  abi: Array<Record<string, unknown>>
): AbiItem[] {
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

export function parseFunctionsFromABI(
  abi: Array<Record<string, unknown>>
): AbiItem[] {
  let fns: AbiItem[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi);
    fns = abiItems
      .filter((x) => x.type === 'function')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseWriteFunctionsFromABI(
  abi: Array<Record<string, unknown>>
): AbiItem[] {
  let fns: AbiItem[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi);
    fns = abiItems
      .filter(
        (x) =>
          x.type === 'function' &&
          x.stateMutability !== 'view' &&
          x.stateMutability !== 'pure' &&
          x.constant !== true
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseFunctionFromABI(
  abi: Array<Record<string, unknown>>,
  functionName: string
): AbiItem {
  const abiFunctions = parseFunctionsFromABI(abi);
  const functionItem = abiFunctions.find(
    (abiItem) => abiItem.name === functionName
  );
  if (!functionItem) {
    throw new Error(`Could not find function ${functionName} in ABI`);
  }
  return functionItem;
}

export function parseEventsFromABI(
  abi: Array<Record<string, unknown>>
): AbiItem[] {
  let events: AbiItem[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi);
    events = abiItems
      .filter((x) => x.type === 'event')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return events;
}

export function parseEventFromABI(
  abi: Array<Record<string, unknown>>,
  eventName: string
): AbiItem {
  const abiEvents = parseEventsFromABI(abi);
  const eventItem = abiEvents.find((abiItem) => abiItem.name === eventName);
  if (!eventItem) {
    throw new Error(`Could not find event ${eventName} in ABI`);
  }
  return eventItem;
}
