import { DB } from '../models';
import emitNotifications, {
  NotificationDataTypes,
} from '../util/emitNotifications';
import { WebhookContent } from '../webhookNotifier';

/**
 * Data required to emit a notification
 */
export type NotificationOptions = {
  categoryId: string;
  objectId: string;
  notificationData: NotificationDataTypes;
  webhookData?: Partial<WebhookContent>;
  excludeAddresses?: string[];
  includeAddresses?: string[];
};

/**
 * An interface that describes the methods related to notifications
 */
interface IServerNotificationsController {
  /**
   * Emits a notification
   *
   * @param options - Notification options
   * @returns Promise
   */
  emit(options: NotificationOptions): Promise<void>;
}

export class ServerNotificationsController
  implements IServerNotificationsController
{
  constructor(private models: DB) {}

  async emit({
    categoryId,
    objectId,
    notificationData,
    webhookData,
    excludeAddresses,
    includeAddresses,
  }: NotificationOptions) {
    await emitNotifications(
      this.models,
      categoryId,
      objectId,
      notificationData,
      webhookData,
      excludeAddresses,
      includeAddresses
    );
  }
}
