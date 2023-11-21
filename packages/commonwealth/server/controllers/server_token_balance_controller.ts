import { RedisCache } from 'common-common/src/redisCache';
import { DB } from '../models';
import { BalanceSourceType } from '../util/requirementsModule/requirementsTypes';
import { __getCosmosNativeBalances } from './server_token_balance_methods/get_cosmos_balances';
import { __getErc1155Balances } from './server_token_balance_methods/get_erc1155_balances';
import { __getErc20Balances } from './server_token_balance_methods/get_erc20_balances';
import { __getErc721Balances } from './server_token_balance_methods/get_erc721_balances';
import { __getEthBalances } from './server_token_balance_methods/get_eth_balances';

type GetCosmosBalanceOptions = {
  balanceSourceType: BalanceSourceType.CosmosNative;
  addresses: string[];
  sourceOptions: {
    cosmosChainId: string;
  };
};

type GetEvmBalancesBase = {
  addresses: string[];
  sourceOptions: {
    evmChainId: number;
  };
};

type GetErc20BalanceOptions = GetEvmBalancesBase & {
  balanceSourceType: BalanceSourceType.ERC20;
  sourceOptions: {
    contractAddress: string;
  };
};

type GetErc721BalanceOptions = GetEvmBalancesBase & {
  balanceSourceType: BalanceSourceType.ERC721;
  sourceOptions: {
    contractAddress: string;
  };
};

type GetErc1155BalanceOptions = GetEvmBalancesBase & {
  balanceSourceType: BalanceSourceType.ERC1155;
  sourceOptions: {
    contractAddress: string;
    tokenId: string;
  };
};

type GetEthNativeBalanceOptions = GetEvmBalancesBase & {
  balanceSourceType: BalanceSourceType.ETHNative;
};

type GetEvmBalancesOptions =
  | GetEthNativeBalanceOptions
  | GetErc20BalanceOptions
  | GetErc721BalanceOptions
  | GetErc1155BalanceOptions;

export type GetBalancesOptions =
  | GetEvmBalancesOptions
  | GetCosmosBalanceOptions;

export type Balances = { [address: string]: string };

export class ServerTokenBalanceController {
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

  private async getCosmosBalances(options: GetCosmosBalanceOptions) {
    const chainNode = await this.models.ChainNode.scope(
      'withPrivateData',
    ).findOne({
      where: {
        cosmos_chain_id: options.sourceOptions.cosmosChainId,
      },
    });

    return await __getCosmosNativeBalances.call(this, {
      chainNode,
      addresses: options.addresses,
    });
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
