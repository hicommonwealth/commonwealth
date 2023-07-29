/* eslint-disable no-restricted-globals */
import moment from 'moment';
/* eslint-disable no-restricted-syntax */
import type MinimumProfile from '../../models/MinimumProfile';

export interface VersionHistory {
  author?: MinimumProfile;
  timestamp: moment.Moment;
  body: string;
}

class ThreadsController {
  private static _instance: ThreadsController;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  public numVotingThreads: number;
  public numTotalThreads: number;

  public initialize(
    numVotingThreads,
    numTotalThreads,
  ) {
    this.numVotingThreads = numVotingThreads;
    this.numTotalThreads = numTotalThreads;
    this._initialized = true;
  }

  public deinit() {
    this._initialized = false;
    this.numTotalThreads = 0;
  }
}

export default ThreadsController;
