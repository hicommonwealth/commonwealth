import OffchainPoll from '../models/OffchainPoll';
import IdStore from './IdStore';

class PollStore extends IdStore<OffchainPoll> {
  private _storeThreadId: { [id: number]: OffchainPoll[] } = {};

  public add(poll: OffchainPoll) {
    super.add(poll);
    if (Array.isArray(this._storeThreadId[poll.threadId])) {
      this._storeThreadId[poll.threadId].push(poll);
    } else {
      this._storeThreadId[poll.threadId] = [poll];
    }
    return this;
  }

  public remove(poll: OffchainPoll) {
    super.remove(poll);
    if (this._storeThreadId[poll.threadId]) {
      const idx = this._storeThreadId[poll.threadId].indexOf(poll);
      this._storeThreadId[poll.threadId].splice(idx, 1);
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeThreadId = {};
  }

  public getByThreadId(threadId: number): OffchainPoll[] {
    return this._storeThreadId[threadId] || [];
  }
}

export default PollStore;
