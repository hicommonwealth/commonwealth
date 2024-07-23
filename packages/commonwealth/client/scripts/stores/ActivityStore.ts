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
