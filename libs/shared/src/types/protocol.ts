export enum BalanceSourceType {
  ETHNative = 'eth_native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  CosmosNative = 'cosmos_native',
  CW20 = 'cw20',
  CW721 = 'cw721',
  SPL = 'spl',
  SOLNFT = 'metaplex',
  SuiNative = 'sui_native',
  SuiToken = 'sui_token',
}

export enum BalanceType {
  Terra = 'terra',
  Ethereum = 'ethereum',
  Solana = 'solana',
  Cosmos = 'cosmos',
  NEAR = 'near',
  Substrate = 'substrate',
  Sui = 'sui',
}

export type ContractSource = {
  source_type:
    | BalanceSourceType.ERC20
    | BalanceSourceType.ERC721
    | BalanceSourceType.ERC1155;
  evm_chain_id: number;
  contract_address: string;
  token_id?: string;
};

export type SolanaSource = {
  source_type: BalanceSourceType.SPL | BalanceSourceType.SOLNFT;
  solana_network: string;
  contract_address: string;
};

export type SuiSource = {
  source_type: BalanceSourceType.SuiNative;
  sui_network: string;
  object_id?: string;
};

export type SuiTokenSource = {
  source_type: BalanceSourceType.SuiToken;
  sui_network: string;
  coin_type: string;
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
  source:
    | ContractSource
    | NativeSource
    | CosmosSource
    | CosmosContractSource
    | SolanaSource
    | SuiSource
    | SuiTokenSource;
};

export type AbiType = Record<string, unknown>[];

// For detailed documentation of wallet types and support,
// see Web-Wallets.md entry in the knowledge base

export enum WalletId {
  Magic = 'magic',
  Privy = 'privy',
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
  Backpack = 'backpack',
  Solflare = 'solflare',
  Coinbase = 'coinbase',
  Farcaster = 'farcaster',
  OKX = 'okx',
  SuiWallet = 'sui-wallet',
  Binance = 'binance',
  SuietWallet = 'suiet',
  Suiet = 'suiet-wallet',
  OkxWallet = 'okx-wallet',
  bitgetWallet = 'bitget',
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

  // TODO: remove
  Unknown = 'unknown', // address created after we launched SSO, before we started recording WalletSsoSource
}

export enum ChainBase {
  CosmosSDK = 'cosmos',
  Substrate = 'substrate',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Solana = 'solana',
  Sui = 'sui',
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
  Sui = 'sui',
}

/**
 * Cosmos gov module version of a chain
 */
export enum CosmosGovernanceVersion {
  v1 = 'v1',
  v1atomone = 'v1atomone',
  v1beta1govgen = 'v1beta1govgen',
  v1beta1 = 'v1beta1',
  v1beta1Failed = 'v1beta1-attempt-failed',
  v1Failed = 'v1-attempt-failed',
}

export enum CommunityType {
  Launchpad = 'launchpad',
  Basic = 'basic',
}

export const CommunityGoalTypes = [
  'groups',
  'members',
  'moderators',
  'social-links',
  'tags',
  'threads',
] as const;
export type CommunityGoalType = (typeof CommunityGoalTypes)[number];
