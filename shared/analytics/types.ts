// --------- EVENT DEFINITIONS --------- //

import { CommunityType } from 'client/scripts/views/pages/create_community';
import { ChainBase } from 'shared/types';

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

export const enum MixpanelUserSignupEntryPoint {
  CUSTOM_DOMAIN = 'Custom Domain',
  LINKED_THREAD = 'Linked Thread',
  LANDING_PAGE = 'Landing Page',
}

export interface MixpanelUserSignupPayload extends BaseMixpanelPayload {
  chain: string;
  entryPoint: MixpanelUserSignupEntryPoint;
  event: MixpanelUserSignupEvent;
}
// END NEW USER SIGNUP EVENT

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

// --------- END EVENT DEFINITIONS --------- //

// Include All Event Enums
export type MixpanelEvents =
  | MixpanelLoginEvent
  | MixpanelUserSignupEvent
  | MixpanelCommunityCreationEvent
  | MixpanelPageViewEvent
  | MixpanelCommunityInteractionEvent
  | MixpanelChatEvents;

// Base Payload - Required for All Events
export interface BaseMixpanelPayload {
  event: MixpanelEvents;
}

// Include all Payload Options
export type MixpanelPayload =
  | MixpanelLoginPayload
  | BaseMixpanelPayload
  | MixpanelCommunityCreationPayload
  | MixpanelPageViewPayload
  | MixpanelCommunityInteractionPayload
  | MixpanelChatEventsPayload;
