export enum BalanceSourceType {
  ETHNative = 'eth_native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  CosmosNative = 'cosmos_native',
  CW20 = 'cw20',
  CW721 = 'cw721',
  SPL = 'spl',
}

export enum BalanceType {
  Terra = 'terra',
  Ethereum = 'ethereum',
  Solana = 'solana',
  Cosmos = 'cosmos',
  NEAR = 'near',
  Substrate = 'substrate',
}

export type ContractSource = {
  source_type:
    | BalanceSourceType.ERC20
    | BalanceSourceType.ERC721
    | BalanceSourceType.ERC1155
    | BalanceSourceType.SPL;
  evm_chain_id: number;
  contract_address: string;
  token_id?: string;
};

export type NativeSource = {
  source_type: BalanceSourceType.ETHNative;
  evm_chain_id: number;
};

export type CosmosSource = {
  source_type: BalanceSourceType.CosmosNative;
  cosmos_chain_id: string;
  token_symbol: string;
};

export type CosmosContractSource = {
  source_type: BalanceSourceType.CW20 | BalanceSourceType.CW721;
  cosmos_chain_id: string;
  contract_address: string;
};

export type ThresholdData = {
  threshold: string;
  source: ContractSource | NativeSource | CosmosSource | CosmosContractSource;
};

export type AbiType = Record<string, unknown>[];

// For detailed documentation of wallet types and support,
// see Web-Wallets.md entry in the knowledge base

export enum WalletId {
  Magic = 'magic',
  Polkadot = 'polkadot',
  Metamask = 'metamask',
  WalletConnect = 'walletconnect',
  KeplrEthereum = 'keplr-ethereum',
  Keplr = 'keplr',
  Leap = 'leap',
  NearWallet = 'near',
  TerraStation = 'terrastation',
  TerraWalletConnect = 'terra-walletconnect',
  CosmosEvmMetamask = 'cosm-metamask',
  Phantom = 'phantom',
  Coinbase = 'coinbase',
}

// Passed directly to Magic login.
// For detailed documentation of wallet types and support,
// see Web-Wallets.md entry in the knowledge base

export enum WalletSsoSource {
  Google = 'google',
  Github = 'github',
  Discord = 'discord',
  Twitter = 'twitter',
  Apple = 'apple',
  Email = 'email',
  Farcaster = 'farcaster',
  SMS = 'SMS',
  Unknown = 'unknown', // address created after we launched SSO, before we started recording WalletSsoSource
}

export enum ChainBase {
  CosmosSDK = 'cosmos',
  Substrate = 'substrate',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Solana = 'solana',
  Skale = 'skale',
}

export enum ChainType {
  Chain = 'chain',
  DAO = 'dao',
  Token = 'token',
  Offchain = 'offchain',
}

// This enum represents known values for the "network" field on Community, which can be used for
// switched functionality against specific groups of communities (so we could e.g. group together all
// communities on a specific testnet, or all ERC20s). In practice this field is deprecated, and should be
// removed, but these following values remain as either defaults or for custom integration support.
export enum ChainNetwork {
  Ethereum = 'ethereum',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  Edgeware = 'edgeware',
  Osmosis = 'osmosis',
  Injective = 'injective',
  Solana = 'solana',
  Terra = 'terra',
  NEAR = 'near',
  Stargaze = 'stargaze',
  Evmos = 'evmos',
  Kava = 'kava',
  Kyve = 'kyve',
}

/**
 * Cosmos gov module version of a chain
 */
export enum CosmosGovernanceVersion {
  v1 = 'v1',
  v1beta1govgen = 'v1beta1govgen',
  v1beta1 = 'v1beta1',
  v1beta1Failed = 'v1beta1-attempt-failed',
  v1Failed = 'v1-attempt-failed',
}

export enum CommunityType {
  Launchpad = 'launchpad',
  Basic = 'basic',
}
