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
  public validatorNamesAddress() {
    return new Promise((resolve) => {
      return get('/getValidatorNamesAndAddresses', {}, resolve);
    });
  }
  public validatorDetail(state: string, stashes: any) {
    return new Promise((resolve) => {
      return get('/getValidatorDetail', {
        state,
        validatorStashes: stashes
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
