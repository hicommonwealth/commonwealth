import { z, ZodSchema } from 'zod';

export enum SupportedNetwork {
  Substrate = 'substrate',
  Aave = 'aave',
  Compound = 'compound',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  Cosmos = 'cosmos',
}

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
  Thread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  CompoundProposal = 'compoundproposal',
  AaveProposal = 'onchainproposal',
  SputnikProposal = 'sputnikproposal',
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
  Leap = 'leap',
  NearWallet = 'near',
  TerraStation = 'terrastation',
  TerraWalletConnect = 'terra-walletconnect',
  CosmosEvmMetamask = 'cosm-metamask',
  Phantom = 'phantom',
  Ronin = 'ronin',
  Coinbase = 'coinbase',
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

export enum CommunityCategoryType {
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
  CW721 = 'cw721',
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
  Kyve = 'kyve',
  Stargaze = 'stargaze',
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

export enum CacheNamespaces {
  Route_Response = 'route_response',
  Function_Response = 'function_response',
  Global_Response = 'global_response',
  Test_Redis = 'test_redis',
  Database_Cleaner = 'database_cleaner',
  Compound_Gov_Version = 'compound_gov_version',
  Token_Balance = 'token_balance',
  Activity_Cache = 'activity_cache',
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

export type ThreadDiscordActions =
  | 'thread-delete'
  | 'thread-title-update'
  | 'thread-body-update'
  | 'thread-create';
export type CommentDiscordActions =
  | 'comment-delete'
  | 'comment-update'
  | 'comment-create';
export type DiscordAction = ThreadDiscordActions | CommentDiscordActions;

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

export interface IDiscordMeta {
  user: {
    id: string;
    username: string;
  };
  channel_id: string;
  message_id: string;
}

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';

type ChainEventAttributes = {
  id: number;
  block_number: number;
  event_data: any;
  queued: number;
  entity_id?: number;
  network: SupportedNetwork;
  chain: string;
  created_at?: Date;
  updated_at?: Date;
};

export type ChainEventNotification = {
  id: number;
  notification_data: string;
  chain_event_id: number;
  category_id: 'chain-event';
  chain_id: string;
  updated_at: Date;
  created_at: Date;
  ChainEvent: ChainEventAttributes;
};

/**
 * Authenticated user
 */
export type User = {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
};

/**
 * "Core" abstraction representing the "user acting on the system", either invoking a command on an aggregate, or querying a projection
 * - Common actors are identified by their unique `user.id` (jwt signin flow)
 *   - `user`: user profile attributes
 * - Actors can "optionally" carry the following unique ids:
 *   - `address_id`: the current web wallet address (TODO: is this optional?)
 *   - `aggregate_id`: the aggregate id when invoking a command
 * - Actors can also pre-load and validate state via chained {@link ActorMiddleware} reusable utilities
 *   - `author`: user is the author of the aggregate
 */
export type Actor = {
  // must be signed in
  user: User;
  address_id?: string;
  aggregate_id?: string;
  author?: boolean;
};

/**
 * Command action signature
 * @param id aggregate id
 * @param payload command payload
 * @param actor command actor
 */
export type Command<M extends ZodSchema, R> = (
  id: string,
  payload: z.infer<M>,
  actor: Actor,
) => Promise<R>;

/**
 * Middleware signature to loads and/or validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state or error string
 * - TODO: should we use [error, actor] tuples instead of returning string?
 */
export type ActorMiddleware = (actor: Actor) => Promise<Actor | string>;

/**
 * Command definition
 */
export type CommandMetadata<M extends ZodSchema, R> = {
  fn: Command<M, R>;
  schema: M;
  middleware?: ActorMiddleware[];
};
