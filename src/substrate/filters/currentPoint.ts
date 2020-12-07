import { AccountId, EraPoints, EraRewardPoints, RewardPoint } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';


async function retrievePoints (api: ApiPromise    , currentElected: AccountId[]): Promise<EraRewardPoints> {
    let currentEraPointsEarned = await api.query.staking.currentEraPointsEarned<EraPoints>();
    let total = currentEraPointsEarned.total;
    let individual = currentEraPointsEarned.individual;
    return await api.registry.createType('EraRewardPoints', {
          individual: new Map<AccountId, RewardPoint>(
            individual
              .map((points) => api.registry.createType('RewardPoint', points))
              .map((points, index): [AccountId, RewardPoint] => [currentElected[index], points])
            ),
            total
        });
}


export async function currentPoints (api: ApiPromise): Promise<EraRewardPoints> {
    const apiOverview = await api.derive.staking.overview();
    
    // when running against an archival node .staking.erasRewardPoints does not exist!
    if (api.query.staking.erasRewardPoints)
        return await api.query.staking.erasRewardPoints<EraRewardPoints>(apiOverview.activeEra)
    else
        return await retrievePoints(api, apiOverview.nextElected);
}