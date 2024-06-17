import { NotificationInstance } from '@hicommonwealth/model';
import { NotificationDataAndCategory } from '@hicommonwealth/shared';
import emitNotifications from '../../util/emitNotifications';
import { ServerNotificationsController } from '../server_notifications_controller';

export type EmitOptions = {
  notification: NotificationDataAndCategory;
  excludeAddresses?: string[];
  includeAddresses?: string[];
};

export type EmitResult = NotificationInstance;

export async function __emit(
  this: ServerNotificationsController,
  { notification, excludeAddresses, includeAddresses }: EmitOptions,
): Promise<EmitResult> {
  return emitNotifications(
    this.models,
    notification,
    excludeAddresses,
    includeAddresses,
  );
}
