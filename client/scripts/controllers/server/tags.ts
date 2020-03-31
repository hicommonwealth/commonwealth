import { default as $ } from 'jquery';
import { default as _ } from 'lodash';

import { TagsStore } from 'models/stores';
import { IUniqueId, OffchainThread, OffchainTag } from 'models/models';

const modelFromServer = (tag) => {
  return new OffchainTag(
    tag.name,
    tag.id,
    tag.communityId,
    tag.chainId
  );
};

class TagsController {
  private _store: TagsStore = new TagsStore();

  public get store() { return this._store; }

  public getByCommunity(communityId) {
    return this._store.getByCommunity(communityId);
  }

  public addToStore(tag: OffchainTag) {
    return this._store.add(tag);
  }
}

export default TagsController;
