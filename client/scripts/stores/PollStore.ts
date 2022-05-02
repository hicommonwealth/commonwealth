import { IIdentifiable } from 'adapters/shared';
import Store from './Store';

class PollStore<PollT extends IIdentifiable> extends Store<PollT> {
  private _storeId: { [hash: string]: PollT } = {};

  public add(Poll: PollT) {
    super.add(Poll);
    this._storeId[Poll.identifier] = Poll;
    return this;
  }

  public update(newPoll: PollT) {
    const oldPoll = this.getByIdentifier(newPoll.identifier);
    if (oldPoll) {
      this.remove(oldPoll);
    }
    this.add(newPoll);
    return this;
  }

  public remove(Poll: PollT) {
    super.remove(Poll);
    delete this._storeId[Poll.identifier];
    return this;
  }

  public clear() {
    super.clear();
    this._storeId = {};
  }

  public getByIdentifier(identifier: string | number): PollT {
    return this._storeId[identifier];
  }
}

export default PollStore;
