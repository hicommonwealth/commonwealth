import IdStore from './IdStore';
import { OffchainTag } from '../models';
import { byAscendingCreationDate } from '../helpers';

// TODO: Differentiate between tags associated with a chain, and tags associated with a community
class TagStore extends IdStore<OffchainTag> {
  private _tagsByCommunity: { [identifier: string]: Array<OffchainTag> } = {};

  public add(tag: OffchainTag) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(tag);
    this.getAll().sort(byAscendingCreationDate);
    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;
    if (!this._tagsByCommunity[parentEntity]) {
      this._tagsByCommunity[parentEntity] = [];
    }
    this._tagsByCommunity[parentEntity].push(tag);
    this._tagsByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public remove(tag: OffchainTag) {
    super.remove(tag);
    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;
    const communityStore = this._tagsByCommunity[parentEntity];
    const matchingTag = communityStore.filter((t) => t.id === tag.id)[0];
    const proposalIndex = communityStore.indexOf(matchingTag);
    if (proposalIndex === -1) {
      throw new Error('Tag not in proposals store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._tagsByCommunity = {};
  }

  public getByCommunity(communityId): Array<OffchainTag> {
    return this._tagsByCommunity[communityId] || [];
  }

  public getByName(name, communityId): OffchainTag {
    return this.getByCommunity(communityId).find((t) => t.name === name);
  }
}

export default TagStore;
