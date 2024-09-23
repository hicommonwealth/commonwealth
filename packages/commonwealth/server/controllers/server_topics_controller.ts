import { DB } from '@hicommonwealth/model';
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
  constructor(public models: DB) {}

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
