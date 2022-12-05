// contains types for external api

import { ThreadAttributes } from 'commonwealth/server/models/thread';
import { CommentAttributes } from 'commonwealth/server/models/comment';
import { ReactionAttributes } from 'commonwealth/server/models/reaction';
import { ChainAttributes } from 'commonwealth/server/models/chain';
import { ProfileAttributes } from 'commonwealth/server/models/profile';
import { ChainNodeAttributes } from 'commonwealth/server/models/chain_node';
import { BalanceProvider, BalanceProviderResp } from 'token-balance-cache/src';

export enum OrderByOptions {
  UPDATED = 'updated_at',
  CREATED = 'created_at'
}

export type IPagination = {
  limit?: number;
  page?: number;
  sort?: OrderByOptions;
}

export type GetCommentsReq = {
  community_id: string;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

export type GetCommentsResp = { comments: CommentAttributes[], count: number };

export type GetThreadsReq = {
  community_id: string;
  topic_id?: number;
  address_ids?: string[];
  addresses?: string[];
  no_body?: boolean;
  include_comments?: boolean;
} & IPagination;

export type GetThreadsResp = { threads: ThreadAttributes[], count: number };

export type GetReactionsReq = {
  community_id: string;
  thread_id?: number;
  comment_id?: number;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

export type GetReactionsResp = { reactions: ReactionAttributes[], count: number };

export type GetCommunitiesReq = {
  community_id?: string;
  count_only?: boolean; // Desired?
} & IPagination;

export type GetCommunitiesResp = ChainAttributes[];

export type GetProfilesReq = {
  addresses?: string[];
  profile_ids?: number[];
} & IPagination;

export type GetProfilesResp = ProfileAttributes[];

export type GetChainNodesReq = {
  balance_types?: string[];
  names?: string[];
} & IPagination;

export type GetChainNodesResp = { chain_nodes: ChainNodeAttributes[], count: number };

export type GetBalanceProvidersReq = {
  chain_node_ids: number[]
};

export type GetBalanceProvidersResp = { balance_providers: [BalanceProviderResp[]], count: number };

export type GetTokenBalanceReq = {
  chain_node_id: number,
  addresses: string[],
  balance_provider: string,
  opts: Record<string, string | undefined>
};