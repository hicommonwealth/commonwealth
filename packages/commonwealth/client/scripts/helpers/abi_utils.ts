import { AbiFunction, AbiEvent, Network } from './types';

export function parseFunctionsFromABI(abiString: string): AbiFunction[] {
  console.log("Parsing functions from ABI");
  let fns: AbiFunction[] = [];
  if (abiString) {
    const abi = JSON.parse(abiString);
    fns = abi.filter((x) => x.type === "function")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
}

export function parseEventsFromABI(abiString: string): AbiEvent[] {
  console.log("Parsing Events from ABI");
  let events: AbiEvent[] = [];
  if (abiString) {
    const abi = JSON.parse(abiString);
    events = abi.filter((x) => x.type === "event")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return events;
}

function getSourceCodeEnpoint(network: Network, address: string): string {
  // Ethers JS default API key
  const apiKey = "8FG3JMZ9USS4NTA6YKEKHINU56SEPPVBJR";

  const fqdn =
    network === Network.Mainnet ? "api" : `api-${network.toLowerCase()}`;

  return `https://${fqdn}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
}

export async function getEtherscanABI(network: Network, address: string): Promise<AbiFunction[]> {
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
