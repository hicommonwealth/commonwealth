import moment from 'moment';
import { OffchainTopic, AbridgedThread, Profile, OffchainComment, OffchainThread } from 'models';
import app from 'state';
import { modelFromServer as modelThreadFromServer } from 'controllers/server/threads';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

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
  // private _threadsStore = new ActiveThreadsStore();
  // private _addressStore = new ActiveAddressesStore();
  private _communityThreadCount = {};
  private _activeUsers = [];

  // public get threadsStore() { return this._threadsStore; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

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
      const { chain, address, name, headline, bio, avatarUrl } = user.info;
      const info = new Profile(chain, address);
      info.initialize(name, headline, bio, avatarUrl, null);
      return ({ info, count });
    });
  }

  public getMostActiveUsers() {
    return this._activeUsers;
  }

  public async getRecentCommunityActivity(options: {
    chainId: string;
    communityId: string;
    cutoffDate?: moment.Moment;
  }): Promise<Array<OffchainThread[] | OffchainComment<any>[]>> {
    const { chainId, communityId } = options;
    const cutoffDate =
      options.cutoffDate || moment(Date.now() - 30 * 24 * 3600 * 1000);

    const params = {
      chain: chainId,
      community: communityId,
      cutoff_date: cutoffDate.toISOString(),
      include_threads: 't',
    };
    const response = await $.get(`${app.serverUrl()}/bulkComments`, params);
    if (response.status !== 'Success') {
      throw new Error(`Unsuccessful: ${response.status}`);
    }
    const { threads, comments } = response.result;

    for (const comment of comments) {
      const modeledComment = modelCommentFromServer(comment);
      const existing = app.comments.store.getById(comment.id);
      if (existing) {
        app.comments.store.remove(existing);
      }
      try {
        app.comments.store.add(modeledComment);
      } catch (e) {
        console.error(e.message);
      }
    }

    return threads.map((thread) => {
      const modeledThread = modelThreadFromServer(thread);
      if (!thread.Address) {
        console.error('OffchainThread missing address');
      }
      try {
        app.threads.store.add(modeledThread);
      } catch (e) {
        console.error(e.message);
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
  //     const parentEntity = item.community || item.chain;
  //     this._addressStore.addAddress(item.Address, parentEntity);
  //   });
  // }

  // public removeAddressActivity(activity: any[]) {
  //   activity.forEach((item) => {
  //     const parentEntity = item.community || item.chain;
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
