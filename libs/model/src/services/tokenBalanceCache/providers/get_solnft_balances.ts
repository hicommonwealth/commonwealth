import { logger } from '@hicommonwealth/core';
import { fetchAllDigitalAssetByOwner } from '@metaplex-foundation/mpl-token-metadata';
import { isSome, publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { Connection } from '@solana/web3.js';
import type { ChainNodeInstance } from '../../../models/chain_node';
import { Balances, GetSPLBalancesOptions } from '../types';
import { failingChainNodeError } from '../util';

const log = logger(import.meta);

export async function __get_solnft_balances(
  chainNode: ChainNodeInstance,
  options: GetSPLBalancesOptions,
): Promise<Balances> {
  const rpcEndpoint = chainNode.private_url || chainNode.url;
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
  try {
    const umi = createUmi(connection.rpcEndpoint);
    const ownerPublicKey = publicKey(address);
    const collectionKey = publicKey(mintAddress);

    const nfts = await fetchAllDigitalAssetByOwner(umi, ownerPublicKey);

    // Filter NFTs belonging to the specific collection
    const collectionNFTs = nfts.filter(
      (nft) =>
        isSome(nft.metadata.collection) &&
        nft.metadata.collection.value.key === collectionKey,
    );

    return collectionNFTs.length.toString();
  } catch (e) {
    return '0';
  }
}
