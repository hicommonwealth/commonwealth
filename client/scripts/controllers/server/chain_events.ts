/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get } from 'lib/util';
import { AccountId } from '@polkadot/types/interfaces';

class ChainEventsController {
  public constructor() {
    // do nothing
  }

  public offences() {
    return new Promise((resolve) => {
      return get('/getOffences/:stash_id?', {
        chain: app.chain.id
      }, resolve);
    });
  }

  public rewards() {
    return new Promise((resolve) => {
      return get('/getRewards/:stash_id?', {
        chain: app.chain.id,
      }, resolve);
    });
  }

  public getOwnStakeOverTime() {
    return new Promise((resolve) => {
      return get('/getOwnStakeOverTime/:stash_id?', {
        chain: app.chain.id,
      }, resolve);
    });
  }

  public getTotalStakeOverTime() {
    return new Promise((resolve) => {
      return get('/getTotalStakeOverTime/:stash_id?', {
        chain: app.chain.id,
      }, resolve);
    });
  }

  public getOtherStakeOverTime() {
    return new Promise((resolve) => {
      return get('/getOtherStakeOverTime/:stash_id?', {
        chain: app.chain.id,
      }, resolve);
    });
  }
}

export default ChainEventsController;
