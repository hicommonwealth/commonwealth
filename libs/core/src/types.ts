import { SupportedNetwork } from '@hicommonwealth/shared';

export enum CacheNamespaces {
  Route_Response = 'route_response',
  Function_Response = 'function_response',
  Global_Response = 'global_response',
  Test_Redis = 'test_redis',
  Database_Cleaner = 'database_cleaner',
  Compound_Gov_Version = 'compound_gov_version',
  Token_Balance = 'token_balance',
  Activity_Cache = 'activity_cache',
  Rate_Limiter = 'rate_limiter',
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

export type AnalyticsOptions = Record<string, any>;

export enum NodeHealth {
  Failed = 'failed',
  Healthy = 'healthy',
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

export type AllowlistData = {
  allow: string[];
};

export type Requirement =
  | {
      rule: 'threshold';
      data: ThresholdData;
    }
  | {
      rule: 'allow';
      data: AllowlistData;
    };

export enum BalanceSourceType {
  ETHNative = 'eth_native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  CosmosNative = 'cosmos_native',
  CW20 = 'cw20',
  CW721 = 'cw721',
}

export enum BrokerTopics {
  SnapshotListener = 'SnapshotListener',
  DiscordListener = 'DiscordMessage',
  ChainEvent = 'ChainEvent',
}

export type ErrorMapperFn = (err: Error) => Error | null;
