import { logger } from '@hicommonwealth/logging';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import { models } from '../../../database';
import { Balances, GetEvmBalancesOptions } from '../types';
import { cacheBalances, getCachedBalances } from './cacheBalances';
import { __getErc1155Balances } from './get_erc1155_balances';
import { __getErc20Balances } from './get_erc20_balances';
import { __getErc721Balances } from './get_erc721_balances';
import { __getEthBalances } from './get_eth_balances';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function getEvmBalances(
  options: GetEvmBalancesOptions,
  ttl?: number,
) {
  const validatedAddresses: string[] = [];
  for (const address of options.addresses) {
    if (Web3.utils.isAddress(address)) {
      validatedAddresses.push(address);
    } else {
      log.info(`Skipping non-address ${address}`);
    }
  }

  if (validatedAddresses.length === 0) return {};

  const cachedBalances = await getCachedBalances(options, validatedAddresses);

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      eth_chain_id: options.sourceOptions.evmChainId,
    },
  });

  if (!chainNode) {
    const msg = `ChainNode with evmChainId ${options.sourceOptions.evmChainId} does not exist`;
    log.error(msg, undefined, { evmChainId: options.sourceOptions.evmChainId });
    return {};
  }

  let freshBalances: Balances = {};
  switch (options.balanceSourceType) {
    case BalanceSourceType.ETHNative:
      freshBalances = await __getEthBalances({
        chainNode,
        addresses: validatedAddresses,
        batchSize: options.batchSize,
      });
      break;
    case BalanceSourceType.ERC20:
      freshBalances = await __getErc20Balances({
        chainNode,
        addresses: validatedAddresses,
        contractAddress: options.sourceOptions.contractAddress,
        batchSize: options.batchSize,
      });
      break;
    case BalanceSourceType.ERC721:
      freshBalances = await __getErc721Balances({
        chainNode,
        addresses: validatedAddresses,
        contractAddress: options.sourceOptions.contractAddress,
        batchSize: options.batchSize,
      });
      break;
    case BalanceSourceType.ERC1155:
      freshBalances = await __getErc1155Balances({
        chainNode,
        addresses: validatedAddresses,
        contractAddress: options.sourceOptions.contractAddress,
        tokenId: options.sourceOptions.tokenId,
        batchSize: options.batchSize,
      });
      break;
  }

  await cacheBalances(options, freshBalances, ttl);

  return { ...freshBalances, ...cachedBalances };
}
