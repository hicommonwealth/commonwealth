import IdStore from './IdStore';
import { OffchainTag } from '../models';
import { byAscendingCreationDate } from '../helpers';

class TagsStore extends IdStore<OffchainTag> {
  private _storeCommunity: { [identifier: string]: Array<OffchainTag> } = {};

  public add(tag: OffchainTag) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(tag);
    this.getAll().sort(byAscendingCreationDate);
    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;
    if (!this._storeCommunity[parentEntity]) {
      this._storeCommunity[parentEntity] = [];
    }
    this._storeCommunity[parentEntity].push(tag);
    this._storeCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public remove(tag: OffchainTag) {
    super.remove(tag);
    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;
    const communityStore = this._storeCommunity[parentEntity];
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
    this._storeCommunity = {};
  }

  public getByCommunity(communityId): Array<OffchainTag> {
    return this._storeCommunity[communityId] || [];
  }
}

export default TagsStore;
