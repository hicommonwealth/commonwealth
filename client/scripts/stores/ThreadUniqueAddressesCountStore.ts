import IdStore from 'stores/IdStore';
import ThreadUniqueAddressesCount from 'models/ThreadUniqueAddressesCount';

class ThreadUniqueAddressesCountStore extends IdStore<
  ThreadUniqueAddressesCount<any>
> {
  private _storeThreadUniqueAddressesCount: {
    [identifier: string]: ThreadUniqueAddressesCount<any>;
  } = {};

  public add(threadUniqueAddressesCount: ThreadUniqueAddressesCount<any>) {
    const { id } = threadUniqueAddressesCount;
    const alreadyInStore = this._storeThreadUniqueAddressesCount[id] || null;
    if (!alreadyInStore) {
      super.add(threadUniqueAddressesCount);
      if (!this._storeThreadUniqueAddressesCount[id]) {
        this._storeThreadUniqueAddressesCount[id] = null;
      }
      this._storeThreadUniqueAddressesCount[id] = threadUniqueAddressesCount;
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeThreadUniqueAddressesCount = {};
  }
}

export default ThreadUniqueAddressesCountStore;
