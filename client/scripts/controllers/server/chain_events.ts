/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get } from 'lib/util';

class ChainEventsController {
  public constructor() {
    // do nothing
  }

  public offences(callback) {
    return get('/getOffences', { chain: app.chain.id }, callback);
  }

  public rewards() {
    return new Promise((resolve) => {
      return get('/getRewards', { chain: app.chain.id }, resolve);
    });
  }
}

export default ChainEventsController;
