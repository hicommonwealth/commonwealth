import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { BalanceSourceType, logger } from '@hicommonwealth/core';
import { models } from '../../../database';
import { Balances, GetCosmosBalancesOptions } from '../types';
import { cacheBalances, getCachedBalances } from './cacheBalances';
import { __getCosmosNativeBalances } from './get_cosmos_balances';
import { __getCw20Balances } from './get_cw20_balances';
import { __getCw721Balances } from './get_cw721_balances';

const log = logger().getLogger(__filename);

export async function getCosmosBalances(
  options: GetCosmosBalancesOptions,
  ttl?: number,
) {
  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      cosmos_chain_id: options.sourceOptions.cosmosChainId,
    },
  });

  if (!chainNode) {
    const msg = `ChainNode with Cosmos chain id ${options.sourceOptions.cosmosChainId} does not exist`;
    log.error(msg, undefined, {
      cosmosChainId: options.sourceOptions.cosmosChainId,
    });
    return {};
  }

  // maps an encoded address to a decoded address to avoid having to decode
  // all addresses twice before returning
  const addressMap: { [encodedAddress: string]: string } = {};
  for (const address of options.addresses) {
    try {
      const { data } = fromBech32(address);
      const encodedAddress = toBech32(chainNode.bech32!, data);
      addressMap[encodedAddress] = address;
    } catch (e) {
      if (address != '0xdiscordbot') {
        log.error(
          `Failed to decode Cosmos address`,
          e instanceof Error ? e : undefined,
          {
            address,
          },
        );
      }
    }
  }

  const validatedAddresses = Object.keys(addressMap);
  if (validatedAddresses.length === 0) return {};

  const cachedBalances = await getCachedBalances(options, validatedAddresses);

  let freshBalances = {};
  switch (options.balanceSourceType) {
    case BalanceSourceType.CosmosNative:
      freshBalances = await __getCosmosNativeBalances({
        chainNode,
        addresses: validatedAddresses,
        batchSize: options.batchSize,
      });
      break;
    case BalanceSourceType.CW20:
      freshBalances = await __getCw20Balances({
        chainNode,
        addresses: validatedAddresses,
        contractAddress: options.sourceOptions.contractAddress,
        batchSize: options.batchSize,
      });
      break;
    case BalanceSourceType.CW721:
      freshBalances = await __getCw721Balances({
        chainNode,
        addresses: validatedAddresses,
        contractAddress: options.sourceOptions.contractAddress,
        batchSize: options.batchSize,
      });
      break;
  }

  await cacheBalances(options, freshBalances, ttl);

  // this function facilitates reverting addresses to the format that was requested
  // e.g. you could request osmosis balance and give a juno address ->
  // to fetch the osmosis balance we convert juno address to osmosis address
  // and this function undoes that change
  const transformAddresses = (balances: Balances): Balances => {
    const result: Balances = {};
    for (const [address, balance] of Object.entries(balances)) {
      result[addressMap[address]] = balance;
    }
    return result;
  };

  // map to decoded addresses rather than the generated encoded addresses
  const transformedFreshBalances = transformAddresses(freshBalances);
  const transformedCachedBalances = transformAddresses(cachedBalances);

  return { ...transformedFreshBalances, ...transformedCachedBalances };
}
