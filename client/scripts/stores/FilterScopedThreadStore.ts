import IdStore from './IdStore';
import { OffchainThread } from '../models';
import { ALL_PROPOSALS_KEY } from '../views/pages/discussions';

class FilterScopedThreadStore extends IdStore<OffchainThread> {
  private _threadsByCommunity: {
    [community: string]: { [filter: string]: Array<OffchainThread> };
  } = {};

  public add(
    thread: OffchainThread,
    options?: { allProposals: boolean; exclusive: boolean }
  ) {
    const parentEntity = thread.community ? thread.community : thread.chain;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = {};
    }
    const communityStore = this._threadsByCommunity[parentEntity];

    const addThread = (subpage) => {
      super.add(thread);
      if (!communityStore[subpage]) {
        communityStore[subpage] = [];
      }
      const topicStore = communityStore[subpage];
      const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
      if (matchingThread) {
        const proposalIndex = topicStore.indexOf(matchingThread);
        topicStore.splice(proposalIndex, 1);
      }
      communityStore[subpage].push(thread);
    };

    if (options) {
      if (options.allProposals) {
        addThread(ALL_PROPOSALS_KEY);
        if (options.exclusive) {
          return this;
        }
      }
    }

    if (thread.topic && thread.stage)
      addThread(`${thread.topic?.name}#${thread.stage}`);
    if (thread.topic) addThread(`${thread.topic?.name}#`);
    if (thread.stage) addThread(`#${thread.stage}`);
    return this;
  }

  public update(thread: OffchainThread) {
    // This function is a "true" update function: if the thread is not already in a
    // store, it will not add the thread
    const parentEntity = thread.community ? thread.community : thread.chain;
    if (!this._threadsByCommunity[parentEntity]) return;
    const communityStore = this._threadsByCommunity[parentEntity];

    const updateThread = (subpage) => {
      if (!communityStore[subpage]) return;
      const topicStore = communityStore[subpage];
      const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
      if (!matchingThread) return;
      super.remove(matchingThread);
      const proposalIndex = topicStore.indexOf(matchingThread);
      topicStore.splice(proposalIndex, 1);
      super.add(thread);
      communityStore[subpage].push(thread);
    };

    if (thread.topic && thread.stage)
      updateThread(`${thread.topic?.name}#${thread.stage}`);
    if (thread.topic) updateThread(`${thread.topic?.name}#`);
    if (thread.stage) updateThread(`#${thread.stage}`);
    updateThread(ALL_PROPOSALS_KEY);

    return this;
  }

  public remove(thread: OffchainThread) {
    const parentEntity = thread.community ? thread.community : thread.chain;
    const communityStore = this._threadsByCommunity[parentEntity];

    const removeThread = (subpage) => {
      super.remove(thread);
      const topicStore = communityStore[subpage];
      if (!topicStore) return;
      const matchingThread = topicStore.filter((t) => t.id === thread.id)[0];
      const proposalIndex = topicStore.indexOf(matchingThread);
      if (proposalIndex === -1) return;
      topicStore.splice(proposalIndex, 1);
    };

    if (thread.topic && thread.stage)
      removeThread(`${thread.topic?.name}#${thread.stage}`);
    if (thread.topic) removeThread(`${thread.topic?.name}#`);
    if (thread.stage) removeThread(`#${thread.stage}`);
    removeThread(ALL_PROPOSALS_KEY);

    return this;
  }

  public clear() {
    super.clear();
    this._threadsByCommunity = {};
  }

  public getByCommunityTopicAndStage(
    community: string,
    topic: string = '',
    stage: string = ''
  ): Array<OffchainThread> {
    const subpage =
      topic || stage ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;
    return this._threadsByCommunity[community]
      ? this._threadsByCommunity[community][subpage] || []
      : [];
  }

  public removeTopic(community: string, topicName: string) {
    const communityStore = this._threadsByCommunity[community];
    if (communityStore) {
      delete this._threadsByCommunity[community][`${topicName || ''}#`];
      // TODO: also delete topic#stage for all stages
      if (communityStore[ALL_PROPOSALS_KEY]) {
        communityStore[ALL_PROPOSALS_KEY].forEach((thread) => {
          if (thread.topic?.name === topicName) {
            thread.topic = null;
            this.update(thread);
          }
        });
      }
    }
  }
}

export default FilterScopedThreadStore;
