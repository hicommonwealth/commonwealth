import { AbiEventFragment, AbiFunctionFragment, AbiParameter } from 'web3';

export function parseAbiItemsFromABI(
  abi: Array<Record<string, unknown>>,
): AbiFunctionFragment[] {
  try {
    return abi.map((item) => {
      const { name, type, inputs, outputs, stateMutability } = item;
      const abiItem: AbiFunctionFragment = {
        name: name as string,
        type: type as string,
        inputs: inputs as ReadonlyArray<AbiParameter>,
        outputs: outputs as ReadonlyArray<AbiParameter>,
        stateMutability: stateMutability as string,
      };
      return abiItem;
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function parseFunctionsFromABI(
  abi: Array<Record<string, unknown>>,
): AbiFunctionFragment[] {
  let fns: AbiFunctionFragment[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi);
    fns = abiItems
      .filter((x) => x.type === 'function')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseWriteFunctionsFromABI(
  abi: Array<Record<string, unknown>>,
): AbiFunctionFragment[] {
  let fns: AbiFunctionFragment[] = [];
  if (abi) {
    const abiItems = parseAbiItemsFromABI(abi);
    fns = abiItems
      .filter(
        (x) =>
          x.type === 'function' &&
          x.stateMutability !== 'view' &&
          x.stateMutability !== 'pure' &&
          x.constant !== true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseFunctionFromABI(
  abi: Array<Record<string, unknown>>,
  functionName: string,
): AbiFunctionFragment {
  const abiFunctions = parseFunctionsFromABI(abi);
  const functionItem = abiFunctions.find(
    (abiItem) => abiItem.name === functionName,
  );
  if (!functionItem) {
    throw new Error(`Could not find function ${functionName} in ABI`);
  }
  return functionItem;
}

export function parseEventsFromABI(
  abi: Array<Record<string, unknown>>,
): AbiEventFragment[] {
  let events: AbiEventFragment[] = [];
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
  eventName: string,
): AbiEventFragment {
  const abiEvents = parseEventsFromABI(abi);
  const eventItem = abiEvents.find((abiItem) => abiItem.name === eventName);
  if (!eventItem) {
    throw new Error(`Could not find event ${eventName} in ABI`);
  }
  return eventItem;
}
