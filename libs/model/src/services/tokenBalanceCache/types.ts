import { Denominations } from '@hicommonwealth/evm-protocols';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { ChainNodeInstance } from '../../models/chain_node';

export type Balances = { [address: string]: string };

export type OptionsWithBalances = {
  options: GetBalancesOptions;
  balances: Balances;
};

type TbcConfigOptions = {
  cacheRefresh?: boolean;
  batchSize?: number;
};

type GetEvmBalancesBase = {
  addresses: string[];
  sourceOptions: {
    evmChainId: number;
  };
} & TbcConfigOptions;

type GetCosmosBalancesBase = {
  addresses: string[];
  sourceOptions: {
    cosmosChainId: string;
  };
} & TbcConfigOptions;

type GetSuiBalancesBase = {
  addresses: string[];
  sourceOptions: {
    suiNetwork: string;
  };
} & TbcConfigOptions;

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

export type GetErc1155BalanceOptions = GetEvmBalancesBase & {
  balanceSourceType: BalanceSourceType.ERC1155;
  sourceOptions: {
    contractAddress: string;
    tokenId: number;
  };
};

export type GetEthNativeBalanceOptions = GetEvmBalancesBase & {
  balanceSourceType: BalanceSourceType.ETHNative;
};

type GetCosmosNativeBalanceOptions = GetCosmosBalancesBase & {
  balanceSourceType: BalanceSourceType.CosmosNative;
};

export type GetCw20BalanceOptions = GetCosmosBalancesBase & {
  balanceSourceType: BalanceSourceType.CW20;
  sourceOptions: {
    contractAddress: string;
  };
};

export type GetCw721BalanceOptions = GetCosmosBalancesBase & {
  balanceSourceType: BalanceSourceType.CW721;
  sourceOptions: {
    contractAddress: string;
  };
};

export type GetSPLBalancesOptions = {
  balanceSourceType: BalanceSourceType.SPL | BalanceSourceType.SOLNFT;
  addresses: string[];
  mintAddress: string;
  solanaNetwork?: string;
} & TbcConfigOptions;

export type GetSuiNativeBalanceOptions = GetSuiBalancesBase & {
  balanceSourceType: BalanceSourceType.SuiNative;
  sourceOptions: {
    objectId?: string;
  };
};

export type GetSuiTokenBalanceOptions = GetSuiBalancesBase & {
  balanceSourceType: BalanceSourceType.SuiToken;
  sourceOptions: {
    coinType: string;
  };
};

export type GetErcBalanceOptions =
  | GetErc20BalanceOptions
  | GetErc721BalanceOptions
  | GetErc1155BalanceOptions;

export type GetEvmBalancesOptions =
  | GetErcBalanceOptions
  | GetEthNativeBalanceOptions;

export type GetCosmosBalancesOptions =
  | GetCosmosNativeBalanceOptions
  | GetCw20BalanceOptions
  | GetCw721BalanceOptions;

export type GetCwBalancesOptions =
  | GetCw20BalanceOptions
  | GetCw721BalanceOptions;

export type GetSuiBalancesOptions =
  | GetSuiNativeBalanceOptions
  | GetSuiTokenBalanceOptions;

export type GetBalancesOptions =
  | GetEvmBalancesOptions
  | GetCosmosBalancesOptions
  | GetSPLBalancesOptions
  | GetSuiBalancesOptions;

export type GetTendermintClientOptions = {
  chainNode: ChainNodeInstance;
  batchSize?: number;
};

export type TokenAttributes = {
  ticker: string | Denominations;
  decimals: number;
};
