import IdStore from './IdStore';
import { OffchainThread } from '../models';
import { byAscendingCreationDate } from '../helpers';

class TopicScopedThreadStore extends IdStore<OffchainThread> {
  private _threadsByCommunity: { [community: string]: Array<OffchainThread> }

  public add(thread: OffchainThread) {
    super.add(thread);
    this.getAll().sort(byAscendingCreationDate);
    const parentEntity = thread.community ? thread.community : thread.chain;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = [];
    }
    this._threadsByCommunity[parentEntity].push(thread);
    this._threadsByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public remove(thread: OffchainThread) {
    super.remove(thread);
    const parentEntity = thread.community ? thread.community : thread.chain;
    const communityStore = this._threadsByCommunity[parentEntity];
    const matchingThread = communityStore.filter((t) => t.id === thread.id)[0];
    const proposalIndex = communityStore.indexOf(matchingThread);
    if (proposalIndex === -1) {
      throw new Error('Topic not in proposals store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._threadsByCommunity = {};
  }

  public getByCommunity(community: string): Array<OffchainThread> {
    return this._threadsByCommunity[community] || [];
  }
}

export default TopicScopedThreadStore;
