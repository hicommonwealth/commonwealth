export const featureFlags = {
  proposalTemplates: process.env.FLAG_PROPOSAL_TEMPLATES === 'true',
  communityHomepage: process.env.FLAG_COMMUNITY_HOMEPAGE === 'true',
  sidebarToggle: process.env.FLAG_SIDEBAR_TOGGLE === 'true',
  newAdminOnboardingEnabled: process.env.FLAG_NEW_ADMIN_ONBOARDING === 'true',
  communityStake: process.env.FLAG_COMMUNITY_STAKE === 'true',
  newSignInModal: process.env.FLAG_NEW_SIGN_IN_MODAL === 'true',
};
