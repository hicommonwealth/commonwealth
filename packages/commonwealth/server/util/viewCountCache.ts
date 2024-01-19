import { JobRunner } from '@hicommonwealth/adapters';

type CacheT = { [viewerId: string]: { [objectId: string]: number } };

export default class ViewCountCache extends JobRunner<CacheT> {
  constructor(private _ttlS: number, _pruningJobTimeS: number) {
    super({}, _pruningJobTimeS);
    this.start();
  }

  // registers a page view, returning true if it's a new view,
  // or false if already seen in last ttlS seconds
  public async view(viewerId: string, objectId: string): Promise<boolean> {
    return this.access(async (c: CacheT) => {
      if (!c[viewerId]) {
        c[viewerId] = {};
      }
      const now = Date.now() / 1000;
      const oldestPermittedTime = now - this._ttlS;

      // if item doesn't exist or is too old, register a view. otherwise, ignore
      let isNewView: boolean;
      if (
        !c[viewerId][objectId] ||
        c[viewerId][objectId] < oldestPermittedTime
      ) {
        c[viewerId][objectId] = now;
        isNewView = true;
      } else {
        isNewView = false;
      }
      return isNewView;
    });
  }

  // prunes all expired cache entries based on initialized time-to-live
  protected async _job(c: CacheT): Promise<void> {
    const oldestPermittedTime = Date.now() / 1000 - this._ttlS;
    for (const viewerId of Object.keys(c)) {
      const views = c[viewerId];
      for (const objectId of Object.keys(views)) {
        if (views[objectId] < oldestPermittedTime) {
          delete views[objectId];
        }
      }

      // delete the entire session entry if no views remain
      if (Object.keys(views).length === 0) {
        delete c[viewerId];
      } else {
        c[viewerId] = views;
      }
    }
  }
}
