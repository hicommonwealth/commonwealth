import { OffchainThread, AddressInfo, OffchainComment, OffchainReaction } from 'models';
import RecentActivityStore, { IKeyedAddressCountAndInfo, IAddressCountAndInfo } from '../../stores/ActivityStore';
class RecentActivityController {
  private _store = new RecentActivityStore();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public addThreads(threads: OffchainThread[], comments?: OffchainComment<any>[], reactions?: OffchainReaction<any>[]) {
    const root_ids = {};
    if (comments) {
      comments.forEach((c) => {
        if (root_ids[c.rootProposal]) root_ids[c.rootProposal].push(c.id);
        else root_ids[c.rootProposal] = [c.id];
      });
    }
    if (reactions) {
      reactions.forEach((r) => {
        if (r.commentId) {
          if (!!Object.values(root_ids).filter((arr: any[]) => arr.includes(r.commentId)).length) {
            
          }
        } else if (root_ids[r.threadId || r.proposalId]) {
          root_ids[r.threadId || r.proposalId].push(r.id);
       
        } else {
          root_ids[r.threadId || r.proposalId] = 1;
        }
      });
    }
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
