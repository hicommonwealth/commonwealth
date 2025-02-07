import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { ZodBoolean } from 'zod';
import { models } from '../../database';

export const notifyAddressOwnershipTransferred: EventHandler<
  'AddressOwnershipTransferred',
  ZodBoolean
> = async ({ payload }) => {
  // TODO: should we ignore when old_user_email is null?
  if (!payload.old_user_email) return true;

  const community = await models.Community.findOne({
    where: { id: payload.community_id },
  });
  if (!community) return false;

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.AddressOwnershipTransferred,
    users: [{ id: String(payload.old_user_id) }],
    data: {
      community_id: payload.community_id,
      community_name: community.name,
      address: payload.address,
      user_id: payload.user_id,
      old_user_id: payload.old_user_id,
      old_user_email: payload.old_user_email,
      created_at: payload.created_at.toISOString(),
    },
  });

  return !res.some((r) => r.status === 'rejected');
};
