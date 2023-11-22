import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { RedisCache } from 'common-common/src/redisCache';
import { DB } from '../../models';
import { BalanceSourceType } from '../requirementsModule/requirementsTypes';
import { __getCosmosNativeBalances } from './providers/get_cosmos_balances';
import { __getErc1155Balances } from './providers/get_erc1155_balances';
import { __getErc20Balances } from './providers/get_erc20_balances';
import { __getErc721Balances } from './providers/get_erc721_balances';
import { __getEthBalances } from './providers/get_eth_balances';
import {
  Balances,
  GetBalancesOptions,
  GetCosmosBalancesOptions,
  GetEvmBalancesOptions,
} from './types';

export class TokenBalanceCache {
  constructor(public models: DB, public redis: RedisCache) {}

  /**
   * This is the main function through which all balances should be fetched.
   * This function supports all balance sources and is fully compatible with Redis caching.
   */
  public async getBalances(options: GetBalancesOptions): Promise<Balances> {
    let balances: Balances;

    // fetch from cache

    // fetch missing from cache
    if (options.balanceSourceType === BalanceSourceType.CosmosNative) {
      balances = await this.getCosmosBalances(options);
    } else {
      balances = await this.getEvmBalances(options);
    }

    // update cache

    // return
    return balances;
  }

  private async getCosmosBalances(options: GetCosmosBalancesOptions) {
    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        cosmos_chain_id: options.sourceOptions.cosmosChainId,
      },
    });

    // maps an encoded address to a decoded address to avoid having to decode
    // all addresses twice before returning
    const addressMap: { [encodedAddress: string]: string } = {};
    for (const address of options.addresses) {
      // TODO: handle non-addresses e.g. 0xdiscobot
      try {
        const { data } = fromBech32(address);
        const encodedAddress = toBech32(chainNode.bech32, data);
        addressMap[encodedAddress] = address;
      } catch (e) {
        console.error(`Skipping address: ${address}`, e);
      }
    }

    // fetch from cache

    // fetch missing from cache
    const result = await __getCosmosNativeBalances.call(this, {
      chainNode,
      addresses: Object.keys(addressMap),
    });

    // update cache

    // map to decoded addresses rather than the generated encoded addresses
    const balances: Balances = {};
    for (const [address, balance] of Object.entries(result)) {
      balances[addressMap[address]] = balance as string;
    }

    return balances;
  }

  private async getEvmBalances(options: GetEvmBalancesOptions) {
    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        eth_chain_id: options.sourceOptions.evmChainId,
      },
    });

    switch (options.balanceSourceType) {
      case BalanceSourceType.ETHNative:
        return await __getEthBalances.call(this, {
          chainNode,
          addresses: options.addresses,
        });
      case BalanceSourceType.ERC20:
        return await __getErc20Balances.call(this, {
          chainNode,
          addresses: options.addresses,
          contractAddress: options.sourceOptions.contractAddress,
        });
      case BalanceSourceType.ERC721:
        return await __getErc721Balances.call(this, {
          chainNode,
          addresses: options.addresses,
          contractAddress: options.sourceOptions.contractAddress,
        });
      case BalanceSourceType.ERC1155:
        return await __getErc1155Balances.call(this, {
          chainNode,
          addresses: options.addresses,
          contractAddress: options.sourceOptions.contractAddress,
          tokenId: options.sourceOptions.tokenId,
        });
    }
  }
}
