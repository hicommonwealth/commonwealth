import { Observable } from 'rxjs';
/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get } from 'lib/util';

class StakingController {
    public constructor() {
        // do nothing
    }

    public globalStatistics() {
        return new Promise((resolve) => {
            return get('/getGlobalStatistics', {}, resolve);
        });
    }
    public validatorDetails(searchCriteria?: any, pagination?: any) {
        return new Promise((resolve) => {
            return get('/getValidatorDetails', {
                searchCriteria, pagination
            }, resolve);
        });
    }
    public currentValidators(searchCriteria, pagination) {
        return new Promise((resolve) => {
            return get('/getCurrentValidators', {
                searchCriteria,
                pagination
            }, resolve);
        });
    }
    public waitingValidators(searchCriteria?: any, pagination?: any) {
        return new Promise((resolve) => {
            return get('/getWaitingValidators', {
                searchCriteria, pagination
            }, resolve);
        });
    }
    public offences(stash?: string) {
        return new Promise((resolve) => {
            return get('/getOffences', {
                chain: app.chain.id,
                stash
            }, resolve);
        });
    }

    public rewards(stash?: string) {
        return new Promise((resolve) => {
            return get('/getRewards', {
                chain: app.chain.id,
                stash
            }, resolve);
        });
    }

    public getOwnStakeOverTime(stash?: string) {
        return new Promise((resolve) => {
            return get('/getOwnStakeOverTime', {
                chain: app.chain.id,
                stash
            }, resolve);
        });
    }

    public getTotalStakeOverTime(stash?: string) {
        return new Promise((resolve) => {
            return get('/getTotalStakeOverTime', {
                chain: app.chain.id,
                stash
            }, resolve);
        });
    }

    public getOtherStakeOverTime(stash?: string) {
        return new Promise((resolve) => {
            return get('/getOtherStakeOverTime', {
                chain: app.chain.id,
                stash
            }, resolve);
        });
    }

    public getNominatorsOverTime(stash?: string) {
        return new Promise((resolve) => {
            return get('/getNominatorsOverTime', {
                chain: app.chain.id,
                stash
            }, resolve);
        });
    }

}

export default StakingController;
