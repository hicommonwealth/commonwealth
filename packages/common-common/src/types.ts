export enum NotificationCategories {
  NewComment = 'new-comment-creation',
  NewThread = 'new-thread-creation',
  NewMention = 'new-mention',
  NewReaction = 'new-reaction',
  NewCollaboration = 'new-collaboration',
  ThreadEdit = 'thread-edit',
  CommentEdit = 'comment-edit',
  ChainEvent = 'chain-event',
  SnapshotProposal = 'snapshot-proposal',
}

export type NotificationCategory =
  typeof NotificationCategories[keyof typeof NotificationCategories];

export enum ProposalType {
  SubstrateDemocracyReferendum = 'referendum',
  SubstrateDemocracyProposal = 'democracyproposal',
  SubstrateTreasuryTip = 'treasurytip',
  SubstrateTechnicalCommitteeMotion = 'technicalcommitteemotion',
  SubstrateTreasuryProposal = 'treasuryproposal',
  Thread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  CompoundProposal = 'compoundproposal',
  AaveProposal = 'onchainproposal',
  SputnikProposal = 'sputnikproposal',
  SubstratePreimage = 'democracypreimage',
  SubstrateImminentPreimage = 'democracyimminent',
}

export enum ChainBase {
  CosmosSDK = 'cosmos',
  Substrate = 'substrate',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Solana = 'solana',
}

export enum ContractType {
  AAVE = 'aave',
  COMPOUND = 'compound',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  MARLINTESTNET = 'marlin-testnet',
  SPL = 'spl',
  COMMONPROTOCOL = 'common-protocol',
}

export enum ChainType {
  Chain = 'chain',
  DAO = 'dao',
  Token = 'token',
  Offchain = 'offchain',
}

export enum WalletId {
  Magic = 'magic',
  Polkadot = 'polkadot',
  Metamask = 'metamask',
  WalletConnect = 'walletconnect',
  KeplrEthereum = 'keplr-ethereum',
  Keplr = 'keplr',
  NearWallet = 'near',
  TerraStation = 'terrastation',
  TerraWalletConnect = 'terra-walletconnect',
  CosmosEvmMetamask = 'cosm-metamask',
  Phantom = 'phantom',
  Ronin = 'ronin',
}

// 'google', 'github', 'discord', and 'twitter' are passed to magic login directly
export enum WalletSsoSource {
  Google = 'google',
  Github = 'github',
  Discord = 'discord',
  Twitter = 'twitter',
  Email = 'email',
  Unknown = 'unknown', // address created after we launched SSO, before we started recording WalletSsoSource
}

export enum ChainCategoryType {
  DeFi = 'DeFi',
  DAO = 'DAO',
}

// TODO: remove many of these chain networks, esp substrate (make them all "Substrate"),
// and just use id to identify specific chains for conditionals
export enum ChainNetwork {
  Edgeware = 'edgeware',
  EdgewareTestnet = 'edgeware-testnet',
  Kusama = 'kusama',
  Kulupu = 'kulupu',
  Polkadot = 'polkadot',
  Plasm = 'plasm',
  Stafi = 'stafi',
  Darwinia = 'darwinia',
  Phala = 'phala',
  Centrifuge = 'centrifuge',
  Straightedge = 'straightedge',
  Osmosis = 'osmosis',
  Injective = 'injective',
  InjectiveTestnet = 'injective-testnet',
  Terra = 'terra',
  Ethereum = 'ethereum',
  NEAR = 'near',
  NEARTestnet = 'near-testnet',
  Compound = 'compound',
  Aave = 'aave',
  AaveLocal = 'aave-local',
  dYdX = 'dydx',
  Metacartel = 'metacartel',
  ALEX = 'alex',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  Clover = 'clover',
  HydraDX = 'hydradx',
  Crust = 'crust',
  Sputnik = 'sputnik',
  SolanaDevnet = 'solana-devnet',
  SolanaTestnet = 'solana-testnet',
  Solana = 'solana',
  SPL = 'spl', // solana token
  AxieInfinity = 'axie-infinity',
  Evmos = 'evmos',
  Kava = 'kava',
}

export enum BalanceType {
  AxieInfinity = 'axie-infinity',
  Terra = 'terra',
  Ethereum = 'ethereum',
  Solana = 'solana',
  Cosmos = 'cosmos',
  NEAR = 'near',
  Substrate = 'substrate',
}

export enum RedisNamespaces {
  Route_Response = 'route_response',
  Function_Response = 'function_response',
  Global_Response = 'global_response',
  Test_Redis = 'test_redis',
  Database_Cleaner = 'database_cleaner',
}

export interface ISnapshotNotification {
  id?: string;
  title?: string;
  body?: string;
  choices?: string[];
  space?: string;
  event?: string;
  start?: string;
  expire?: string;
}

export enum DefaultPage {
  Discussions = 'default_all_discussions_view',
  Overview = 'default_summary_view',
  Homepage = 'homepage',
}

export type DiscordAction =
  | 'create'
  | 'update'
  | 'thread-delete'
  | 'comment-delete';

export interface IDiscordMessage {
  user?: {
    id: string;
    username: string;
  };
  title?: string;
  content: string;
  message_id: string;
  channel_id?: string;
  parent_channel_id?: string;
  guild_id?: string;
  imageUrls?: string[];
  action: DiscordAction;
}

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';
