import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import {
  CreateTopicOptions,
  CreateTopicResult,
  __createTopic,
} from './server_topics_methods/create_topic';
import {
  DeleteTopicOptions,
  DeleteTopicResult,
  __deleteTopic,
} from './server_topics_methods/delete_topic';
import {
  GetTopicsOptions,
  GetTopicsResult,
  __getTopics,
} from './server_topics_methods/get_topics';
import {
  UpdateTopicOptions,
  UpdateTopicResult,
  __updateTopic,
} from './server_topics_methods/update_topic';
import {
  UpdateTopicChannelOptions,
  UpdateTopicChannelResult,
  __updateTopicChannel,
} from './server_topics_methods/update_topic_channel';
import {
  UpdateTopicsOrderOptions,
  UpdateTopicsOrderResult,
  __updateTopicsOrder,
} from './server_topics_methods/update_topics_order';

/**
 * Implements methods related to topics
 */
export class ServerTopicsController {
  constructor(public models: DB, public banCache: BanCache) {}

  async getTopics(options: GetTopicsOptions): Promise<GetTopicsResult> {
    return __getTopics.call(this, options);
  }

  async createTopic(options: CreateTopicOptions): Promise<CreateTopicResult> {
    return __createTopic.call(this, options);
  }

  async updateTopic(options: UpdateTopicOptions): Promise<UpdateTopicResult> {
    return __updateTopic.call(this, options);
  }

  async deleteTopic(options: DeleteTopicOptions): Promise<DeleteTopicResult> {
    return __deleteTopic.call(this, options);
  }

  async updateTopicsOrder(
    options: UpdateTopicsOrderOptions,
  ): Promise<UpdateTopicsOrderResult> {
    return __updateTopicsOrder.call(this, options);
  }

  async updateTopicChannel(
    options: UpdateTopicChannelOptions,
  ): Promise<UpdateTopicChannelResult> {
    return __updateTopicChannel.call(this, options);
  }
}
