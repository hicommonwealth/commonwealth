import IdStore from './IdStore';
import { OffchainTopic } from '../models';
import { byAscendingCreationDate } from '../helpers';

// TODO: Differentiate between topics associated with a chain, and topics associated with a community
class TopicStore extends IdStore<OffchainTopic> {
  private _topicsByCommunity: { [identifier: string]: Array<OffchainTopic> } = {};

  public add(topic: OffchainTopic) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(topic);
    this.getAll().sort(byAscendingCreationDate);
    const parentEntity = topic.communityId ? topic.communityId : topic.chainId;
    if (!this._topicsByCommunity[parentEntity]) {
      this._topicsByCommunity[parentEntity] = [];
    }
    this._topicsByCommunity[parentEntity].push(topic);
    this._topicsByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public remove(topic: OffchainTopic) {
    super.remove(topic);
    const parentEntity = topic.communityId ? topic.communityId : topic.chainId;
    const communityStore = this._topicsByCommunity[parentEntity];
    const matchingTopic = communityStore.filter((t) => t.id === topic.id)[0];
    const proposalIndex = communityStore.indexOf(matchingTopic);
    if (proposalIndex === -1) {
      throw new Error('Topic not in proposals store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._topicsByCommunity = {};
  }

  public getByCommunity(communityId): Array<OffchainTopic> {
    return this._topicsByCommunity[communityId] || [];
  }

  public getByName(name, communityId): OffchainTopic {
    return this.getByCommunity(communityId).find((t) => t.name === name);
  }
}

export default TopicStore;
