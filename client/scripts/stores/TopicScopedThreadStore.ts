import IdStore from './IdStore';
import { OffchainThread } from '../models';

class TopicScopedThreadStore extends IdStore<OffchainThread> {
  private _threadsByCommunity: { [community: string]: { [topic: string] : Array<OffchainThread> } } = {};

  public add(thread: OffchainThread) {
    super.add(thread);
    const parentEntity = thread.community ? thread.community : thread.chain;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = {};
    }
    const communityStore = this._threadsByCommunity[parentEntity];
    const topic = thread.topic.name;
    if (!communityStore[topic]) {
      communityStore[topic] = [];
    }
    const topicStore = communityStore[topic];
    const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
    if (matchingThread) {
      const proposalIndex = topicStore.indexOf(matchingThread);
      topicStore.splice(proposalIndex, 1);
    }
    communityStore[topic].push(thread);
    return this;
  }

  public remove(thread: OffchainThread) {
    super.remove(thread);
    const parentEntity = thread.community ? thread.community : thread.chain;
    const communityStore = this._threadsByCommunity[parentEntity];
    const topic = thread.topic.name;
    const topicStore = communityStore[topic];
    const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
    const proposalIndex = topicStore.indexOf(matchingThread);
    if (proposalIndex === -1) {
      throw new Error('Topic not in proposals store');
    }
    topicStore.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._threadsByCommunity = {};
  }

  public getByCommunityAndTopic(community: string, topic: string): Array<OffchainThread> {
    return this._threadsByCommunity[community]
      ? this._threadsByCommunity[community][topic] || []
      : [];
  }
}

export default TopicScopedThreadStore;
