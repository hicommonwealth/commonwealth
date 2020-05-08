// This is a const and not an enum because of a weird webpack error.
// It has the same syntax, though, so it should be OK, as long as we don't
// modify any of the values.
// eslint-disable-next-line import/prefer-default-export
export const NotificationCategories = {
  NewComment: 'new-comment-creation',
  NewThread: 'new-thread-creation',
  NewCommunity: 'new-community-creation',
  NewRoleCreation: 'new-role-creation',
  NewMention: 'new-mention',
  NewReaction: 'new-reaction',
  ThreadEdit: 'thread-edit',
  CommentEdit: 'comment-edit',
  ChainEvent: 'chain-event',
  EntityEvent: 'entity-event',
};

export enum ProposalType {
  SubstrateDemocracyReferendum = 'referendum',
  SubstrateDemocracyProposal = 'democracyproposal',
  EdgewareSignalingProposal = 'signalingproposal',
  SubstrateCollectiveProposal = 'councilmotion',
  PhragmenCandidacy = 'phragmenelection',
  SubstrateTreasuryProposal = 'treasuryproposal',
  OffchainThread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  MolochProposal = 'molochproposal',
}

export enum WebsocketEventType {
  Connection = 'connection',
  Message = 'message',
  Upgrade = 'upgrade',
  Close = 'close',
}

export enum WebsocketMessageType {
  Message = 'message',
  Heartbeat = 'heartbeat',
  HeartbeatPong = 'heartbeat-pong',
  Scrollback = 'scrollback',
  Typing = 'typing',
  Notification = 'notification',
  ChainEntity = 'chain-entity',
}

export interface IWebsocketsPayload<T> {
  type: WebsocketMessageType;
  jwt?: string; // for outgoing payloads
  chain?: string; // for incoming payloads
  address?: string; // for incoming payloads
  data?: T;
}

export interface IPostNotificationData {
  created_at: any;
  root_id: number;
  root_title: string;
  root_type: string;
  comment_id?: number;
  comment_text?: string;
  parent_comment_id?: number;
  parent_comment_text?: string;
  chain_id: string;
  community_id: string;
  author_address: string;
  author_chain: string;
}

export interface ICommunityNotificationData {
  created_at: any;
  role_id: string | number;
  author_address: string;
  chain: string;
  community: string;
}

export const PROFILE_NAME_MAX_CHARS = 40;
export const PROFILE_HEADLINE_MAX_CHARS = 80;
export const PROFILE_BIO_MAX_CHARS = 1000;
export const PROFILE_NAME_MIN_CHARS = 3;
