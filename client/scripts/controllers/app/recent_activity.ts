import { OffchainThread, AddressInfo, OffchainComment, OffchainReaction } from 'models';
import RecentActivityStore, { IKeyedAddressCountAndInfo, IAddressCountAndInfo } from '../../stores/ActivityStore';
class RecentActivityController {
  private _store = new RecentActivityStore();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public countThreads(comments, reactions) {
    const threadScopedComments = {};
    if (comments) {
      comments.forEach((c) => {
        const parentEntity = c.community || c.chain;
        if (threadScopedComments[c.root_id]) threadScopedComments[c.root_id].push(c.id);
        else threadScopedComments[c.root_id] = [c.id];
        this._store.addThreadCount(parentEntity, c.root_id);
      });
    }
    if (reactions) {
      reactions.forEach((r) => {
        const parentEntity = r.community || r.chain;
        if (r.comment_id) {
          Object.entries(threadScopedComments).forEach((arr) => {
            const threadId = arr[0];
            const commentArr = arr[1];
            if ((commentArr as any).includes(r.comment_id)) {
              this._store.addThreadCount(parentEntity, threadId);
            }
          });
        } else if (r.threadId) {
          this._store.addThreadCount(parentEntity, r.threadId);
        }
      });
    }
  }

  public addThreads(threads: OffchainThread[]) {
    threads.forEach((thread) => this._store.addThread(thread));
  }

  public addAddresses(addresses: AddressInfo[], parentEntity: string) {
    addresses.forEach((addr) => this._store.addAddress(addr, parentEntity));
  }

  public addAddressesFromActivity(activity: any[]) {
    activity.sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at))
      .forEach((item) => {
        this._store.addAddress(item.Address, item.community || item.chain);
      });
  }

  public getThreadsByCommunity(community: string): Array<OffchainThread> {
    return this._store.getThreadsByCommunity(community);
  }

  public getAddressesByCommunity(community: string): Array<AddressInfo> {
    return this._store.getAddressesByCommunity(community);
  }

  public getAddressActivityByCommunity(community:string): IKeyedAddressCountAndInfo {
    return this._store.getAddressActivityByCommunity(community);
  }

  public getMostActiveUsers(community: string, count: number = 5): Array<IAddressCountAndInfo> {
    return this._store.getMostActiveUsers(community, count);
  }

  public getMostActiveThreadIds(community: string, count: number = 5) {
    return this._store.getMostActiveThreadIds(community, count);
  }
}

export default RecentActivityController;
