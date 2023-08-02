import $ from 'jquery';
import MinimumProfile from '../../models/MinimumProfile';
import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';
import moment from 'moment';
import app from 'state';
import AbridgedThread from '../../models/AbridgedThread';
import axios from 'axios';

export interface IAbridgedThreadFromServer {
  id: number;
  Address: any;
  title: string;
  created_at: any;
  community: string;
  chain: string;
  topic?: Topic;
  pinned?: boolean;
  url?: string;
}

export const modelAbridgedThreadFromServer = (
  thread: IAbridgedThreadFromServer
): AbridgedThread => {
  return new AbridgedThread(
    thread.id,
    thread.Address.id,
    thread.Address.address,
    thread.Address.chain,
    decodeURIComponent(thread.title),
    moment(thread.created_at),
    thread.chain,
    thread.topic,
    thread.pinned,
    thread.url
  );
};

class RecentActivityController {
  // private _threadsStore = new ActiveThreadsStore();
  // private _addressStore = new ActiveAddressesStore();
  private _communityThreadCount = {};
  private _activeUsers = [];

  // public get threadsStore() { return this._threadsStore; }

  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  public setCommunityThreadCounts(community: string, count) {
    if (Number.isNaN(+count) || !count) count = 0;
    this._communityThreadCount[community] = +count;
  }

  public getCommunityThreadCount(community: string) {
    return this._communityThreadCount[community] || 0;
  }

  public setMostActiveUsers(users) {
    this._activeUsers = users.map((user) => {
      const { count } = user;
      const { chain, address, name, id, avatarUrl, lastActive } = user.info;
      const info = new MinimumProfile(address, chain);
      info.initialize(name, address, avatarUrl, id, chain, lastActive);
      return { info, count };
    });
  }

  public getMostActiveUsers() {
    return this._activeUsers;
  }

  public async getRecentTopicActivity(id?: string): Promise<Thread[]> {
    const params = {
      active: true,
      chain: id || app.activeChainId(),
      threads_per_topic: 3,
    };

    const [response] = await Promise.all([
      axios.get(`${app.serverUrl()}/threads`, { params }),
      // app.chainEntities.refresh(params.chain),
    ]);
    if (response.data.status !== 'Success') {
      throw new Error(`Unsuccessful: ${response.status}`);
    }

    const threads = response.data.result;
    return threads.map((thread) => {
      const modeledThread = app.threads.modelFromServer(thread);
      if (!thread.Address) {
        console.error('Thread missing address');
      }
      if (!app.threads.overviewStore.getByIdentifier(thread.id)) {
        try {
          app.threads.overviewStore.add(modeledThread);
        } catch (e) {
          console.error(e.message);
        }
      }
      return modeledThread;
    });
  }

  // public addThreads(threads: IAbridgedThreadFromServer[], clear?: boolean) {
  //   if (clear) this._threadsStore.clearThreads();
  //   threads.forEach((thread) => {
  //     const modeledThread = modelAbridgedThreadFromServer(thread);
  //     this._threadsStore.addThread(modeledThread);
  //   });
  // }

  // public addAddresses(addresses: AddressInfo[], community: string, clear?: boolean) {
  //   if (clear) this._addressStore.clearAddresses();
  //   addresses.forEach((addr) => this._addressStore.addAddress(addr, community));
  // }

  // public addAddressesFromActivity(activity: any[], clear?: boolean) {
  //   if (clear) this._addressStore.clearAddresses();
  //   activity.forEach((item) => {
  //     const parentEntity = item.chain;
  //     this._addressStore.addAddress(item.Address, parentEntity);
  //   });
  // }

  // public removeAddressActivity(activity: any[]) {
  //   activity.forEach((item) => {
  //     const parentEntity = item.chain;
  //     const addressId = item.Address?.id || item.address_id || item.author;
  //     this._addressStore.removeAddressActivity(addressId, parentEntity);
  //   });
  // }

  // public getThreadsByCommunity(community: string): Array<AbridgedThread> {
  //   return this._threadsStore.getThreadsByCommunity(community);
  // }

  // public getAddressesByCommunity(community: string): Array<AddressInfo> {
  //   return this._addressStore.getAddressesByCommunity(community);
  // }

  // public getAddressActivityByCommunity(community:string): IIdScopedAddressCountAndInfo {
  //   return this._addressStore.getAddressActivityByCommunity(community);
  // }

  // public getMostActiveUsers(community: string, count: number = 5): Array<IAddressCountAndInfo> {
  //   return this._addressStore.getMostActiveUsers(community, count);
  // }

  // public getMostActiveThreads(community: string, count: number = 3) {
  //   return this._threadsStore.getMostActiveThreads(community, count);
  // }

  // public removeThread(id: number, community: string) {
  //   return this._threadsStore.removeThread(id, community);
  // }
}

export default RecentActivityController;
