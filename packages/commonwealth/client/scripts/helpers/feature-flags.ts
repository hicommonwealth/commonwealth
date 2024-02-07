export const featureFlags = {
  proposalTemplates: process.env.FLAG_PROPOSAL_TEMPLATES === 'true',
  communityHomepage: process.env.FLAG_COMMUNITY_HOMEPAGE === 'true',
  newAdminOnboardingEnabled: process.env.FLAG_NEW_ADMIN_ONBOARDING === 'true',
  communityStake: process.env.FLAG_COMMUNITY_STAKE === 'true',
  newSignInModal: process.env.FLAG_NEW_SIGN_IN_MODAL === 'true',
};
