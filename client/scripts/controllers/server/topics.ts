import $ from 'jquery';
import _ from 'lodash';

import { TopicStore } from 'stores';
import { OffchainTopic } from 'models';
import app from 'state';
import BN from 'bn.js';

class TopicsController {
  private _store: TopicStore = new TopicStore();
  private _initialized = false;
  public get store() { return this._store; }
  public get initialized() { return this._initialized; }
  public getByIdentifier(id) { return this._store.getById(id); }
  public getByCommunity(communityId) { return this._store.getByCommunity(communityId); }
  public getByName(name, communityId) { return this._store.getByName(name, communityId); }
  public addToStore(topic: OffchainTopic) { return this._store.add(topic); }

  public async edit(topic: OffchainTopic, featured_order?: boolean) {
    try {
      // TODO: Change to PUT /topic
      const response = await $.post(`${app.serverUrl()}/editTopic`, {
        'id': topic.id,
        'chain': topic.chainId,
        'name': topic.name,
        'description': topic.description,
        'telegram': topic.telegram,
        'featured_in_sidebar': topic.featuredInSidebar,
        'featured_in_new_post': topic.featuredInNewPost,
        'default_offchain_template': topic.defaultOffchainTemplate,
        'featured_order': featured_order,
        'address': app.user.activeAccount.address,
        'jwt': app.user.jwt,
      });
      const result = new OffchainTopic(response.result);
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

  public async setTopicThreshold(topic: OffchainTopic, token_threshold: string) {
    try {
      const response = await $.post(`${app.serverUrl()}/setTopicThreshold`, {
        'topic_id': topic.id,
        'token_threshold': token_threshold,
        'jwt': app.user.jwt
      });
      if (response.status === 'Success') {
        // update stored value immediately
        topic.setTokenThreshold(new BN(token_threshold));
      }
      return response.status;
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
      const result = new OffchainTopic(response.result);
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

  public async add(
    name: string,
    description: string,
    telegram: string,
    featuredInSidebar: boolean,
    featuredInNewPost: boolean,
    tokenThreshold: string,
    defaultOffchainTemplate: string,
  ) {
    try {
      // TODO: Change to POST /topic
      const response = await $.post(`${app.serverUrl()}/createTopic`, {
        'chain': app.activeChainId(),
        'name': name,
        'description': description,
        'telegram': telegram,
        'featured_in_sidebar': featuredInSidebar,
        'featured_in_new_post': featuredInNewPost,
        'default_offchain_template': defaultOffchainTemplate,
        'jwt': app.user.jwt,
        'token_threshold': tokenThreshold,
      });
      const result = new OffchainTopic(response.result);
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
        'chain': topic.chainId,
        'jwt': app.user.jwt
      });
      this._store.remove(this._store.getById(topic.id));
      const activeEntity = topic.chainId;
      app.threads.listingStore.removeTopic(activeEntity, topic.name);
    } catch (err) {
      console.log('Failed to delete topic');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to delete topic');
    }
  }

  public async refreshAll(chainId, reset = false) {
    try {
      // TODO: Change to GET /topics
      const response = await $.get(`${app.serverUrl()}/bulkTopics`, {
        chain: chainId || app.activeChainId(),
      });
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful refresh status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      const topics = (app.chain) ? response.result.filter((topic) => !topic.communityId) : response.result;
      topics.forEach((t) => this._store.add(new OffchainTopic(t)));
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
        this._store.add(new OffchainTopic(t));
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
    const { id, name, description, telegram } = existing || topic;
    const selected = name === activeTopic;
    return { id, name, description, telegram, selected };
  }
}

export default TopicsController;
