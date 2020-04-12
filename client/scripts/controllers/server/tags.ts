import $ from 'jquery';
import _ from 'lodash';

import { TagsStore } from 'stores';
import { IUniqueId, OffchainThread, OffchainTag } from 'models';
import app from 'state';

const modelFromServer = (tag) => {
  return new OffchainTag(
    tag.name,
    tag.id,
    tag.description,
    tag.community_id,
    tag.chain_id,
  );
};

class TagsController {
  private _store: TagsStore = new TagsStore();

  private _initialized: boolean = false;

  public get store() { return this._store; }

  public get initialized() { return this._initialized; }

  public getByIdentifier(id) {
    return this._store.getById(id);
  }

  public getByCommunity(communityId) {
    return this._store.getByCommunity(communityId);
  }

  public addToStore(tag: OffchainTag) {
    return this._store.add(modelFromServer(tag));
  }

  public removeFromStore(tag) {
    return this._store.remove(tag);
  }

  public async edit(tag: OffchainTag, featured_order?) {
    try {
      const response = await $.post(`${app.serverUrl()}/editTag`, {
        'id': tag.id,
        'community': tag.communityId,
        'chain': tag.chainId,
        'name': tag.name,
        'description': tag.description,
        'featured_order': featured_order,
        'jwt': app.login.jwt
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit tag');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to edit tag');
    }
  }

  public async refreshAll(communityId?, chainId?, reset = false) {
    try {
      const response = await $.get(`${app.serverUrl()}/bulkTags`, {
        chain: chainId,
        community: communityId,
        jwt: app.login.jwt,
      });
      console.log(response.result);
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful refresh status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      const tags = (app.chain) ? response.result.filter((tag) => !tag.communityId) : response.result;
      tags.forEach((t) => this._store.add(modelFromServer(t)));
      console.log(this._store);
      this._initialized = true;
    } catch (err) {
      console.log('Failed to load offchain tags');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading offchain tags');
    }
  }
}

export default TagsController;
