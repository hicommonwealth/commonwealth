import { NotificationInstance } from '@hicommonwealth/model';
import { ServerNotificationsController } from '../server_notifications_controller';

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
