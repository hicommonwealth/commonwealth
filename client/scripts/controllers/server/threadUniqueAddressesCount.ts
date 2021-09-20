import app from 'state';

import { ThreadUniqueAddressesCountStore } from 'stores';
import ThreadUniqueAddressesCount from 'models/ThreadUniqueAddressesCount';
import { AddressInfo, OffchainThread} from 'models';

export const modelFromServer = (threadUniqueAddressesCount) => {
  const { id, addresses, count } = threadUniqueAddressesCount;
  return new ThreadUniqueAddressesCount(id, addresses, count);
};

class ThreadUniqueAddressesCountController {
  private _store: ThreadUniqueAddressesCountStore =
    new ThreadUniqueAddressesCountStore();
  public get store() {
    return this._store;
  }

  public getAddressesCountRootId(rootId: string) {
    const { count } = this._store.getById(rootId) || {};
    return count;
  }

  public getUniqueAddressesByRootId(proposal: OffchainThread) {
    const { id, slug, author, authorChain } = proposal;
    const rootId = `${slug}_${id}`;
    const { addresses = [] } = this._store.getById(rootId) || {};
    return addresses.map(
      ({ address, chain }) =>
        new AddressInfo(null, address, chain, null)
    );
  }

  public deinit() {
    this._store.clear();
  }
}

export default ThreadUniqueAddressesCountController;
