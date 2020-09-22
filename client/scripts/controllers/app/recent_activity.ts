import { OffchainThread, AddressInfo, OffchainComment, OffchainReaction } from 'models';
import {
  ActiveAddressesStore,
  ActiveThreadsStore,
  IIdScopedAddressCountAndInfo,
  IAddressCountAndInfo
} from '../../stores/ActivityStore';
class RecentActivityController {
  private _threadsStore = new ActiveThreadsStore();
  private _addressStore = new ActiveAddressesStore();

  public get threadsStore() { return this._threadsStore; }
  public get addressStore() { return this._addressStore; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public addThreads(threads: OffchainThread[]) {
    threads.forEach((thread) => this._threadsStore.addThread(thread));
  }

  public addAddresses(addresses: AddressInfo[], community: string) {
    addresses.forEach((addr) => this._addressStore.addAddress(addr, community));
  }

  public addAddressesFromActivity(activity: any[]) {
    activity.forEach((item) => {
      const parentEntity = item.community || item.chain;
      this._addressStore.addAddress(item.Address, parentEntity);
    });
  }

  public removeAddressActivity(activity: any[]) {
    activity.forEach((item) => {
      const parentEntity = item.community || item.chain;
      const addressId = item.Address?.id || item.address_id || item.author;
      this._addressStore.removeAddressActivity(addressId, parentEntity);
    });
  }

  public getThreadsByCommunity(community: string): Array<OffchainThread> {
    return this._threadsStore.getThreadsByCommunity(community);
  }

  public getAddressesByCommunity(community: string): Array<AddressInfo> {
    return this._addressStore.getAddressesByCommunity(community);
  }

  public getAddressActivityByCommunity(community:string): IIdScopedAddressCountAndInfo {
    return this._addressStore.getAddressActivityByCommunity(community);
  }

  public getMostActiveUsers(community: string, count: number = 5): Array<IAddressCountAndInfo> {
    return this._addressStore.getMostActiveUsers(community, count);
  }

  public removeThread(id: number, community: string) {
    return this._threadsStore.removeThread(id, community);
  }
}

export default RecentActivityController;
