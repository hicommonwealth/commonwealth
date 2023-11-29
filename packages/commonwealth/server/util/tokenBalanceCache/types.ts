import { BalanceSourceType } from '../requirementsModule/requirementsTypes';

export type Balances = { [address: string]: string };

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

export type GetEvmBalancesOptions =
  | GetEthNativeBalanceOptions
  | GetErc20BalanceOptions
  | GetErc721BalanceOptions
  | GetErc1155BalanceOptions;

export type GetCosmosBalancesOptions = {
  balanceSourceType: BalanceSourceType.CosmosNative;
  addresses: string[];
  sourceOptions: {
    cosmosChainId: string;
  };
};

export type GetBalancesOptions =
  | GetEvmBalancesOptions
  | GetCosmosBalancesOptions;
