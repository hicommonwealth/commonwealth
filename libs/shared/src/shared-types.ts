export enum AccessLevel {
  Admin = 'admin',
  Moderator = 'moderator',
  Member = 'member',
  Everyone = 'everyone',
}

export type SnapshotProposalAttributes = {
  id: string;
  title?: string;
  body?: string;
  choices?: string[];
  space: string;
  event: string;
  start?: string;
  expire: string;
  is_upstream_deleted?: boolean;
};

export const enum SnapshotEventType {
  Created = 'proposal/created',
  Deleted = 'proposal/deleted',
  Ended = 'proposal/end',
  Started = 'proposal/start',
}

export interface ISnapshotNotificationData {
  id?: string;
  title?: string;
  body?: string;
  choices?: string[];
  space?: string;
  event?: string;
  start?: string;
  expire?: string;
  eventType: SnapshotEventType;
}

// TODO: @Timothee remove this type in favor of the one below once webhook and email functions are fixed + tested and
//  their types are updated
export interface IForumNotificationData {
  created_at: any;
  thread_id: number | string;
  root_title: string;
  root_type: string;
  community_id: string;
  author_address: string;
  author_community_id: string;
  comment_id?: number;
  comment_text?: string;
  parent_comment_id?: number;
  parent_comment_text?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

// export type IForumNotificationData =
//   | INewCommentNotificationData
//   | INewReactionNotificationData
//   | INewThreadNotificationData
//   | INewMentionNotificationData
//   | INewCollaborationNotificationData
//   | IThreadEditNotificationData
//   | ICommentEditNotificationData;

export interface IBaseForumNotificationData {
  created_at: any;
  thread_id: number | string;
  root_title: string;
  root_type: string;
  community_id: string;
  author_address: string;
  author_community_id: string;
}

export interface INewCommentNotificationData
  extends IBaseForumNotificationData {
  comment_id: number;
  comment_text: string;
  parent_comment_id?: number;
  parent_comment_text?: string;
}

export interface INewReactionNotificationData
  extends IBaseForumNotificationData {
  comment_id?: number;
  comment_text?: string;
}

export interface INewThreadNotificationData extends IBaseForumNotificationData {
  comment_text: string;
}

export interface INewMentionNotificationData
  extends IBaseForumNotificationData {
  mentioned_user_id: number;
  comment_id?: number;
  comment_text: string;
}

export interface INewCollaborationNotificationData
  extends IBaseForumNotificationData {
  comment_text: string;
  collaborator_user_id: number;
}

export interface IThreadEditNotificationData
  extends IBaseForumNotificationData {}

export interface ICommentEditNotificationData
  extends IBaseForumNotificationData {
  comment_id: number;
  comment_text: string;
}

export interface IChainEventNotificationData {
  id?: number;
  block_number?: number;
  event_data: any;
  network: SupportedNetwork;
  community_id: string;
}

export type NotificationDataTypes =
  | IForumNotificationData
  | IChainEventNotificationData
  | ISnapshotNotificationData;

export type NotifCategoryToNotifDataMapping = {
  [K in NotificationCategory]: K extends typeof NotificationCategories.NewComment
    ? INewCommentNotificationData
    : K extends typeof NotificationCategories.NewThread
    ? INewThreadNotificationData
    : K extends typeof NotificationCategories.NewMention
    ? INewMentionNotificationData
    : K extends typeof NotificationCategories.NewReaction
    ? INewReactionNotificationData
    : K extends typeof NotificationCategories.NewCollaboration
    ? INewCollaborationNotificationData
    : K extends typeof NotificationCategories.ThreadEdit
    ? IThreadEditNotificationData
    : K extends typeof NotificationCategories.CommentEdit
    ? ICommentEditNotificationData
    : K extends typeof NotificationCategories.ChainEvent
    ? IChainEventNotificationData
    : K extends typeof NotificationCategories.SnapshotProposal
    ? ISnapshotNotificationData
    : never;
};

// This maps a NotificationCategory to a NotificationDataType - if the category and the
// data don't match a type error will be raised. Very useful for ensuring that the correct
// data is provided for a given NotificationCategory.
export type NotificationDataAndCategory = {
  [K in NotificationCategory]: {
    categoryId: K;
    data: NotifCategoryToNotifDataMapping[K];
  };
}[NotificationCategory];

export enum ContentType {
  Thread = 'thread',
  Comment = 'comment',
  // Proposal = 'proposal',
}

export enum SearchContentType {
  Thread = 'thread',
  Comment = 'comment',
  Chain = 'chain',
  Token = 'token',
  Member = 'member',
}

export const DynamicTemplate = {
  ImmediateEmailNotification: 'd-3f30558a95664528a2427b40292fec51',
  BatchNotifications: 'd-468624f3c2d7434c86ae0ed0e1d2227e',
  SignIn: 'd-db52815b5f8647549d1fe6aa703d7274',
  SignUp: 'd-2b00abbf123e4b5981784d17151e86be',
  UpdateEmail: 'd-a0c28546fecc49fb80a3ba9e535bff48',
  VerifyAddress: 'd-292c161f1aec4d0e98a0bf8d6d8e42c2',
  EmailDigest: 'd-a4f27421ce5a41d29dca7625d2136cc3',
};

export type RoleObject = {
  permission: AccessLevel;
  allow: number;
  deny: number;
};

export type AbiType = Record<string, unknown>[];

export type WebhookCategory =
  | NotificationCategories.ChainEvent
  | NotificationCategories.NewThread
  | NotificationCategories.NewComment
  | NotificationCategories.NewReaction;

export type EmitNotification<T> = (
  models: unknown,
  notification_data_and_category: NotificationDataAndCategory,
  excludeAddresses?: string[],
  includeAddresses?: string[],
) => Promise<T>;

export enum ProposalType {
  Thread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  CompoundProposal = 'compoundproposal',
  AaveProposal = 'onchainproposal',
  SputnikProposal = 'sputnikproposal',
}

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

// 'google', 'github', 'discord', and 'twitter' are passed to magic login directly
export enum WalletSsoSource {
  Google = 'google',
  Github = 'github',
  Discord = 'discord',
  Twitter = 'twitter',
  apple = 'apple',
  Email = 'email',
  Unknown = 'unknown', // address created after we launched SSO, before we started recording WalletSsoSource
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
  CW20 = 'cw20',
  CW721 = 'cw721',
  Clover = 'clover',
  HydraDX = 'hydradx',
  Crust = 'crust',
  Sputnik = 'sputnik',
  SolanaDevnet = 'solana-devnet',
  SolanaTestnet = 'solana-testnet',
  Solana = 'solana',
  SPL = 'spl', // solana token
  Evmos = 'evmos',
  Kava = 'kava',
  Kyve = 'kyve',
  Stargaze = 'stargaze',
  Cosmos = 'cosmos',
}

export enum BalanceType {
  Terra = 'terra',
  Ethereum = 'ethereum',
  Solana = 'solana',
  Cosmos = 'cosmos',
  NEAR = 'near',
  Substrate = 'substrate',
}

export enum DefaultPage {
  Discussions = 'default_all_discussions_view',
  Overview = 'default_summary_view',
  Homepage = 'homepage',
}

/**
 * Cosmos gov module version of a chain
 */
export enum CosmosGovernanceVersion {
  v1 = 'v1',
  v1beta1 = 'v1beta1',
  v1beta1Failed = 'v1beta1-attempt-failed',
  v1Failed = 'v1-attempt-failed',
}
