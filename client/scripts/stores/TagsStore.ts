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

    if (!this._storeCommunity[tag[parentEntity]]) {
      this._storeCommunity[tag[parentEntity]] = [];
    }
    this._storeCommunity[tag[parentEntity]].push(tag);
    this._storeCommunity[tag[parentEntity]].sort(byAscendingCreationDate);

    return this;
  }

  public remove(tag: OffchainTag) {
    super.remove(tag);

    const parentEntity = tag.communityId ? tag.communityId : tag.chainId;

    const proposalIndex = this._storeCommunity[tag[parentEntity]].indexOf(tag);
    if (proposalIndex === -1) {
      throw new Error('Tag not in proposals store');
    }
    this._storeCommunity[tag[parentEntity]].splice(proposalIndex, 1);
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
