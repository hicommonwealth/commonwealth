import $ from 'jquery';
import ThreadUniqueAddressesCount from 'models/ThreadUniqueAddressesCount';
import app from 'state';

import { ThreadUniqueAddressesCountStore } from 'stores';

export const modelFromServer = (threadUniqueAddressesCount) => {
  const { id, addresses, count } = threadUniqueAddressesCount;
  return new ThreadUniqueAddressesCount(id, addresses, count);
};

class ThreadUniqueAddressesCountController {
  private _store: ThreadUniqueAddressesCountStore =
    new ThreadUniqueAddressesCountStore();
  private _initializedPinned = false;

  public get store() {
    return this._store;
  }

  public getInitializedPinned() {
    return this._initializedPinned;
  }

  public getAddressesCountRootId(rootId: string) {
    const { count } = this._store.getById(rootId) || {};
    return count;
  }

  public fetchThreadsUniqueAddresses = async ({
    threads,
    chain,
    pinned = false,
  }) => {
    const threadsUniqueAddressesCount = await $.ajax({
      type: 'POST',
      url: `${app.serverUrl()}/threadsUsersCountAndAvatars`,
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        threads: threads.map(
          ({ id, Address: { address = null } = {}, author }) => ({
            thread_id: id,
            author: address || author,
          })
        ),
        chain,
      }),
    });
    for (const threadUniqueAddressesCnt of threadsUniqueAddressesCount) {
      app.threadUniqueAddressesCount.store.add(
        modelFromServer(threadUniqueAddressesCnt)
      );
    }
    if (pinned) {
      this._initializedPinned = true;
    }
  };

  public deinit() {
    this._initializedPinned = false;
    this._store.clear();
  }
}

export default ThreadUniqueAddressesCountController;
