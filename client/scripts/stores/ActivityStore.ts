import { modelFromServer } from '../controllers/server/threads';
import { AddressInfo, OffchainThread } from '../models';
import { byAscendingCreationDate } from '../helpers';

export interface IAddressCountAndInfo {
  [addressId: string]: {
    postCount: number;
    addressInfo: AddressInfo;
  }
}

interface ICommunityAddresses {
  [parentEntity: string]: IAddressCountAndInfo;
}

interface ICommunityThreads {
  [parentEntity: string]: Array<OffchainThread>;
}

class RecentActivityStore {
  private _threadsByCommunity: ICommunityThreads = {};
  private _addressesByCommunity: ICommunityAddresses = {};

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

  public getAddressActivityByCommunity(communityId: string): IAddressCountAndInfo {
    return this._addressesByCommunity[communityId] || {};
  }
}

export default RecentActivityStore;
