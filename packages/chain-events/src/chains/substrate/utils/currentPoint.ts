import type {
  AccountId,
  EraPoints,
  EraRewardPoints,
  EraIndex,
  BlockHash,
} from '@polkadot/types/interfaces';
import type { ApiPromise } from '@polkadot/api';

import type { AccountPoints } from '../types';

export function currentPoints(
  api: ApiPromise,
  era: EraIndex,
  hash: BlockHash,
  validators: AccountId[]
): Promise<AccountPoints> {
  const points: AccountPoints = {};
  // api call to retreive eraRewardPoints for version >= 38
  if (api.query.staking.erasRewardPoints)
    return api.query.staking.erasRewardPoints
      .at<EraRewardPoints>(hash, era)
      .then((rewardPoints) => {
        rewardPoints.individual.forEach((rewardPoint, accountKey) => {
          points[accountKey.toString()] = +rewardPoint;
        });
        return points;
      });

  // creating eraRewardPoints for  for version = 31
  return api.query.staking.currentEraPointsEarned
    .at<EraPoints>(hash, era)
    .then((eraPoints) => {
      const { individual } = eraPoints;
      individual.forEach((point, idx) => {
        points[validators[idx].toString()] = +point;
      });
      return points;
    });
}
