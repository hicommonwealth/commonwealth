export const featureFlags = {
  proposalTemplates: process.env.FLAG_PROPOSAL_TEMPLATES === 'true',
  communityHomepage: process.env.FLAG_COMMUNITY_HOMEPAGE === 'true',
  newAdminOnboardingEnabled: process.env.FLAG_NEW_ADMIN_ONBOARDING === 'true',
  communityStake: process.env.FLAG_COMMUNITY_STAKE === 'true',
  mobileNavigation: process.env.FLAG_MOBILE_NAVIGATION === 'true',
};
