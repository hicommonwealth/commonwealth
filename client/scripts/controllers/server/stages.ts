import $ from 'jquery';
import _ from 'lodash';

import { StageStore } from 'stores';
import { OffchainStage } from 'models';
import app from 'state';

const modelFromServer = (stage) => {
  return new OffchainStage(
    stage.name,
    stage.id,
    stage.description,
    stage.community_id,
    stage.chain_id,
    stage.featured_in_sidebar,
    stage.featured_in_new_post
  );
};

class StagesController {
  private _store: StageStore = new StageStore();
  private _initialized: boolean = false;
  public get store() { return this._store; }
  public get initialized() { return this._initialized; }
  public getByIdentifier(id) { return this._store.getById(id); }
  public getByCommunity(communityId) { return this._store.getByCommunity(communityId); }
  public getByName(name, communityId) { return this._store.getByName(name, communityId); }
  public addToStore(stage: OffchainStage) { return this._store.add(modelFromServer(stage)); }

  public async edit(stage: OffchainStage) {
    try {
      // TODO: Change to PUT /stage
      const response = await $.post(`${app.serverUrl()}/editStage`, {
        'id': stage.id,
        'community': stage.communityId,
        'chain': stage.chainId,
        'name': stage.name,
        'description': stage.description,
        'featured_in_sidebar': stage.featuredInSidebar,
        'featured_in_new_post': stage.featuredInNewPost,
        'address': app.user.activeAccount.address,
        'jwt': app.user.jwt
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit stage');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to edit stage');
    }
  }

  public async update(threadId: number, stageName: string, stageId?: number) {
    try {
      const response = await $.post(`${app.serverUrl()}/updateStages`, {
        'jwt': app.user.jwt,
        'thread_id': threadId,
        'stage_id': stageId,
        'stage_name': stageName,
        'address': app.user.activeAccount.address,
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to update stage');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to update stage');
    }
  }

  public async add(name: string, description: string, featured_in_sidebar: boolean, featured_in_new_post: boolean,
    defaultOffchainTemplate: string) {
    try {
      const chainOrCommObj = (app.activeChainId())
        ? { 'chain': app.activeChainId() }
        : { 'community': app.activeCommunityId() };
      // TODO: Change to POST /stage
      const response = await $.post(`${app.serverUrl()}/createStage`, {
        ...chainOrCommObj,
        'name': name,
        'description': description,
        'featured_in_sidebar': featured_in_sidebar,
        'featured_in_new_post': featured_in_new_post,
        'default_offchain_template': defaultOffchainTemplate,
        'jwt': app.user.jwt,
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to add stage');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to add stage');
    }
  }

  public async remove(stage) {
    try {
      // TODO: Change to DELETE /stage
      const response = await $.post(`${app.serverUrl()}/deleteStage`, {
        'id': stage.id,
        'community': stage.communityId,
        'chain': stage.chainId,
        'jwt': app.user.jwt
      });
      this._store.remove(this._store.getById(stage.id));
      const activeEntity = stage.communityId || stage.chainId;
      // TODO: need uncomment the next line
      app.threads.listingStore.removeStage(activeEntity, stage.name);
    } catch (err) {
      console.log('Failed to delete stage');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to delete stage');
    }
  }

  public async refreshAll(chainId, communityId, reset = false) {
    try {
      // TODO: Change to GET /stages
      const response = await $.get(`${app.serverUrl()}/bulkStages`, {
        chain: chainId || app.activeChainId(),
        community: communityId || app.activeCommunityId(),
      });
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful refresh status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      const stages = (app.chain) ? response.result.filter((stage) => !stage.communityId) : response.result;
      stages.forEach((t) => this._store.add(modelFromServer(t)));
      this._initialized = true;
    } catch (err) {
      console.log('Failed to load offchain stages');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading offchain stages');
    }
  }

  public initialize(initialStages, reset = true) {
    if (reset) {
      this._store.clear();
    }
    initialStages.forEach((t) => {
      try {
        this._store.add(modelFromServer(t));
      } catch (e) {
        console.error(e);
      }
    });
    this._initialized = true;
  }

  public getStageListing = (stage, activeStage) => {
    // If a stage is already in the StageStore, e.g. due to app.stages.edit, it will be excluded from
    // addition to the StageStore, since said store will be more up-to-date
    const existing = this.getByIdentifier(stage.id);
    if (!existing) this.addToStore(stage);
    const { id, name, description } = existing || stage;
    const selected = name === activeStage;
    return { id, name, description, selected };
  }
}

export default StagesController;
