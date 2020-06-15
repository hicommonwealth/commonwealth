import IdStore from './IdStore';
import { DiscussionDraft } from '../models';
import { byAscendingCreationDate } from '../helpers';

// TODO: Differentiate between tags associated with a chain, and tags associated with a community
class TagStore extends IdStore<DiscussionDraft> {
  private _storeCommunity: { [identifier: string]: Array<DiscussionDraft> } = {};

  public add(draft: DiscussionDraft) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(draft);
    this.getAll().sort(byAscendingCreationDate);
    const parentEntity = draft.community ? draft.community : draft.chain;
    if (!this._storeCommunity[parentEntity]) {
      this._storeCommunity[parentEntity] = [];
    }
    this._storeCommunity[parentEntity].push(draft);
    this._storeCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public remove(draft: DiscussionDraft) {
    super.remove(draft);
    const parentEntity = draft.community ? draft.community : draft.chain;
    const communityStore = this._storeCommunity[parentEntity];
    const matchingDraft = communityStore.filter((t) => t.id === draft.id)[0];
    const proposalIndex = communityStore.indexOf(matchingDraft);
    if (proposalIndex === -1) {
      throw new Error('Draft not in store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeCommunity = {};
  }

  public getByCommunity(communityId): Array<DiscussionDraft> {
    return this._storeCommunity[communityId] || [];
  }

  public getByName(name, communityId): DiscussionDraft {
    return this.getByCommunity(communityId).find((t) => t.name === name);
  }
}

export default TagStore;
