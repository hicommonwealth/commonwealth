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
      return get('/getOffences', { chain: app.chain.id }, resolve);
    });
  }

  public rewards() {
    return new Promise((resolve) => {
      return get('/getRewards', {
        chain: app.chain.id,
      }, resolve);
    });
  }
}

export default ChainEventsController;
