"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentPoints = void 0;
function currentPoints(api, era, hash, validators) {
    const points = {};
    // api call to retreive eraRewardPoints for version >= 38
    if (api.query.staking.erasRewardPoints)
        return api.query.staking.erasRewardPoints
            .at(hash, era)
            .then((rewardPoints) => {
            rewardPoints.individual.forEach((rewardPoint, accountKey) => {
                points[accountKey.toString()] = +rewardPoint;
            });
            return points;
        });
    // creating eraRewardPoints for  for version = 31
    return api.query.staking.currentEraPointsEarned
        .at(hash, era)
        .then((eraPoints) => {
        const { individual } = eraPoints;
        individual.forEach((point, idx) => {
            points[validators[idx].toString()] = +point;
        });
        return points;
    });
}
exports.currentPoints = currentPoints;
