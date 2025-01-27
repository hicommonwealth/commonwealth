import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { ZodBoolean } from 'zod';

export const notifyAddressOwnershipTransferred: EventHandler<
  'AddressOwnershipTransferred',
  ZodBoolean
> = async ({ payload }) => {
  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.AddressOwnershipTransferred,
    users: [{ id: String(payload.old_user_id) }],
    data: {
      community_id: payload.community_id,
      address: payload.address,
      user_id: payload.user_id,
      old_user_id: payload.old_user_id,
      old_user_email: payload.old_user_email ?? undefined,
      created_at: payload.created_at.toISOString(),
    },
  });

  return !res.some((r) => r.status === 'rejected');
};
