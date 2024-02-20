// This is our in memory provider setup. It does not automatically ensure your
// feature flag is set on our Unleash instance (May not be available on prod).
//
// See knowledge_base/Feature-Flags.md for more info.

const buildFlag = (env: string) => {
  return {
    variants: {
      on: true,
      off: false,
    },
    disabled: false,
    defaultVariant: env === 'true' ? 'on' : 'off',
  };
};

export const featureFlags = {
  proposalTemplates: buildFlag(process.env.FLAG_PROPOSAL_TEMPLATES),
  communityHomepage: buildFlag(process.env.FLAG_COMMUNITY_HOMEPAGE),
  newAdminOnboarding: buildFlag(process.env.FLAG_NEW_ADMIN_ONBOARDING),
  communityStake: buildFlag(process.env.FLAG_COMMUNITY_STAKE),
  newSignInModal: buildFlag(process.env.FLAG_NEW_SIGN_IN_MODAL),
  rootDomainRebrand: buildFlag(process.env.FLAG_ROOT_DOMAIN_REBRAND),
};

export type AvailableFeatureFlag = keyof typeof featureFlags;
