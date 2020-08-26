/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get } from 'lib/util';

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

  public getExposure(stash?: string) {
    return new Promise((resolve) => {
      return get('/getExposureOverTime', {
        chain: app.chain.id,
        stash
      }, resolve);
    });
  }
}

export default ChainEventsController;
