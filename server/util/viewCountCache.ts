import RWLock from 'async-rwlock';

export default class ViewCountCache {
  private _cache: { [viewerId: string]: { [objectId: string]: number } } = {};
  private _timeoutHandle: NodeJS.Timeout;

  // we use a mutex here to avoid updating views while pruning, as it could cause errors
  // due to object deletion.
  // we use an RW lock because multiple async views are fine (read behavior) whereas
  // prunes cannot overlap with themselves or reads (write behavior)
  private _lock = new RWLock();

  constructor(
    private _ttlS: number,
    private _pruningJobTimeS: number,
  ) {
    this._timeoutHandle = setInterval(() => this._prune(), this._pruningJobTimeS * 1000);
  }

  public close() {
    clearInterval(this._timeoutHandle);
    this._timeoutHandle = undefined;
  }

  // registers a page view, returning true if it's a new view,
  // or false if already seen in last ttlS seconds
  public async view(viewerId: string, objectId: string): Promise<boolean> {
    await this._lock.readLock();
    if (!this._cache[viewerId]) {
      this._cache[viewerId] = {};
    }
    const now = Date.now() / 1000;
    const oldestPermittedTime = now - this._ttlS;

    // if item doesn't exist or is too old, register a view. otherwise, ignore
    let isNewView: boolean;
    if (!this._cache[viewerId][objectId] || (this._cache[viewerId][objectId] < oldestPermittedTime)) {
      this._cache[viewerId][objectId] = now;
      isNewView = true;
    } else {
      isNewView = false;
    }
    this._lock.unlock();
    return isNewView;
  }

  // prunes all expired cache entries based on initialized time-to-live
  private async _prune(): Promise<void> {
    await this._lock.writeLock();
    const oldestPermittedTime = (Date.now() / 1000) - this._ttlS;
    for (const viewerId of Object.keys(this._cache)) {
      const views = this._cache[viewerId];
      for (const objectId of Object.keys(views)) {
        if (views[objectId] < oldestPermittedTime) {
          delete views[objectId];
        }
      }

      // delete the entire session entry if no views remain
      if (Object.keys(views).length === 0) {
        delete this._cache[viewerId];
      } else {
        this._cache[viewerId] = views;
      }
    }
    this._lock.unlock();
  }
}
