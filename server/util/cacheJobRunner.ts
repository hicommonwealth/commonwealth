import RWLock from 'async-rwlock';

// Maintains a cache with periodic, atomic jobs that also permits direct,
// non-atomic, write access to the cache.
export default abstract class JobRunner<CacheT> {
  private _timeoutHandle: NodeJS.Timeout;

  // we use a mutex here to avoid updating views while pruning, as it could cause errors
  // due to object deletion.
  // we use an RW lock because multiple async accesses are fine (read behavior) whereas
  // jobs cannot overlap with themselves or reads (write behavior)
  private _lock = new RWLock();

  constructor(
    private _cache: CacheT,
    private _jobTimeS: number,
  ) {
  }

  public start(...args) {
    if (this._jobTimeS > 0) {
      this._timeoutHandle = setInterval(() => this.run(), this._jobTimeS * 1000);
    }
  }

  public close() {
    clearInterval(this._timeoutHandle);
    this._timeoutHandle = undefined;
  }

  // viewFn may manipulate the cache, but it must do so atomically
  public async access<ReturnT>(viewFn: (c: CacheT) => Promise<ReturnT>): Promise<ReturnT> {
    await this._lock.readLock();
    const result = await viewFn(this._cache);
    this._lock.unlock();
    return result;
  }

  // job can be run manually as well, if desired -- will not reset timer
  protected abstract async _job(c: CacheT): Promise<void>;
  public async run(): Promise<void> {
    await this._lock.writeLock();
    await this._job(this._cache);
    this._lock.unlock();
  }
}
