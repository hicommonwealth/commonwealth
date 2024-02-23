import { ChainBase } from '@hicommonwealth/core';

export const enum MixpanelPageViewEvent {
  LANDING_PAGE_VIEW = 'Landing Page Viewed',
  COMMUNITY_CREATION_PAGE_VIEW = 'Create Community Page Viewed',
  THREAD_PAGE_VIEW = 'Thread Page Viewed',
  DASHBOARD_VIEW = 'Dashbboard Page Viewed',
  MEMBERS_PAGE_VIEW = 'Members Page Viewed',
  GROUPS_PAGE_VIEW = 'Groups Page Viewed',
  GROUPS_CREATION_PAGE_VIEW = 'Create Group Page Viewed',
  GROUPS_EDIT_PAGE_VIEW = 'Edit Group Page Viewed',
  DIRECTORY_PAGE_VIEW = 'Directory Page Viewed',
}

export const enum MixpanelCommunityInteractionEvent {
  CREATE_THREAD = 'Create New Thread',
  CREATE_COMMENT = 'Create New Comment',
  CREATE_REACTION = 'Create New Reaction',
  CREATE_TOPIC = 'Create New Topic',
  UPDATE_TOPIC = 'Update Topic',
  CREATE_GROUP = 'Create New Group',
  JOIN_COMMUNITY = 'Join Community',
  CREATE_POLL = 'Create New Poll',
  SUBMIT_VOTE = 'Submit Vote',
  LINKED_PROPOSAL = 'Linked Proposal',
  LINKED_TEMPLATE = 'Linked Template',
  LINKED_THREAD = 'Linked Thread',
  LINKED_URL = 'Linked URL',
  LINK_PROPOSAL_BUTTON_PRESSED = 'Link Proposal Button Pressed',
  UPDATE_STAGE = 'Update Stage',
  UPDATE_GROUP = 'Update Group',
  DIRECTORY_PAGE_ENABLED = 'Directory Page Enabled',
  DIRECTORY_PAGE_DISABLED = 'Directory Page Disabled',
}

export const enum MixpanelCommunityStakeEvent {
  STAKE_BOUGHT = 'Stake Bought',
  STAKE_SOLD = 'Stake Sold',
  RESERVED_COMMUNITY_NAMESPACE = 'Community Namespace Reserved',
  LAUNCHED_COMMUNITY_STAKE = 'Community Stake Launched',
}

export const enum MixpanelLoginEvent {
  LOGIN = 'Login',
  LOGIN_COMPLETED = 'Login Completed',
  LOGIN_FAILED = 'Login Failed',
}

export const enum MixpanelUserSignupEvent {
  NEW_USER_SIGNUP = 'New User Signup',
}

export const enum MixpanelErrorCaptureEvent {
  ERROR_CAPTURED = 'Error Event Captured',
  UNKNOWN_EVENT = 'Unknown Event',
}

export const enum MixpanelClickthroughEvent {
  VIEW_THREAD_TO_MEMBERS_PAGE = 'Clickthrough: View Thread to Members Page -> Groups Tab',
  DIRECTORY_TO_COMMUNITY_PAGE = 'Clickthrough: Directory to Community Page',
}

export const enum MixpanelCommunityCreationEvent {
  CREATE_BUTTON_PRESSED = 'Create Community Button Pressed',
  COMMUNITY_TYPE_CHOSEN = 'Create Community Type Chosen',
  CREATE_COMMUNITY_VISITED = '/createCommunity Page Visited',
  CONNECT_NEW_WALLET_PRESSED = 'Connect New Wallet Button Pressed',
  NEW_COMMUNITY_CREATION = 'New Community Creation',
  CREATE_COMMUNITY_CANCELLED = 'Create Community Cancel Button Pressed',
}

export const enum MixpanelSnapshotEvents {
  SNAPSHOT_PAGE_VISIT = 'Snapshot Page Visited',
  SNAPSHOT_PROPOSAL_VIEWED = 'Snapshot Proposal Viewed',
  SNAPSHOT_VOTE_OCCURRED = 'Snapshot Vote Occurred',
  SNAPSHOT_PROPOSAL_CREATED = 'Snapshot Proposal Created',
}

export type MixpanelEvents =
  | MixpanelLoginEvent
  | MixpanelUserSignupEvent
  | MixpanelCommunityCreationEvent
  | MixpanelCommunityStakeEvent
  | MixpanelPageViewEvent
  | MixpanelCommunityInteractionEvent
  | MixpanelSnapshotEvents
  | MixpanelErrorCaptureEvent
  | MixpanelClickthroughEvent;

export type AnalyticsEvent = MixpanelEvents; // add other providers events here

export interface AnalyticsPayload {
  event: AnalyticsEvent; // base event type
}

export interface BaseMixpanelPayload extends AnalyticsPayload {
  event: MixpanelEvents;
  userAddress?: string;
  community?: string;
  communityType?: string;
  userId?: number;
  communitySelected?: string;
  proposalType?: string;
  chainBase?: ChainBase;
}

export interface MixpanelLoginPayload extends BaseMixpanelPayload {
  loginOption: string;
  isSocialLogin: boolean;
  loginPageLocation: string;
  isMobile: boolean;
}

export type MixpanelClickthroughPayload = BaseMixpanelPayload;
export type MixpanelPageViewEventPayload = BaseMixpanelPayload;
export type MixpanelCommunityInteractionEventPayload = BaseMixpanelPayload;

export const providers = ['mixpanel']; // add other providers here
