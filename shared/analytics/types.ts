// --------- EVENT DEFINITIONS --------- //

import { CommunityType } from 'client/scripts/views/pages/create_community';
import { ChainBase } from 'shared/types';

// LOGIN EVENT - fake
export const enum MixpanelLoginFlowEvents {
  LOGIN_BUTTON_PRESS = 'Login Button Press',
  LOGIN_SUCCESSFUL = 'Login Successful',
}

export const enum LoginEntryPoint {
  HOMEPAGE = 'Homepage',
  COMMUNITY = 'Community',
}

export interface MixpanelLoginPayload extends BaseMixpanelPayload {
  entryPoint: LoginEntryPoint;
  event: MixpanelLoginFlowEvents;
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
  NEW_COMMUNITY_CREATION = 'New Community Creation',
}

export interface MixpanelCommunityCreationPayload extends BaseMixpanelPayload {
  chainBase: ChainBase;
  event: MixpanelCommunityCreationEvent;
}
// END NEW COMMUNITY CREATION EVENT

// --------- END EVENT DEFINITIONS --------- //

// Include All Event Enums
export type MixpanelEvents =
  | MixpanelLoginFlowEvents
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
