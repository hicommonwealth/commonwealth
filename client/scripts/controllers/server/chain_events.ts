/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get } from 'lib/util';
import { AccountId } from '@polkadot/types/interfaces';

class ChainEventsController {
  public constructor() {
    // do nothing
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
}

export default ChainEventsController;
