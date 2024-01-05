import type { SupportedNetwork } from '@hicommonwealth/core';
import moment from 'moment';
import type { IChainEventData } from '../../../shared/chain/types/types';
import { ProfileWithAddress } from '../views/components/component_kit/cw_avatar_group';

class DashboardActivityNotification {
  // Thread and Comment Notifications
  public readonly categoryId?: string;
  public readonly commentCount?: number;
  public readonly createdAt: moment.Moment;
  public readonly notificationData?: string;
  public readonly threadId?: string;
  public readonly commenters?: ProfileWithAddress[];
  public readonly chainId?: string;

  // Chain Event Notifications
  public readonly blockNumber?: number;
  public readonly eventData?: IChainEventData;
  public readonly updatedAt?: moment.Moment;
  public readonly eventNetwork?: SupportedNetwork;
  public readonly chain?: string;

  constructor({
    createdAt,
    threadId,
    categoryId,
    notificationData,
    commentCount,
    blockNumber,
    eventData,
    updatedAt,
    eventNetwork,
    chain,
    commenters,
    chainId,
  }: {
    createdAt: string;
    threadId?: string;
    categoryId?: string;
    notificationData?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    isRead?: boolean;
    blockNumber?: number;
    eventData?: IChainEventData;
    id?: number;
    updatedAt?: string;
    eventNetwork?: SupportedNetwork;
    chain?: string;
    commenters?: ProfileWithAddress[];
    chainId?: string;
  }) {
    this.categoryId = categoryId || 'chain-event';
    this.threadId = threadId;
    this.notificationData = notificationData;
    this.createdAt = moment(createdAt);
    this.commentCount = commentCount;
    this.blockNumber = blockNumber;
    this.eventData = eventData;
    this.updatedAt = moment(updatedAt);
    this.eventNetwork = eventNetwork;
    this.chain = chain;
    this.commenters = commenters;
    this.chainId = chainId;
  }

  public static fromJSON(json) {
    return new DashboardActivityNotification({
      createdAt: json.created_at,
      threadId: json.thread_id,
      categoryId: json.category_id,
      notificationData: json.notification_data,
      commentCount: json.comment_count,
      blockNumber: json.block_number,
      eventData: json.event_data,
      updatedAt: json.updated_at,
      eventNetwork: json.network || json.event_network,
      chain: json.chain,
      commenters: json.commenters,
      chainId: json.chain_id,
    });
  }
}

export default DashboardActivityNotification;
