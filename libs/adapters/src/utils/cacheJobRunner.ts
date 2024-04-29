import { RWLock } from 'async-rwlock';

// Maintains a cache with periodic, atomic jobs that also permits direct,
// non-atomic, write access to the cache.
export abstract class JobRunner<CacheT> {
  private _timeoutHandle: NodeJS.Timeout | undefined;

  // we use a mutex here to avoid updating views while pruning, as it could cause errors
  // due to object deletion.
  // we use an RW lock because multiple async accesses are fine (read behavior) whereas
  // jobs cannot overlap with themselves or reads (write behavior)
  private _lock = new RWLock();

  constructor(
    private _cache: CacheT,
    private _jobTimeS: number,
    private _writelockOnRun = false,
  ) {}

  public start() {
    if (this._jobTimeS > 0) {
      this._timeoutHandle = global.setInterval(
        () => this.run(),
        this._jobTimeS * 1000,
      );
    }
  }

  public close() {
    clearInterval(this._timeoutHandle as number | undefined);
    this._timeoutHandle = undefined;
  }

  // viewFn may manipulate the cache, but it must do so atomically
  protected async access<ReturnT>(
    viewFn: (c: CacheT) => Promise<ReturnT>,
  ): Promise<ReturnT> {
    await this._lock.readLock();
    const result = await viewFn(this._cache);
    this._lock.unlock();
    return result;
  }

  protected async write<ReturnT>(
    writeFn: (c: CacheT) => Promise<ReturnT>,
  ): Promise<ReturnT> {
    await this._lock.writeLock();
    const result = await writeFn(this._cache);
    this._lock.unlock();
    return result;
  }

  // job can be run manually as well, if desired -- will not reset timer
  protected abstract _job(c: CacheT): Promise<void>;
  protected async run(): Promise<void> {
    if (this._writelockOnRun) {
      await this._lock.writeLock();
      await this._job(this._cache);
      this._lock.unlock();
    } else {
      await this._job(this._cache);
    }
  }
}
