export const enum MixpanelPageViewEvent {
  LANDING_PAGE_VIEW = 'Landing Page Viewed',
  COMMUNITY_CREATION_PAGE_VIEW = 'Create Community Page Viewed',
}

export const enum MixpanelCommunityInteractionEvent {
  CREATE_THREAD = 'Create New Thread',
  CREATE_COMMENT = 'Create New Comment',
  CREATE_REACTION = 'Create New Reaction',
}

export const enum MixpanelLoginEvent {
  LOGIN = 'Login to Commonwealth',
}

export const enum MixpanelUserSignupEvent {
  NEW_USER_SIGNUP = 'New User Signup',
}

export const enum MixpanelErrorCaptureEvent {
  ERROR_CAPTURED = 'Error Event Captured',
}

export const enum MixpanelCommunityCreationEvent {
  CREATE_BUTTON_PRESSED = 'Create Community Button Pressed',
  COMMUNITY_TYPE_CHOSEN = 'Create Community Type Chosen',
  CHAIN_SELECTED = 'Create Community Chain Selected',
  ADDRESS_ADDED = 'Create Community Address Added',
  WEBSITE_ADDED = 'Create Community Website Added',
  NEW_COMMUNITY_CREATION = 'New Community Creation',
  CREATE_COMMUNITY_ATTEMPTED = 'Create Community Attempted',
}

export const enum MixpanelSnapshotEvents {
  SNAPSHOT_PAGE_VISIT = 'Snapshot Page Visited',
  SNAPSHOT_PROPOSAL_VIEWED = 'Snapshot Proposal Viewed',
  SNAPSHOT_VOTE_OCCURRED = 'Snapshot Vote Occurred',
}

export type MixpanelEvents =
  | MixpanelLoginEvent
  | MixpanelUserSignupEvent
  | MixpanelCommunityCreationEvent
  | MixpanelPageViewEvent
  | MixpanelCommunityInteractionEvent
  | MixpanelSnapshotEvents
  | MixpanelErrorCaptureEvent;

export type AnalyticsEvent = MixpanelEvents; // add other providers events here

export interface AnalyticsPayload {
  event: any; // base event type
  isCustomDomain?: boolean;
  communityType?: string;
  chainBase?: string;
  community?: string;
  chain?: string;
}

export interface BaseMixpanelPayload extends AnalyticsPayload {
  event: MixpanelEvents;
  isCustomDomain: boolean;
}

export const providers = ['mixpanel']; // add other providers here
