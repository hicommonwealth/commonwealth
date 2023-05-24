// contains types for external api

import type { ChainAttributes } from 'commonwealth/server/models/chain';
import type { CommentAttributes } from 'commonwealth/server/models/comment';
import type { ProfileAttributes } from 'commonwealth/server/models/profile';
import type { ReactionAttributes } from 'commonwealth/server/models/reaction';
import type { RuleAttributes } from 'commonwealth/server/models/rule';
import type { ThreadAttributes } from 'commonwealth/server/models/thread';
import type { TopicAttributes } from 'commonwealth/server/models/topic';
import type {
  BalanceProviderResp,
  ChainNodeResp,
} from 'token-balance-cache/src';
import { Role } from '../roles';

export enum OrderByOptions {
  UPDATED = 'updated_at',
  CREATED = 'created_at',
}

export type IPagination = {
  limit?: number;
  page?: number;
  sort?: OrderByOptions;
};

export type GetCommentsReq = {
  community_id: string;
  addresses?: string[];
  thread_ids?: number[];
  count_only?: boolean;
} & IPagination;

export type GetCommentsResp = { comments?: CommentAttributes[]; count: number };

export type PutCommentsReq = {
  comments: (CommentAttributes & { community_id: string })[];
};

export type DeleteReq = { ids: number[] };

export type GetThreadsReq = {
  community_id: string;
  topic_id?: number;
  address_ids?: string[];
  addresses?: string[];
  no_body?: boolean;
  include_comments?: boolean;
  count_only?: boolean;
} & IPagination;

export type GetThreadsResp = { threads?: ThreadAttributes[]; count: number };

export type GetReactionsReq = {
  community_id: string;
  thread_id?: number;
  comment_id?: number;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

export type PostReactionsReq = {
  reactions: (ReactionAttributes & { community_id: string })[];
};

export type GetReactionsResp = {
  reactions?: ReactionAttributes[];
  count: number;
};

export type GetCommunitiesReq = {
  community_id?: string;
  network?: string;
  count_only?: boolean;
  limit?: number;
  page?: number;
};

export type PutCommunitiesReq = {
  community: ChainAttributes;
  contract: { token_type: string; address: string };
  admin_addresses: string[];
};

export type PutCommunitiesResp = { url: string; error?: string };

export type GetCommunitiesResp = {
  communities?: ChainAttributes[];
  count: number;
};

export type GetProfilesReq = {
  addresses?: string[];
  profile_ids?: number[];
  count_only?: boolean;
} & IPagination;

export type PostProfilesReq = {
  profiles: (ProfileAttributes[] & { community_id: string })[];
};

export type GetProfilesResp = { profiles?: ProfileAttributes[]; count: number };

export type GetChainNodesReq = {
  chain_node_ids?: number[];
  names?: string[];
} & IPagination;

export type GetChainNodesResp = { chain_nodes: ChainNodeResp[]; count: number };

export type GetBalanceProvidersReq = {
  chain_node_ids: number[];
};

export type GetBalanceProvidersResp = {
  balance_providers: BalanceProviderResp[];
  count: number;
};

export type GetTokenBalanceReq = {
  chain_node_id: number;
  addresses: string[];
  balance_provider: string;
  opts: Record<string, string | undefined>;
};

export type GetTopicsReq = {
  community_id: string;
  count_only?: boolean;
} & IPagination;

export type PostTopicsReq = {
  topics: (TopicAttributes & { community_id: string })[];
};

export type GetTopicsResp = { topics?: TopicAttributes[]; count: number };

export type GetRolesReq = {
  community_id: string;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

export type GetRolesResp = {
  roles?: {
    address: string;
    role: Role;
    created_at: string;
    updated_at: string;
  };
  count: number;
};

export type GetRulesReq = {
  community_id?: string;
  ids?: number[];
  count_only?: boolean;
} & IPagination;

export type GetRulesResp = { rules?: RuleAttributes[]; count: number };

export type PostRulesReq = {
  rules: (RuleAttributes & { community_id: string })[];
};

export type OnlyErrorResp = { error?: string | object };

export const needParamErrMsg = 'Please provide a parameter to query by';
