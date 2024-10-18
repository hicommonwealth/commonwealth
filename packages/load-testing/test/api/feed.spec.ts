import {
  getGlobalActivity,
  getUserActivity,
} from '../util/apiRequests/feed.ts';
import { createJwts } from '../util/apiRequests/utility.ts';
import { TRPC_API_URL } from '../util/config.ts';
import { createScenario } from '../util/scenarios.ts';
import { IgnoreLifecycleMetrics } from '../util/utils.ts';

export const options = {
  ...IgnoreLifecycleMetrics,
  scenarios: {
    globalFeed: createScenario({
      options: {
        testFuncName: 'globalActivity',
      },
      quickDevScenario: {
        iterations: 500,
      },
    }),
    userFeed: createScenario({
      options: {
        testFuncName: 'userActivity',
      },
      quickDevScenario: {
        iterations: 500,
      },
    }),
  },
};

export function setup(): string[] {
  // this creates 100 jwts aka 'users' that will be used to make requests
  return createJwts(TRPC_API_URL, 100);
}

export async function globalActivity() {
  getGlobalActivity(TRPC_API_URL);
}

export async function userActivity(jwts: string) {
  const jwt = jwts[Math.floor(Math.random() * jwts.length)];
  getUserActivity(TRPC_API_URL, jwt);
}
