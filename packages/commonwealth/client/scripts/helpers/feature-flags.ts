// As of 240205, we are moving away from the use of env vars for feature flags,
// and towards the use of Unleash for all flag management.
//
// See knowledge_base/Feature-Flags.md for info.

export const featureFlags = {
  proposalTemplates: process.env.FLAG_PROPOSAL_TEMPLATES === 'true',
  communityHomepage: process.env.FLAG_COMMUNITY_HOMEPAGE === 'true',
  sidebarToggle: process.env.FLAG_SIDEBAR_TOGGLE === 'true',
  newAdminOnboardingEnabled: process.env.FLAG_NEW_ADMIN_ONBOARDING === 'true',
  communityStake: process.env.FLAG_COMMUNITY_STAKE === 'true',
};
