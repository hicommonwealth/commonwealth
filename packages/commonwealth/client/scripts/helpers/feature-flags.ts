// This is our in memory provider setup. It does not automatically ensure your
// feature flag is set on our Unleash instance (May not be available on prod).
//
// See knowledge_base/Feature-Flags.md for more info.

import { InMemoryProvider } from '@openfeature/web-sdk';
import { UnleashClient } from 'unleash-proxy-client';
import { UnleashProvider } from '../../../shared/UnleashProvider';

const buildFlag = (env: string) => {
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
// webpack.base.config.mjs or they won't be passed to the frontend.
const featureFlags = {
  // @ts-expect-error StrictNullChecks
  allowlist: buildFlag(process.env.FLAG_ALLOWLIST),
  // @ts-expect-error StrictNullChecks
  contest: buildFlag(process.env.FLAG_CONTEST),
  // @ts-expect-error StrictNullChecks
  proposalTemplates: buildFlag(process.env.FLAG_PROPOSAL_TEMPLATES),
  // @ts-expect-error StrictNullChecks
  communityHomepage: buildFlag(process.env.FLAG_COMMUNITY_HOMEPAGE),
  // @ts-expect-error StrictNullChecks
  communityStake: buildFlag(process.env.FLAG_COMMUNITY_STAKE),
  // @ts-expect-error StrictNullChecks
  userOnboardingEnabled: buildFlag(process.env.FLAG_USER_ONBOARDING_ENABLED),
  knockInAppNotifications: buildFlag(
    // @ts-expect-error StrictNullChecks
    process.env.FLAG_KNOCK_INTEGRATION_ENABLED,
  ),
  // @ts-expect-error StrictNullChecks
  contestDev: buildFlag(process.env.FLAG_CONTEST_DEV),
  knockPushNotifications: buildFlag(
    process.env.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED,
  ),
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
