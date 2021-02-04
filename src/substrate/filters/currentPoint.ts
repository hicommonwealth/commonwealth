import { AccountId, EraPoints, EraRewardPoints, RewardPoint, EraIndex, BlockHash } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';


async function retrievePoints(api: ApiPromise, era: EraIndex, hash: BlockHash, validators: AccountId[]): Promise<EraRewardPoints> {
  const currentEraPointsEarned = await api.query.staking.currentEraPointsEarned.at<EraPoints>(hash, era);
  const total = currentEraPointsEarned.total;
  const individual = currentEraPointsEarned.individual;

  return await api.registry.createType('EraRewardPoints', {
    individual: new Map<AccountId, RewardPoint>(
      individual
        .map((points) => api.registry.createType('RewardPoint', points))
        .map((points, index): [AccountId, RewardPoint] => [validators[index] as AccountId, points])
    ),
    total
  });
}


export async function currentPoints(api: ApiPromise, era: EraIndex, hash: BlockHash, validators: AccountId[]): Promise<EraRewardPoints> {
  // when running against an archival node prior to a certain block number staking.erasRewardPoints does not exist!
  if (api.query.staking.erasRewardPoints)
    return await api.query.staking.erasRewardPoints.at<EraRewardPoints>(hash, era)
  else
    return await retrievePoints(api, era, hash, validators);
}