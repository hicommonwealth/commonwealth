import JobRunner from 'common-common/src/cacheJobRunner';
import type { GlobalActivity } from './queryGlobalActivity';
import { default as queryGlobalActivity } from './queryGlobalActivity';
import type { DB } from '../models';

type CacheT = { activity: GlobalActivity };

export default class GlobalActivityCache extends JobRunner<CacheT> {
  constructor(
    private _models: DB,
    _time: number = 60 * 5 // 5 minutes
  ) {
    super({ activity: [] }, _time, false);
  }

  public async start() {
    await this.run();
    super.start();
  }

  public async globalActivity(): Promise<GlobalActivity> {
    return this.access<GlobalActivity>(async (c) => c.activity);
  }

  // prunes all expired cache entries based on initialized time-to-live
  protected async _job(): Promise<void> {
    const globalActivity = await queryGlobalActivity(this._models);
    await this.write(async (c) => {
      c.activity = globalActivity;
    });
  }
}
