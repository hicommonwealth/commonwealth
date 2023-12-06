import moment from 'moment';
import type {
  IChainEventData,
  SupportedNetwork,
} from '../../../shared/chain/types/types';
import { ProfileWithAddress } from '../views/components/component_kit/cw_avatar_group';

class DashboardActivityNotification {
  // Thread and Comment Notifications
  public readonly categoryId?: string;
  public readonly viewCount?: number;
  public readonly likeCount?: number;
  public readonly commentCount?: number;
  public readonly createdAt: moment.Moment;
  public readonly notificationData?: string;
  public readonly threadId?: string;
  public readonly commenters?: ProfileWithAddress[];
  public readonly communityId?: string;
  private _isRead?: boolean;

  public get isRead(): boolean {
    return this._isRead;
  }

  // Chain Event Notifications
  public readonly blockNumber?: number;
  public readonly eventData?: IChainEventData;
  public readonly updatedAt?: moment.Moment;
  public readonly eventNetwork?: SupportedNetwork;
  public readonly community?: string;
  public readonly iconUrl?: string;

  constructor({
    createdAt,
    threadId,
    categoryId,
    notificationData,
    viewCount,
    likeCount,
    commentCount,
    isRead,
    blockNumber,
    eventData,
    updatedAt,
    eventNetwork,
    community,
    iconUrl,
    commenters,
    communityId,
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
    community?: string;
    iconUrl?: string;
    commenters?: ProfileWithAddress[];
    communityId?: string;
  }) {
    this.categoryId = categoryId || 'chain-event';
    this.threadId = threadId;
    this.notificationData = notificationData;
    this.createdAt = moment(createdAt);
    this.viewCount = viewCount;
    this.likeCount = likeCount;
    this.commentCount = commentCount;
    this._isRead = isRead;
    this.blockNumber = blockNumber;
    this.eventData = eventData;
    this.updatedAt = moment(updatedAt);
    this.eventNetwork = eventNetwork;
    this.community = community;
    this.iconUrl = iconUrl;
    this.commenters = commenters;
    this.communityId = communityId;
  }

  public static fromJSON(json) {
    return new DashboardActivityNotification({
      createdAt: json.created_at,
      threadId: json.thread_id,
      categoryId: json.category_id,
      notificationData: json.notification_data,
      viewCount: json.view_count,
      likeCount: json.like_count,
      commentCount: json.comment_count,
      isRead: json.is_read,
      blockNumber: json.block_number,
      eventData: json.event_data,
      updatedAt: json.updated_at,
      eventNetwork: json.network || json.event_network,
      community: json.chain,
      iconUrl: json.icon_url,
      commenters: json.commenters,
      communityId: json.chain_id,
    });
  }
}

export default DashboardActivityNotification;
