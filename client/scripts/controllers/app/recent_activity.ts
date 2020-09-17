import { OffchainThread, AddressInfo } from 'models';
import RecentActivityStore, { IAddressCountAndInfo } from '../../stores/ActivityStore';
class RecentActivityController {
  private _store = new RecentActivityStore();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public addThreads(threads: OffchainThread[]) {
    threads.forEach((thread) => this._store.addThread(thread));
  }

  public addAddresses(addresses: AddressInfo[], parentEntity: string) {
    addresses.forEach((addr) => this._store.addAddress(addr, parentEntity));
  }

  public addAddressesFromActivity(activity: any[]) {
    activity
      .sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at))
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

  public getAddressActivityByCommunity(community:string): IAddressCountAndInfo {
    return this._store.getAddressActivityByCommunity(community);
  }
}

export default RecentActivityController;