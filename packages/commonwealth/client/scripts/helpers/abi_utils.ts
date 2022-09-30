import { chain } from 'web3-core/types';
import { AbiItem, AbiInput, AbiOutput } from 'web3-utils/types';

export function parseAbiItemsFromABI(abiString: string): AbiItem[] {
  try {
    return JSON.parse(abiString);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function parseFunctionsFromABI(abiString: string): AbiItem[] {
  let fns: AbiItem[] = [];
  if (abiString) {
    const abiItems = parseAbiItemsFromABI(abiString)
    fns = abiItems.filter((x) => x.type === "function")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseWriteFunctionsFromABI(abiString: string): AbiItem[] {
  let fns: AbiItem[] = [];
  if (abiString) {
    const abiItems = parseAbiItemsFromABI(abiString)
    fns = abiItems.filter((x) => x.type === "function" && x.stateMutability !== "view"
    && x.stateMutability !== "pure" && x.constant !== true)
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseFunctionFromABI(abiString: string, functionName: string): AbiItem {
  const abiFunctions = parseFunctionsFromABI(abiString);
  const functionItem = abiFunctions.find((abiItem) => abiItem.name === functionName);
  if (!functionItem) {
    throw new Error(`Could not find function ${functionName} in ABI`);
  }
  return functionItem;
}


export function parseEventsFromABI(abiString: string): AbiItem[] {
  let events: AbiItem[] = [];
  if (abiString) {
    const abiItems = parseAbiItemsFromABI(abiString)
    events = abiItems.filter((x) => x.type === "event")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return events;
}

export function parseEventFromABI(abiString: string, eventName: string): AbiItem {
  const abiEvents = parseEventsFromABI(abiString);
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

export async function getEtherscanABI(network: chain, address: string): Promise<JSON> {
  try {
    console.log("fetching from etherscan...");
    const resp = await fetch(getSourceCodeEnpoint(network, address));
    const data = await resp.json();
    const respResult = data.result[0];
    const respABI = JSON.parse(respResult.ABI);
    return respABI;
  } catch (e) {
    console.log("error", e);
  }
}
