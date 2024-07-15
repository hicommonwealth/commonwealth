import { viewGlobalActivity } from '../util/apiRequests/feeds/globalActivity.ts';
import { LEGACY_API_URL } from '../util/config.ts';
import { createScenario } from '../util/scenarios.ts';

export const options = {
  scenarios: {
    globalFeedOnly: createScenario({
      options: {
        testFuncName: 'globalActivity',
      },
    }),
    // userFeedOnly: createScenario({
    //   options: {
    //     testFuncName: 'userActivity',
    //   }
    // }),
    // combinedFeeds: createScenario({
    //   options: {
    //     testFuncName: 'combineFeeds',
    //   }
    // })
  },
};

// export function setup() {
//
// }

export async function globalActivity() {
  viewGlobalActivity(LEGACY_API_URL);
}

// export async function userActivity() {}
//
// export async function combinedFeeds() {}
