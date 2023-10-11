import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import {
  GetTopicsOptions,
  GetTopicsResult,
  __getTopics,
} from './server_topics_methods/get_topics';
import {
  CreateTopicOptions,
  CreateTopicResult,
  __createTopic,
} from './server_topics_methods/create_topic';
import {
  UpdateTopicOptions,
  UpdateTopicResult,
  __updateTopic,
} from './server_topics_methods/update_topic';
import {
  DeleteTopicOptions,
  DeleteTopicResult,
  __deleteTopic,
} from './server_topics_methods/delete_topic';

/**
 * Implements methods related to topics
 */
export class ServerTopicsController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache
  ) {}

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

  // async updateTopicsOrder(
  //   options: UpdateTopicsOrderOptions
  // ): Promise<UpdateTopicsOrderResult> {
  //   return updateTopicsOrder.call(this, options);
  // }

  // async updateForumChannelConnection(
  //   options: UpdateForumChannelConnectionOptions
  // ): Promise<UpdateForumChannelConnectionResult> {
  //   return __updateForumChannelConnection.call(this, options);
  // }
}
