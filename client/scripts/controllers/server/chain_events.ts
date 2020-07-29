/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get, post } from 'lib/util';

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

  public createChainStake(payload) {
    return new Promise((resolve) => {
      return post('/createChainStake', {
        chain: app.chain.id,
        jwt: app.user.jwt,
        ...payload
      }, resolve);
    });
  }

  public getChainStake(payload) {
    return new Promise((resolve) => {
      return get('/getChainStake', {
        chain: app.chain.id,
        jwt: app.user.jwt,
        ...payload
      }, resolve);
    });
  }
}

export default ChainEventsController;
