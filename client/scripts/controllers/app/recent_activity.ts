import { OffchainThread, AddressInfo, OffchainComment, OffchainReaction } from 'models';
import RecentActivityStore, { IIdScopedAddressCountAndInfo, IAddressCountAndInfo } from '../../stores/ActivityStore';
class RecentActivityController {
  private _store = new RecentActivityStore();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public addThreads(threads: OffchainThread[]) {
    threads.forEach((thread) => this._store.addThread(thread));
  }

  public addAddresses(addresses: AddressInfo[], community: string) {
    addresses.forEach((addr) => this._store.addAddress(addr, community));
  }

  public addAddressesFromActivity(activity: any[]) {
    activity.forEach((item) => {
      const parentEntity = item.community || item.chain;
      this._store.addAddress(item.Address, parentEntity);
    });
  }

  public removeAddressActivity(activity: any[]) {
    activity.forEach((item) => {
      const parentEntity = item.community || item.chain;
      const addressId = item.Address?.id || item.address_id || item.author;
      this._store.removeAddressActivity(addressId, parentEntity);
    });
  }

  public getThreadsByCommunity(community: string): Array<OffchainThread> {
    return this._store.getThreadsByCommunity(community);
  }

  public getAddressesByCommunity(community: string): Array<AddressInfo> {
    return this._store.getAddressesByCommunity(community);
  }

  public getAddressActivityByCommunity(community:string): IIdScopedAddressCountAndInfo {
    return this._store.getAddressActivityByCommunity(community);
  }

  public getMostActiveUsers(community: string, count: number = 5): Array<IAddressCountAndInfo> {
    return this._store.getMostActiveUsers(community, count);
  }

  public removeThread(id: number, community: string) {
    return this._store.removeThread(id, community);
  }
}

export default RecentActivityController;
