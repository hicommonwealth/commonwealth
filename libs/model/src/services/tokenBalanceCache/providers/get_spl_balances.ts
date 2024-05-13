import { logger } from '@hicommonwealth/logging';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { ChainNodeInstance } from 'model/src/models/chain_node';
import { fileURLToPath } from 'url';
import { Balances } from '../types';
import { failingChainNodeError } from '../util';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export type GetSPLBalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  mintAddress: string;
  batchSize?: number;
};

export async function __get_spl_balances(
  options: GetSPLBalancesOptions,
): Promise<Balances> {
  const rpcEndpoint = options.chainNode.private_url || options.chainNode.url;
  if (options.addresses.length === 1) {
    const balances: Balances = {};
    balances[options.addresses[0]] = await getSingleSPLBalance(
      new Connection(rpcEndpoint),
      options.mintAddress,
      options.addresses[0],
    );
    return balances;
  }

  return (
    await getBulkSPLBalances(
      rpcEndpoint,
      options.mintAddress,
      options.addresses,
      options.batchSize,
    )
  ).balances;
}

async function getBulkSPLBalances(
  rpcEndpoint: string,
  mintAddress: string,
  addresses: string[],
  batchSize = 100,
): Promise<{ balances: Balances; failedAddresses: string[] }> {
  const connection = new Connection(rpcEndpoint);
  let batchRequestPromises = [];
  const idAddressMap: Balances = {};
  const balances: Balances = {};
  let failedAddresses: string[] = [];
  let id = 0;
  for (
    let startIndex = 0;
    startIndex < addresses.length;
    startIndex += batchSize
  ) {
    const endIndex = Math.min(startIndex + batchSize, addresses.length);
    const batchAddresses = addresses.slice(startIndex, endIndex);
    for (const address of batchAddresses) {
      batchRequestPromises.push(
        getSingleSPLBalance(connection, mintAddress, address),
      );
      idAddressMap[id] = address;
      ++id;
    }
    const responses = await Promise.allSettled(batchRequestPromises);
    const chainNodeErrorMsg =
      `${failingChainNodeError} RPC batch request failed for method getTokenAccountBalance ` +
      `with batch size ${batchSize} on Solana ${mintAddress}`;
    responses.forEach((res, index) => {
      if (res.status === 'rejected') {
        const relevantAddress = idAddressMap[index];
        failedAddresses = [...failedAddresses, relevantAddress];
        log.fatal(chainNodeErrorMsg, res.reason);
      } else {
        balances[idAddressMap[index]] = res.value;
      }
    });
    batchRequestPromises = [];
    id = 0;
  }
  return { balances, failedAddresses };
}

async function getSingleSPLBalance(
  connection: Connection,
  mintAddress: string,
  address: string,
): Promise<string> {
  const addressATA = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(address),
  );

  const info = await connection.getTokenAccountBalance(addressATA);
  if (info.value.uiAmount == null) {
    return '0';
  }
  return info.value.amount;
}
