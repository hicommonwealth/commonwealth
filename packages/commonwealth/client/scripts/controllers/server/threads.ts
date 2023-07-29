/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */
class ThreadsController {
  private static _instance: ThreadsController;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public numVotingThreads: number;
  public numTotalThreads: number;

  public initialize(
    numVotingThreads,
    numTotalThreads,
  ) {
    this.numVotingThreads = numVotingThreads;
    this.numTotalThreads = numTotalThreads;
  }

  public deinit() {
    this.numTotalThreads = 0;
  }
}

export default ThreadsController;
