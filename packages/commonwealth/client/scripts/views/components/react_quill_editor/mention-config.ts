import { SearchScope } from '../../../models/SearchQuery';

// Configurable limits
export const MENTION_CONFIG = {
  MAX_SEARCH_RESULTS: 10,
  MAX_MENTIONS_PER_POST: 3,
  CONTEXT_DATA_DAYS: 30,
  MIN_SEARCH_LENGTH: 3,
  SEARCH_DEBOUNCE_MS: 500,
} as const;

// Entity type definitions
export enum MentionEntityType {
  USER = 'user',
  TOPIC = 'topic',
  THREAD = 'thread',
  COMMUNITY = 'community',
  PROPOSAL = 'proposal',
}

// Denotation character mappings
export const MENTION_DENOTATION_CHARS = {
  '@': 'global', // Multi-entity search
  '#': MentionEntityType.TOPIC,
  '!': MentionEntityType.THREAD,
  '~': MentionEntityType.COMMUNITY,
} as const;

// Entity type indicators (configurable for Phosphor icons)
export const ENTITY_TYPE_INDICATORS = {
  [MentionEntityType.USER]: '👤',
  [MentionEntityType.COMMUNITY]: '🏘️',
  [MentionEntityType.TOPIC]: '🏷️',
  [MentionEntityType.THREAD]: '💬',
  [MentionEntityType.PROPOSAL]: '📋',
  deleted: '❌',
} as const;

// Search priority order for global '@' search
export const GLOBAL_SEARCH_PRIORITY = [
  MentionEntityType.USER,
  MentionEntityType.COMMUNITY,
  MentionEntityType.TOPIC,
  MentionEntityType.THREAD,
  MentionEntityType.PROPOSAL,
] as const;

// Search scope mappings
export const ENTITY_TO_SEARCH_SCOPE = {
  [MentionEntityType.USER]: SearchScope.Members,
  [MentionEntityType.COMMUNITY]: SearchScope.Communities,
  [MentionEntityType.TOPIC]: SearchScope.Topics, // Note: Need to add this to SearchScope
  [MentionEntityType.THREAD]: SearchScope.Threads,
  [MentionEntityType.PROPOSAL]: SearchScope.Proposals,
} as const;

// Mention link format patterns
export const MENTION_LINK_FORMATS = {
  [MentionEntityType.USER]: (name: string, id: string) =>
    `[@${name}](user:${id})`,
  [MentionEntityType.TOPIC]: (name: string, id: string) =>
    `[#${name}](topic:${id})`,
  [MentionEntityType.THREAD]: (name: string, id: string) =>
    `[!${name}](thread:${id})`,
  [MentionEntityType.COMMUNITY]: (name: string, id: string) =>
    `[~${name}](community:${id})`,
  [MentionEntityType.PROPOSAL]: (name: string, id: string) =>
    `[${name}](proposal:${id})`,
} as const;

// Search scope configurations for each denotation character
export const DENOTATION_SEARCH_CONFIG = {
  '@': {
    scopes: [SearchScope.All],
    communityScoped: false, // Global search
    description: 'Search all entity types',
  },
  '#': {
    scopes: [SearchScope.Topics],
    communityScoped: true, // Current community only
    description: 'Search topics in current community',
  },
  '!': {
    scopes: [SearchScope.Threads],
    communityScoped: true, // Current community only
    description: 'Search threads in current community',
  },
  '~': {
    scopes: [SearchScope.Communities],
    communityScoped: false, // All communities
    description: 'Search all communities',
  },
} as const;

// Helper function to get entity type from search result
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

// Helper function to format entity display name
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

// Helper function to get entity ID
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
