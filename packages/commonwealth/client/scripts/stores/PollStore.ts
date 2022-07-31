import Poll from '../models/Poll';
import IdStore from './IdStore';

class PollStore extends IdStore<Poll> {
  private _storeThreadId: { [id: number]: Poll[] } = {};

  public add(poll: Poll) {
    super.add(poll);
    if (Array.isArray(this._storeThreadId[poll.threadId])) {
      this._storeThreadId[poll.threadId].push(poll);
    } else {
      this._storeThreadId[poll.threadId] = [poll];
    }
    return this;
  }

  public remove(poll: Poll) {
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

  public getByThreadId(threadId: number): Poll[] {
    return this._storeThreadId[threadId] || [];
  }
}

export default PollStore;
