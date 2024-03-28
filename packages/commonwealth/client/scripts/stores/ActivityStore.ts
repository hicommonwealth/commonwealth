import { byAscendingCreationDate } from '../helpers';
import type AbridgedThread from '../models/AbridgedThread';
import AddressInfo from '../models/AddressInfo';

export interface IAddressCountAndInfo {
  postCount: number;
  addressInfo: AddressInfo;
}

export interface IIdScopedAddressCountAndInfo {
  [addressId: string]: IAddressCountAndInfo;
}

interface ICommunityAddresses {
  [parentEntity: string]: IIdScopedAddressCountAndInfo;
}

interface ICommunityThreads {
  [parentEntity: string]: Array<AbridgedThread>;
}

export class ActiveThreadsStore {
  private _threadsByCommunity: ICommunityThreads = {};

  public getThreadsByCommunity(communityId: string): Array<AbridgedThread> {
    return this._threadsByCommunity[communityId] || [];
  }

  public getMostActiveThreads(parentEntity: string, count: number) {
    const comments = {};
    const reactions = {};
    const allThreads = this.getThreadsByCommunity(parentEntity);
    allThreads.sort((threadA, threadB) => {
      const totalActivityA =
        comments[threadA.id]?.length + reactions[threadA.id]?.length;
      const totalActivityB =
        comments[threadB.id]?.length + reactions[threadB.id]?.length;
      return totalActivityB - totalActivityA;
    });
    return allThreads.slice(0, count);
  }

  public addThread(thread: AbridgedThread) {
    const parentEntity = thread.community;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = [];
    }
    this._threadsByCommunity[parentEntity].push(thread);
    this._threadsByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public removeThread(threadId: number, parentEntity: string) {
    const communityStore = this._threadsByCommunity[parentEntity];
    const matchingthread = communityStore.filter((t) => t.id === threadId)[0];
    const proposalIndex = communityStore.indexOf(matchingthread);
    if (proposalIndex === -1) {
      throw new Error('thread not in store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clearThreads() {
    this._threadsByCommunity = {};
  }
}

export class ActiveAddressesStore {
  private _addressesByCommunity: ICommunityAddresses = {};

  public getAddressesByCommunity(communityId: string): Array<AddressInfo> {
    const communityStore = this._addressesByCommunity[communityId];
    return communityStore
      ? Object.values(communityStore).map((a) => a.addressInfo)
      : [];
  }

  public getAddressActivityByCommunity(
    communityId: string,
  ): IIdScopedAddressCountAndInfo {
    return this._addressesByCommunity[communityId] || {};
  }

  public getMostActiveUsers(
    communityId: string,
    count: number,
  ): Array<IAddressCountAndInfo> {
    const communityStore = this._addressesByCommunity[communityId];
    return communityStore
      ? Object.values(communityStore)
          .sort((a, b) => {
            return b['postCount'] - a['postCount'];
          })
          .slice(0, count)
      : [];
  }

  public addAddress(address: any, parentEntity: string) {
    const { id, chain } = address;
    if (!this._addressesByCommunity[parentEntity]) {
      this._addressesByCommunity[parentEntity] = {};
    }
    const communityStore = this._addressesByCommunity[parentEntity];
    if (!communityStore[id]) {
      const addressInfo = new AddressInfo({
        id: null,
        address: address.address,
        communityId: chain,
      });
      const postCount = 1;
      communityStore[id] = { addressInfo, postCount };
    } else {
      communityStore[id]['postCount'] += 1;
    }
    return this;
  }

  public removeAddressActivity(
    addressId: number | string,
    parentEntity: string,
  ) {
    const communityStore = this._addressesByCommunity[parentEntity];
    if (communityStore[addressId]) {
      communityStore[addressId]['postCount'] -= 1;
      if (communityStore[addressId]['postCount'] < 1) {
        delete communityStore[addressId];
      }
    }
    return this;
  }

  public clearAddresses() {
    this._addressesByCommunity = {};
  }
}
