import { OffchainThread, AddressInfo, OffchainComment, OffchainReaction } from 'models';
import RecentActivityStore, { IKeyedAddressCountAndInfo, IAddressCountAndInfo } from '../../stores/ActivityStore';
class RecentActivityController {
  private _store = new RecentActivityStore();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public countThreads(comments?: OffchainComment<any>[], reactions?: OffchainReaction<any>[]) {
    const threadScopedComments = {};
    if (comments) {
      comments.forEach((c) => {
        const parentEntity = c.community || c.chain;
        if (threadScopedComments[c.rootProposal]) threadScopedComments[c.rootProposal].push(c.id);
        else threadScopedComments[c.rootProposal] = [c.id];
        this._store.addThreadCount(parentEntity, c.rootProposal);
      });
    }
    if (reactions) {
      reactions.forEach((r) => {
        const parentEntity = r.community || r.chain;
        if (r.commentId) {
          Object.entries(threadScopedComments).forEach(([key, val]) => {
            if ((val as any).includes(r.commentId)) {
              this._store.addThreadCount(parentEntity, key);
            }
          });
        } else if (r.threadId) {
          if (threadScopedComments[r.threadId]) threadScopedComments[r.threadId].push(`reaction_${r.id}`);
          else threadScopedComments[r.threadId] = [${r.id}];
        }
      });
    }

    this._store.addThreadActivity()
  }

  public addThreads(threads: OffchainThread[]) {
    threads.forEach((thread) => this._store.addThread(thread));
  }

  public addAddresses(addresses: AddressInfo[], parentEntity: string) {
    addresses.forEach((addr) => this._store.addAddress(addr, parentEntity));
  }

  public addAddressesFromActivity(activity: any[]) {
    console.log(activity);
    activity
      .sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at))
      .forEach((item) => {
        if (item.Address.address === 'jXC7ghviUzVcVySg3eD8prB7C9m6VzK6cw2MTyMTDTUye5q') {
          console.log(item);
        }
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

  public getMostActiveUsers(community: string, userCount): Array<IAddressCountAndInfo> {
    return this._store.getMostActiveUsers(community, userCount);
  }
}

export default RecentActivityController;
