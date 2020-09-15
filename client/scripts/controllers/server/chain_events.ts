/* eslint-disable no-restricted-syntax */
import app from 'state';
import { get, post } from 'lib/util';

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

  public getNominatorsOverTime(stash?: string) {
    return new Promise((resolve) => {
      return get('/getNominatorsOverTime', {
        chain: app.chain.id,
        stash
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

  public createValidatorGroups(payload: {stashes: string[], name: string}) {
    return new Promise((resolve) => {
      return post('/createValidatorGroup', {
        chain: app.chain.id,
        jwt: app.user.jwt,
        ...payload
      }, resolve);
    });
  }

  public getValidatorGroups(payload) {
    return new Promise((resolve) => {
      return get('/getValidatorGroup', {
        chain: app.chain.id,
        jwt: app.user.jwt,
        ...payload
      }, resolve);
    });
  }

  public getImOnline(stash?: string) {
    return new Promise((resolve) => {
      return get('/getImOnline', {
        chain: app.chain.id,
        stash
      }, resolve);
    });
  }
}

export default ChainEventsController;
