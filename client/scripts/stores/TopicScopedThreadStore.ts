import IdStore from './IdStore';
import { OffchainThread } from '../models';
import { ALL_PROPOSALS_KEY } from '../views/pages/discussions';

class TopicScopedThreadStore extends IdStore<OffchainThread> {
  private _threadsByCommunity: { [community: string]: { [topic: string] : Array<OffchainThread> } } = {};

  public add(thread: OffchainThread, options?: { allProposals: boolean, exclusive: boolean }) {
    super.add(thread);
    const parentEntity = thread.community ? thread.community : thread.chain;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = {};
    }
    const communityStore = this._threadsByCommunity[parentEntity];

    const addThread = (topic) => {
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
    };

    if (options) {
      if (options.allProposals) {
        addThread(ALL_PROPOSALS_KEY);
        if (options.exclusive) {
          return this;
        }
      }
    }

    addThread(thread.topic?.name);
    return this;
  }

  public update(thread: OffchainThread) {
    // This function is a "true" update function: if the thread is not already in a
    // store, it will not add the thread
    super.update(thread, (t) => t.id === thread.id);
    const parentEntity = thread.community ? thread.community : thread.chain;
    if (!this._threadsByCommunity[parentEntity]) return;
    const communityStore = this._threadsByCommunity[parentEntity];

    const updateThread = (topic) => {
      if (!communityStore[topic]) return;
      const topicStore = communityStore[topic];
      const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
      if (!matchingThread) return;
      const proposalIndex = topicStore.indexOf(matchingThread);
      topicStore.splice(proposalIndex, 1);
      communityStore[topic].push(thread);
    };

    updateThread(thread.topic?.name);
    updateThread(ALL_PROPOSALS_KEY);

    return this;
  }

  public remove(thread: OffchainThread) {
    super.remove(thread);
    const parentEntity = thread.community ? thread.community : thread.chain;
    const communityStore = this._threadsByCommunity[parentEntity];

    const removeThread = (topic) => {
      const topicStore = communityStore[topic];
      if (!topicStore) return;
      const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
      const proposalIndex = topicStore.indexOf(matchingThread);
      if (proposalIndex === -1) return;
      topicStore.splice(proposalIndex, 1);
    };

    removeThread(thread.topic?.name);
    removeThread(ALL_PROPOSALS_KEY);

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
