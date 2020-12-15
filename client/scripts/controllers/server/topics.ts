import $ from 'jquery';
import _ from 'lodash';

import { TopicStore } from 'stores';
import { OffchainTopic } from 'models';
import app from 'state';

const modelFromServer = (topic) => {
  return new OffchainTopic(
    topic.name,
    topic.id,
    topic.description,
    topic.community_id,
    topic.chain_id,
  );
};

class TopicsController {
  private _store: TopicStore = new TopicStore();
  private _initialized: boolean = false;
  public get store() { return this._store; }
  public get initialized() { return this._initialized; }
  public getByIdentifier(id) { return this._store.getById(id); }
  public getByCommunity(communityId) { return this._store.getByCommunity(communityId); }
  public getByName(name, communityId) { return this._store.getByName(name, communityId); }
  public addToStore(topic: OffchainTopic) { return this._store.add(modelFromServer(topic)); }

  public async edit(topic: OffchainTopic, featured_order?: boolean) {
    try {
      // TODO: Change to PUT /topic
      const response = await $.post(`${app.serverUrl()}/editTopic`, {
        'id': topic.id,
        'community': topic.communityId,
        'chain': topic.chainId,
        'name': topic.name,
        'description': topic.description,
        'featured_order': featured_order,
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
      console.log('Failed to edit topic');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to edit topic');
    }
  }

  public async update(threadId: number, topicName: string, topicId?: number) {
    try {
      const response = await $.post(`${app.serverUrl()}/updateTopics`, {
        'jwt': app.user.jwt,
        'thread_id': threadId,
        'topic_id': topicId,
        'topic_name': topicName,
        'address': app.user.activeAccount.address,
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to update topic');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to update topic');
    }
  }

  public async add(name: string, description: string) {
    try {
      const chainOrCommObj = (app.activeChainId())
        ? { 'chain': app.activeChainId() }
        : { 'community': app.activeCommunityId() };
      // TODO: Change to POST /topic
      const response = await $.post(`${app.serverUrl()}/createTopic`, {
        ...chainOrCommObj,
        'name': name,
        'description': description,
        'jwt': app.user.jwt,
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit topic');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to edit topic');
    }
  }

  public async remove(topic) {
    try {
      // TODO: Change to DELETE /topic
      const response = await $.post(`${app.serverUrl()}/deleteTopic`, {
        'id': topic.id,
        'community': topic.communityId,
        'chain': topic.chainId,
        'jwt': app.user.jwt
      });
      this._store.remove(this._store.getById(topic.id));
      const activeEntity = topic.communityId || topic.chainId;
      app.threads.listingStore.removeTopic(activeEntity, topic.name);
    } catch (err) {
      console.log('Failed to delete topic');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to delete topic');
    }
  }

  public async refreshAll(chainId, communityId, reset = false) {
    try {
      // TODO: Change to GET /topics
      const response = await $.get(`${app.serverUrl()}/bulkTopics`, {
        chain: chainId || app.activeChainId(),
        community: communityId || app.activeCommunityId(),
      });
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful refresh status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      const topics = (app.chain) ? response.result.filter((topic) => !topic.communityId) : response.result;
      topics.forEach((t) => this._store.add(modelFromServer(t)));
      this._initialized = true;
    } catch (err) {
      console.log('Failed to load offchain topics');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading offchain topics');
    }
  }

  public initialize(initialTopics, reset = true) {
    if (reset) {
      this._store.clear();
    }
    initialTopics.forEach((t) => {
      try {
        this._store.add(modelFromServer(t));
      } catch (e) {
        console.error(e);
      }
    });
    this._initialized = true;
  }

  public getTopicListing = (topic, activeTopic) => {
    // Iff a topic is already in the TopicStore, e.g. due to app.topics.edit, it will be excluded from
    // addition to the TopicStore, since said store will be more up-to-date
    const existing = this.getByIdentifier(topic.id);
    if (!existing) this.addToStore(topic);
    const { id, name, description } = existing || topic;
    const selected = name === activeTopic;
    return { id, name, description, selected };
  }
}

export default TopicsController;
