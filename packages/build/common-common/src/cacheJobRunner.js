"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_rwlock_1 = __importDefault(require("async-rwlock"));
// Maintains a cache with periodic, atomic jobs that also permits direct,
// non-atomic, write access to the cache.
class JobRunner {
    _cache;
    _jobTimeS;
    _timeoutHandle;
    // we use a mutex here to avoid updating views while pruning, as it could cause errors
    // due to object deletion.
    // we use an RW lock because multiple async accesses are fine (read behavior) whereas
    // jobs cannot overlap with themselves or reads (write behavior)
    _lock = new async_rwlock_1.default();
    constructor(_cache, _jobTimeS) {
        this._cache = _cache;
        this._jobTimeS = _jobTimeS;
    }
    start(...args) {
        if (this._jobTimeS > 0) {
            this._timeoutHandle = global.setInterval(() => this.run(), this._jobTimeS * 1000);
        }
    }
    close() {
        clearInterval(this._timeoutHandle);
        this._timeoutHandle = undefined;
    }
    // viewFn may manipulate the cache, but it must do so atomically
    async access(viewFn) {
        await this._lock.readLock();
        const result = await viewFn(this._cache);
        this._lock.unlock();
        return result;
    }
    async run() {
        await this._lock.writeLock();
        await this._job(this._cache);
        this._lock.unlock();
    }
}
exports.default = JobRunner;
