// This is our in memory provider setup. It does not automatically ensure your
// feature flag is set on our Unleash instance (May not be available on prod).
//
// See knowledge_base/Feature-Flags.md for more info.

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
  knockPushNotifications: buildFlag(
    process.env.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED,
  ),
  farcasterContest: buildFlag(process.env.FLAG_FARCASTER_CONTEST),
  newEditor: buildFlag(process.env.FLAG_NEW_EDITOR),
  launchpad: buildFlag(process.env.FLAG_LAUNCHPAD),
  uniswapTrade: buildFlag(process.env.FLAG_UNISWAP_TRADE),
  manageApiKeys: buildFlag(process.env.FLAG_MANAGE_API_KEYS),
  referrals: buildFlag(process.env.FLAG_REFERRALS),
  stickyEditor: buildFlag(process.env.FLAG_STICKY_EDITOR),
  newMobileNav: buildFlag(process.env.FLAG_NEW_MOBILE_NAV),
  rewardsPage: buildFlag(process.env.FLAG_REWARDS_PAGE),
  xp: buildFlag(process.env.FLAG_XP),
  growl: buildFlag(process.env.FLAG_GROWL),
};

export type AvailableFeatureFlag = keyof typeof featureFlags;

const unleashConfig = {
  url: process.env.UNLEASH_FRONTEND_SERVER_URL,
  clientKey: process.env.UNLEASH_FRONTEND_API_TOKEN,
  refreshInterval: 120,
  appName: process.env.HEROKU_APP_NAME,
};

export const openFeatureProvider = process.env.UNLEASH_FRONTEND_API_TOKEN
  ? // @ts-expect-error StrictNullChecks
    new UnleashProvider(new UnleashClient(unleashConfig))
  : new InMemoryProvider(featureFlags);
