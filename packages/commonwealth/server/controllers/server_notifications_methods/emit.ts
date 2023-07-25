import emitNotifications from '../../util/emitNotifications';
import { WebhookContent } from '../../webhookNotifier';
import { ServerNotificationsController } from '../server_notifications_controller';
import { NotificationInstance } from '../../models/notification';
import { NotificationDataAndCategory } from 'types';

export type EmitOptions = {
  objectId: string;
  notificationData: NotificationDataAndCategory;
  webhookData?: Partial<WebhookContent>;
  excludeAddresses?: string[];
  includeAddresses?: string[];
};

export type EmitResult = NotificationInstance;

export async function __emit(
  this: ServerNotificationsController,
  {
    objectId,
    notificationData,
    webhookData,
    excludeAddresses,
    includeAddresses,
  }: EmitOptions
): Promise<EmitResult> {
  return emitNotifications(
    this.models,
    objectId,
    notificationData,
    webhookData,
    excludeAddresses,
    includeAddresses
  );
}
