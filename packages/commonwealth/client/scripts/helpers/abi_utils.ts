import { Contract }from '../models';
import { Network } from './types';

export const parseFunctionsFromABI = (abiString: string) => {
  console.log("Parsing functions from ABI");
  let fns = [];
  if (abiString) {
    console.log("Attempting JSON parse functions from ABI");
    const abi = JSON.parse(abiString);
    fns = abi.filter((x) => x.type === "function")
    .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fns;
};

function getSourceCodeEnpoint(network: Network, address: string): string {
  // Ethers JS default API key
  const apiKey = "8FG3JMZ9USS4NTA6YKEKHINU56SEPPVBJR";

  const fqdn =
    network === Network.Mainnet ? "api" : `api-${network.toLowerCase()}`;

  return `https://${fqdn}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
}

export const getEtherscanABI = async (network: Network, address: string) => {
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
};
