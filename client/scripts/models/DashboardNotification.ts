import { NodeInfo, Notification, ChainEvent, NotificationSubscription, ChainEventType } from 'models';

class DashboardNotification extends Notification {
    public readonly categoryId?: string;
    public readonly viewCount?: number;
    public readonly likeCount?: number;
    public readonly commentCount?: number;


    constructor(id, data, isRead, createdAt, categoryId, subscription, chainEvent?, viewCount?, likeCount?, commentCount?) {
        super(id, data, isRead, createdAt, subscription, chainEvent);
        this.categoryId = categoryId;
        this.viewCount = viewCount;
        this.likeCount = likeCount;
        this.commentCount = commentCount;
    }

    public static fromJSON(json, subscription: NotificationSubscription, chainEventType?: ChainEventType) {
        return new DashboardNotification(
          json.id,
          json.notification_data,
          json.is_read,
          json.created_at,
          json.category_id,
          subscription,
          json.Notification?.ChainEvent ? ChainEvent.fromJSON(json.Notification.ChainEvent, chainEventType) : undefined,
          json.view_count,
          json.like_count,
          json.comment_count
        );
    }
}

export default DashboardNotification;