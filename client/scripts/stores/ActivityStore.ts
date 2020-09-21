import { modelFromServer } from '../controllers/server/threads';
import { AddressInfo, OffchainThread } from '../models';
import { byAscendingCreationDate } from '../helpers';

export interface IAddressCountAndInfo {
  postCount: number;
  addressInfo: AddressInfo;
}

export interface IKeyedAddressCountAndInfo {
  [addressId: string]: IAddressCountAndInfo;
}

interface ICommunityAddresses {
  [parentEntity: string]: IKeyedAddressCountAndInfo;
}

interface ICommunityThreads {
  [parentEntity: string]: Array<OffchainThread>;
}

interface ICountedThreads {
  [parentEntity: string]: {
    [threadId: string]: number;
  }
}

class RecentActivityStore {
  private _threadsByCommunity: ICommunityThreads = {};
  private _addressesByCommunity: ICommunityAddresses = {};
  private _activityScopedThreads: ICountedThreads = {};

  public addThread(thread: OffchainThread) {
    thread = modelFromServer(thread);
    const parentEntity = thread.community || thread.chain;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = [];
    }
    this._threadsByCommunity[parentEntity].push(thread);
    this._threadsByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public removeThread(thread: OffchainThread) {
    const parentEntity = thread.community || thread.chain;
    const communityStore = this._threadsByCommunity[parentEntity];
    const matchingthread = communityStore.filter((t) => t.id === thread.id)[0];
    const proposalIndex = communityStore.indexOf(matchingthread);
    if (proposalIndex === -1) {
      throw new Error('thread not in store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public addThreadCount(parentEntity: string, threadId: number | string) {
    console.log({ parentEntity, threadId });
    if (!this._activityScopedThreads[parentEntity]) {
      this._activityScopedThreads[parentEntity] = {};
    }
    const communityStore = this._activityScopedThreads[parentEntity];
    if (!communityStore[threadId]) {
      communityStore[threadId] = 1;
    } else {
      communityStore[threadId] += 1;
    }
    return this;
  }

  public addAddress(address: any, parentEntity: string) {
    const { id, chain } = address;
    if (!this._addressesByCommunity[parentEntity]) {
      this._addressesByCommunity[parentEntity] = {};
    }
    const communityStore = this._addressesByCommunity[parentEntity];
    if (!communityStore[id]) {
      const addressInfo = new AddressInfo(id, address.address, chain, null);
      const postCount = 1;
      communityStore[id] = { addressInfo, postCount };
    } else {
      communityStore[id]['postCount'] += 1;
    }
    return this;
  }

  public removeAddress(address: AddressInfo, parentEntity: string) {
    const communityStore = this._addressesByCommunity[parentEntity];
    delete communityStore[address.id];
    return this;
  }

  public clearThreads() {
    this._threadsByCommunity = {};
  }

  public clearAddresses() {
    this._addressesByCommunity = {};
  }

  public getThreadsByCommunity(communityId: string): Array<OffchainThread> {
    return this._threadsByCommunity[communityId] || [];
  }

  public getAddressesByCommunity(communityId: string): Array<AddressInfo> {
    const communityStore = this._addressesByCommunity[communityId];
    return communityStore
      ? Object.values(communityStore).map((a) => a.addressInfo)
      : [];
  }

  public getAddressActivityByCommunity(communityId: string): IKeyedAddressCountAndInfo {
    return this._addressesByCommunity[communityId] || {};
  }

  public getMostActiveUsers(communityId: string, count: number = 5): Array<IAddressCountAndInfo> {
    const communityStore = this._addressesByCommunity[communityId];
    return communityStore
      ? Object.values(communityStore).sort((a, b) => {
        return (b.postCount - a.postCount);
      }).slice(0, count)
      : [];
  }

  public getMostActiveThreadIds(parentEntity: string, count: number = 5) {
    return Object.entries(this._activityScopedThreads[parentEntity]).sort((a: any[], b: any[]) => {
      return b[1] - a[1];
    }).slice(0, count);
  }
}

export default RecentActivityStore;
