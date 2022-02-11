import { IChainEventData, SupportedNetwork } from '@commonwealth/chain-events';
import { NodeInfo, Notification, ChainEvent, NotificationSubscription, ChainEventType } from 'models';
import moment from 'moment';

class DashboardActivityNotification {
    // Thread and Comment Notifications
    public readonly categoryId?: string;
    public readonly viewCount?: number;
    public readonly likeCount?: number;
    public readonly commentCount?: number;
    public readonly createdAt: moment.Moment;
    public readonly notification_data?: string;
    public readonly thread_id?: string;
    private _isRead?: boolean;

    public get isRead(): boolean {
        return this._isRead;
    }

    // Chain Event Notifications
    public readonly typeId?: ChainEventType;
    public readonly blockNumber?: number; 
    public readonly eventData?: IChainEventData;
    public readonly chainEventId?: number;
    public readonly updatedAt?: moment.Moment;
    public readonly eventNetwork?: SupportedNetwork;
    public readonly chain?: string;
    public readonly icon_url?: string;
    

    constructor(createdAt, thread_id?, category_id?, notification_data?, viewCount?, likeCount?, commentCount?, isRead?, type_id?, block_number?, event_data?, id?, updated_at?, event_network?, chain?, icon_url?) {
        this.categoryId = category_id ? category_id : 'chain-event';
        this.thread_id = thread_id;
        this.notification_data = notification_data;
        this.createdAt = moment(createdAt);
        this.viewCount = viewCount;
        this.likeCount = likeCount;
        this.commentCount = commentCount;
        this._isRead = isRead;
        this.typeId = type_id;
        this.blockNumber = block_number;
        this.eventData = event_data;
        this.chainEventId = id;
        this.updatedAt = moment(updated_at);
        this.eventNetwork = event_network;
        this.chain = chain;
        this.icon_url = icon_url;
    }

    public static fromJSON(json) {
        return new DashboardActivityNotification(
          json.created_at,
          json.thread_id,
          json.category_id,
          json.notification_data,
          json.view_count,
          json.like_count,
          json.comment_count,
          json.is_read,
          json.chain_event_type_id,
          json.block_number,
          json.event_data,
          json.id,
          json.updated_at,
          json.event_network,
          json.chain,
          json.icon_url
        );
    }
}

export default DashboardActivityNotification;

