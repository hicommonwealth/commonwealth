import { SearchScope } from 'models/SearchQuery';
import { z } from 'zod/v4';
import { SearchEntityResult } from '../../../../../../../libs/model/src/aggregates/search';

export const MENTION_CONFIG = {
  MAX_SEARCH_RESULTS: 10,
  MAX_MENTIONS_PER_POST: 5,
  CONTEXT_DATA_DAYS: 30,
  MIN_SEARCH_LENGTH: 3,
  SEARCH_DEBOUNCE_MS: 500,
} as const;

export enum MentionEntityType {
  USER = 'user',
  TOPIC = 'topic',
  THREAD = 'thread',
  COMMUNITY = 'community',
  PROPOSAL = 'proposal',
}

export const MENTION_DENOTATION_CHARS = {
  '@': 'global',
  '#': MentionEntityType.TOPIC,
  '!': MentionEntityType.THREAD,
  '~': MentionEntityType.COMMUNITY,
} as const;

export const ENTITY_TYPE_INDICATORS = {
  [MentionEntityType.USER]: '👤',
  [MentionEntityType.COMMUNITY]: '🏘️',
  [MentionEntityType.TOPIC]: '🏷️',
  [MentionEntityType.THREAD]: '💬',
  [MentionEntityType.PROPOSAL]: '📋',
  deleted: '❌',
} as const;

export const GLOBAL_SEARCH_PRIORITY = [
  MentionEntityType.USER,
  MentionEntityType.COMMUNITY,
  MentionEntityType.TOPIC,
  MentionEntityType.THREAD,
  MentionEntityType.PROPOSAL,
] as const;

export const ENTITY_TO_SEARCH_SCOPE = {
  [MentionEntityType.USER]: SearchScope.Members,
  [MentionEntityType.COMMUNITY]: SearchScope.Communities,
  [MentionEntityType.TOPIC]: SearchScope.Topics,
  [MentionEntityType.THREAD]: SearchScope.Threads,
  [MentionEntityType.PROPOSAL]: SearchScope.Proposals,
} as const;

export const MENTION_LINK_FORMATS = {
  [MentionEntityType.USER]: (name: string, id: string) =>
    `[@${name}](/profile/id/${id})`,
  [MentionEntityType.TOPIC]: (name: string, id: string) =>
    `[#${name}](/discussion/topic/${id})`,
  [MentionEntityType.THREAD]: (name: string, id: string) =>
    `[!${name}](/discussion/${id})`,
  [MentionEntityType.COMMUNITY]: (name: string, id: string) =>
    `[~${name}](/${id})`,
  [MentionEntityType.PROPOSAL]: (name: string, id: string) =>
    `[${name}](/proposal/${id})`,
} as const;

export const DENOTATION_SEARCH_CONFIG = {
  '@': {
    scopes: [SearchScope.All],
    communityScoped: false,
    description: 'Search all entity types',
  },
  '#': {
    scopes: [SearchScope.Topics],
    communityScoped: true,
    description: 'Search topics in current community',
  },
  '!': {
    scopes: [SearchScope.Threads],
    communityScoped: true,
    description: 'Search threads in current community',
  },
  '~': {
    scopes: [SearchScope.Communities],
    communityScoped: false,
    description: 'Search all communities',
  },
} as const;

// Type alias for search results from SearchEntities query
export type MentionSearchResult = z.infer<typeof SearchEntityResult>;

export const getEntityTypeFromSearchResult = (
  result: MentionSearchResult,
): MentionEntityType => {
  return result.type as unknown as MentionEntityType;
};

export const formatEntityDisplayName = (
  entityType: MentionEntityType,
  result: MentionSearchResult,
): string => {
  switch (entityType) {
    case MentionEntityType.USER:
      return result.name || 'Unknown User';
    case MentionEntityType.TOPIC:
      return result.name || 'Unknown Topic';
    case MentionEntityType.THREAD:
      return result.name || 'Unknown Thread';
    case MentionEntityType.COMMUNITY:
      return result.name || 'Unknown Community';
    case MentionEntityType.PROPOSAL:
      return result.name || 'Unknown Proposal';
    default:
      return 'Unknown Entity';
  }
};

export const getEntityId = (
  entityType: MentionEntityType,
  result: MentionSearchResult,
): string => {
  return result.id || '';
};
