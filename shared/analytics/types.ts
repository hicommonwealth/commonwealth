// --------- EVENT DEFINITIONS --------- //

import { CommunityType } from 'client/scripts/views/pages/create_community';
import { ChainBase } from 'shared/types';

// LOGIN EVENT - fake
export const enum MixpanelLoginEvent {
  LOGIN = 'Login',
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
  COMMUNITY_CREATION_PAGE_VIEW = 'Create Community Page Viewed',
  CREATE_BUTTON_PRESSED = 'Create Community Button Pressed',
  COMMUNITY_TYPE_CHOSEN = 'Create Community Type Chosen',
  CHAIN_SELECTED = 'Create Community Chain Selected',
  ADDRESS_ADDED = 'Create Community Address Added',
  WEBSITE_ADDED = 'Create Community Website Added',
  NEW_COMMUNITY_CREATION = 'New Community Creation',
}

export interface MixpanelCommunityCreationPayload extends BaseMixpanelPayload {
  chainBase: ChainBase;
  communityType: CommunityType;
  event: MixpanelCommunityCreationEvent;
}
// END NEW COMMUNITY CREATION EVENT

// --------- END EVENT DEFINITIONS --------- //

// Include All Event Enums
export type MixpanelEvents =
  | MixpanelLoginEvent
  | MixpanelUserSignupEvent
  | MixpanelCommunityCreationEvent;

// Base Payload - Required for All Events
export interface BaseMixpanelPayload {
  event: MixpanelEvents;
}

// Include all Payload Options
export type MixpanelPayload =
  | MixpanelLoginPayload
  | BaseMixpanelPayload
  | MixpanelCommunityCreationPayload;
