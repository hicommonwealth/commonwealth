import { CommunityType } from 'client/scripts/views/pages/create_community';
import { ChainBase } from 'common-common/src/types';

// Base Payload - Required for All Events
export interface BaseMixpanelPayload {
  event: MixpanelEvents;
  isCustomDomain: boolean;
}

// Include All Event Enums
export type MixpanelEvents =
  | MixpanelLoginEvent
  | MixpanelUserSignupEvent
  | MixpanelCommunityCreationEvent
  | MixpanelPageViewEvent
  | MixpanelCommunityInteractionEvent
  | MixpanelChatEvents
  | MixpanelSnapshotEvents
  | MixpanelErrorCaptureEvent;

// --------- EVENT DEFINITIONS --------- //

// PAGE VIEW EVENTS
export const enum MixpanelPageViewEvent {
  LANDING_PAGE_VIEW = 'Landing Page Viewed',
  COMMUNITY_CREATION_PAGE_VIEW = 'Create Community Page Viewed',
}

export interface MixpanelPageViewPayload extends BaseMixpanelPayload {
  event: MixpanelPageViewEvent;
}
// END PAGE VIEW EVENTS

// COMMUNITY INTERACTION EVENTS
export const enum MixpanelCommunityInteractionEvent {
  CREATE_THREAD = 'Create New Thread',
  CREATE_COMMENT = 'Create New Comment',
  CREATE_REACTION = 'Create New Reaction',
}

export interface MixpanelCommunityInteractionPayload
  extends BaseMixpanelPayload {
  event: MixpanelCommunityInteractionEvent;
  community: string;
}
// END COMMUNITY INTERACTION EVENTS

// LOGIN EVENT - fake
export const enum MixpanelLoginEvent {
  LOGIN = 'Login to Commonwealth',
}
export interface MixpanelLoginPayload extends BaseMixpanelPayload {
  event: MixpanelLoginEvent;
}
// END LOGIN EVENT

// NEW USER SIGNUP EVENT
export const enum MixpanelUserSignupEvent {
  NEW_USER_SIGNUP = 'New User Signup',
}
export interface MixpanelUserSignupPayload extends BaseMixpanelPayload {
  chain: string;
  event: MixpanelUserSignupEvent;
}
// END NEW USER SIGNUP EVENT

// ERROR CAPTURE EVENTS
export const enum MixpanelErrorCaptureEvent {
  ERROR_CAPTURED = 'Error Event Captured',
}

export interface MixpanelErrorCapturePayload extends BaseMixpanelPayload {
  message: string;
  community: string;
  event: MixpanelErrorCaptureEvent;
}
// END ERROR CAPTURE EVENTS

// NEW COMMUNITY CREATION EVENT
export const enum MixpanelCommunityCreationEvent {
  CREATE_BUTTON_PRESSED = 'Create Community Button Pressed',
  COMMUNITY_TYPE_CHOSEN = 'Create Community Type Chosen',
  CHAIN_SELECTED = 'Create Community Chain Selected',
  ADDRESS_ADDED = 'Create Community Address Added',
  WEBSITE_ADDED = 'Create Community Website Added',
  NEW_COMMUNITY_CREATION = 'New Community Creation',
  CREATE_COMMUNITY_ATTEMPTED = 'Create Community Attempted',
}

export interface MixpanelCommunityCreationPayload extends BaseMixpanelPayload {
  chainBase: ChainBase;
  communityType: CommunityType;
  event: MixpanelCommunityCreationEvent;
}
// END NEW COMMUNITY CREATION EVENT

// CHAT EVENTS
export const enum MixpanelChatEvents {
  NEW_CHAT_SENT = 'New Chat Sent',
  CHAT_PAGE_VISIT = 'Chat Page Visit',
  NEW_CHANNEL_CREATED = 'New Chat Channel Created',
  CHANNEL_NAME_CHANGED = 'Chat Channel Name Changed',
}

export interface MixpanelChatEventsPayload extends BaseMixpanelPayload {
  community: string;
  event: MixpanelChatEvents;
}
// END CHAT EVENTS

// SNAPSHOT EVENTS
export const enum MixpanelSnapshotEvents {
  SNAPSHOT_PAGE_VISIT = 'Snapshot Page Visited',
  SNAPSHOT_PROPOSAL_VIEWED = 'Snapshot Proposal Viewed',
  SNAPSHOT_VOTE_OCCURRED = 'Snapshot Vote Occurred',
  SNAPSHOT_VALID_SPACE = 'Snapshot Space Present',
  SNAPSHOT_INVALID_SPACE = 'Snapshot Space Not Present',
}

export interface MixpanelSnapshotEventsPayload extends BaseMixpanelPayload {
  event: MixpanelSnapshotEvents;
  space: string;
}
// END SNAPSHOT EVENTS
