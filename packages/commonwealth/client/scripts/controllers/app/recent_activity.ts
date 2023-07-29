import moment from 'moment';
import AbridgedThread from '../../models/AbridgedThread';
import MinimumProfile from '../../models/MinimumProfile';
import type Topic from '../../models/Topic';

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
}

export default RecentActivityController;
