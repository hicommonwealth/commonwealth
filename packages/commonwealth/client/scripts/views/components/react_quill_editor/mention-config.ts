import { SearchScope } from '../../../models/SearchQuery';

export const MENTION_CONFIG = {
  MAX_SEARCH_RESULTS: 10,
  MAX_MENTIONS_PER_POST: 3,
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

export const getEntityTypeFromSearchResult = (
  result: any,
): MentionEntityType => {
  if (result.type) {
    return result.type as MentionEntityType;
  }

  // Fallback type detection based on result properties
  if (result.user_id || result.profile_name) return MentionEntityType.USER;
  if (result.topic_id || result.topic_name) return MentionEntityType.TOPIC;
  if (result.thread_id || result.title) return MentionEntityType.THREAD;
  if (result.community_id && result.name) return MentionEntityType.COMMUNITY;
  if (result.proposal_id) return MentionEntityType.PROPOSAL;

  return MentionEntityType.USER; // Default fallback
};

export const formatEntityDisplayName = (
  entityType: MentionEntityType,
  result: any,
): string => {
  switch (entityType) {
    case MentionEntityType.USER:
      return result.profile_name || result.name || 'Unknown User';
    case MentionEntityType.TOPIC:
      return result.topic_name || result.name || 'Unknown Topic';
    case MentionEntityType.THREAD:
      return result.title || result.thread_title || 'Unknown Thread';
    case MentionEntityType.COMMUNITY:
      return result.name || result.community_name || 'Unknown Community';
    case MentionEntityType.PROPOSAL:
      return result.title || result.proposal_title || 'Unknown Proposal';
    default:
      return 'Unknown Entity';
  }
};

export const getEntityId = (
  entityType: MentionEntityType,
  result: any,
): string => {
  switch (entityType) {
    case MentionEntityType.USER:
      return result.user_id || result.id || '';
    case MentionEntityType.TOPIC:
      return result.topic_id || result.id || '';
    case MentionEntityType.THREAD:
      return result.thread_id || result.id || '';
    case MentionEntityType.COMMUNITY:
      return result.community_id || result.id || '';
    case MentionEntityType.PROPOSAL:
      return result.proposal_id || result.id || '';
    default:
      return '';
  }
};
