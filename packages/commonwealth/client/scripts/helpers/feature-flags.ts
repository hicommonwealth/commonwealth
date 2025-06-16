// This is our in memory provider setup. It does not automatically ensure your
// feature flag is set on our Unleash instance (May not be available on prod).
//
// See knowledge_base/Feature-Flags.md for more info.

import { UNLEASH_FRONTEND_SERVER_URL } from '@hicommonwealth/shared';
import { InMemoryProvider } from '@openfeature/web-sdk';
import { UnleashClient } from 'unleash-proxy-client';
import { UnleashProvider } from '../../../shared/UnleashProvider';

const buildFlag = (env: string | undefined) => {
  return {
    variants: {
      on: true,
      off: false,
    },
    disabled: false,
    defaultVariant: env === 'true' || env === 'on' ? 'on' : 'off',
  };
};

// WARN: for frontend work you MUST define these feature flags in
// vite.config.ts (locally) or in Unleash (remote apps) or they won't be passed to the frontend.
const featureFlags = {
  contestDev: buildFlag(process.env.FLAG_CONTEST_DEV),
  newEditor: buildFlag(process.env.FLAG_NEW_EDITOR),
  launchpad: buildFlag(process.env.FLAG_LAUNCHPAD),
  newContestPage: buildFlag(process.env.FLAG_NEW_CONTEST_PAGE),
  referrals: buildFlag(process.env.FLAG_REFERRALS),
  mobileDownload: buildFlag(process.env.FLAG_MOBILE_DOWNLOAD),
  onchainReferrals: buildFlag(process.env.FLAG_ONCHAIN_REFERRALS),
  newMobileNav: buildFlag(process.env.FLAG_NEW_MOBILE_NAV),
  rewardsPage: buildFlag(process.env.FLAG_REWARDS_PAGE),
  xp: buildFlag(process.env.FLAG_XP),
  growl: buildFlag(process.env.FLAG_GROWL),
  homePage: buildFlag(process.env.FLAG_HOMEPAGE),
  aiComments: buildFlag(process.env.FLAG_AI_COMMENTS),
  governancePage: buildFlag(process.env.FLAG_NEW_GOVERNANCE_PAGE),
  privy: buildFlag(process.env.FLAG_PRIVY),
  judgeContest: buildFlag(process.env.FLAG_JUDGE_CONTEST),
  trustLevel: buildFlag(process.env.FLAG_TRUST_LEVEL),
  tokenizedThreads: buildFlag(process.env.FLAG_TOKENIZED_THREADS),
  partnershipWallet: buildFlag(process.env.FLAG_PARTNERSHIP_WALLET),
  newProfilePage: buildFlag(process.env.FLAG_NEW_PROFILE_PAGE),
  privateTopics: buildFlag(process.env.FLAG_PRIVATE_TOPICS),
};

export type AvailableFeatureFlag = keyof typeof featureFlags;

export const initializeFeatureFlags = (
  unleashApiToken?: string,
  appName?: string,
) => {
  if (!unleashApiToken || !appName) {
    console.warn(
      'No unleashApiToken or appName provided, using in-memory provider',
    );
    return new InMemoryProvider(featureFlags);
  }

  const unleashConfig = {
    url: UNLEASH_FRONTEND_SERVER_URL,
    clientKey: unleashApiToken,
    refreshInterval: 120,
    appName,
  };

  return new UnleashProvider(new UnleashClient(unleashConfig));
};
