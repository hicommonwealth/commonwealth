import {
  viewGlobalActivity,
  viewUserActivity,
} from '../util/apiRequests/feed.ts';
import { createJwts } from '../util/apiRequests/utility.ts';
import { LEGACY_API_URL, TRPC_API_URL } from '../util/config.ts';
import { createScenario } from '../util/scenarios.ts';
import { IgnoreLifecycleMetrics } from '../util/utils.ts';

export const options = {
  ...IgnoreLifecycleMetrics,
  // scenarios
  scenarios: {
    globalFeedOnly: createScenario({
      options: {
        testFuncName: 'globalActivity',
      },
    }),
    userFeedOnly: createScenario({
      options: {
        testFuncName: 'userActivity',
      },
    }),
  },
};

export function setup(): string[] {
  // this creates 100 jwts aka 'users' that will be used to make requests
  return createJwts(TRPC_API_URL, 100);
}

export async function globalActivity() {
  viewGlobalActivity(LEGACY_API_URL);
}

export async function userActivity(jwts: string) {
  const jwt = jwts[Math.floor(Math.random() * jwts.length)];
  viewUserActivity(LEGACY_API_URL, jwt);
}
