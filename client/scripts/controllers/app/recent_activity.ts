import moment from 'moment-twitter';
import { AddressInfo, OffchainTopic, AbridgedThread } from 'models';
import {
  ActiveAddressesStore,
  ActiveThreadsStore,
  IIdScopedAddressCountAndInfo,
  IAddressCountAndInfo
} from '../../stores/ActivityStore';

export interface IAbridgedThreadFromServer {
  id: number;
  Address: any;
  title: string;
  created_at: any;
  community: string;
  chain: string;
  topic?: OffchainTopic;
  pinned?: boolean;
  url?: string;
}

export const modelAbridgedThreadFromServer = (thread: IAbridgedThreadFromServer): AbridgedThread => {
  return new AbridgedThread(
    thread.id,
    thread.Address.id,
    thread.Address.address,
    thread.Address.chain,
    decodeURIComponent(thread.title),
    moment(thread.created_at),
    thread.community,
    thread.chain,
    thread.topic,
    thread.pinned,
    thread.url
  );
};

class RecentActivityController {
  private _threadsStore = new ActiveThreadsStore();
  private _addressStore = new ActiveAddressesStore();

  public get threadsStore() { return this._threadsStore; }
  public get addressStore() { return this._addressStore; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public addThreads(threads: IAbridgedThreadFromServer[], clear?: boolean) {
    if (clear) this._threadsStore.clearThreads();
    threads.forEach((thread) => {
      const modeledThread = modelAbridgedThreadFromServer(thread);
      this._threadsStore.addThread(modeledThread);
    });
  }

  public addAddresses(addresses: AddressInfo[], community: string, clear?: boolean) {
    if (clear) this._addressStore.clearAddresses();
    addresses.forEach((addr) => this._addressStore.addAddress(addr, community));
  }

  public addAddressesFromActivity(activity: any[], clear?: boolean) {
    if (clear) this._addressStore.clearAddresses();
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

  public getThreadsByCommunity(community: string): Array<AbridgedThread> {
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

  public getMostActiveThreads(community: string, count: number = 3) {
    return this._threadsStore.getMostActiveThreads(community, count);
  }

  public removeThread(id: number, community: string) {
    return this._threadsStore.removeThread(id, community);
  }
}

export default RecentActivityController;
