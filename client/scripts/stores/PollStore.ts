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

  // TODO
  // public remove(Poll: OffchainPoll) {
  //   super.remove(Poll);
  //   return this;
  // }

  public clear() {
    super.clear();
    this._storeThreadId = {};
  }

  public getByThreadId(threadId: number): OffchainPoll[] {
    return this._storeThreadId[threadId];
  }
}

export default PollStore;
