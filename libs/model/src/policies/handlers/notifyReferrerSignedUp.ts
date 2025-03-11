import {
  EventContext,
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import z from 'zod';
import { models } from '../../database';

export const notifyReferrerSignedUp: EventHandler<
  'SignUpFlowCompleted',
  z.ZodBoolean
> = async (event: EventContext<'SignUpFlowCompleted'>) => {
  const { user_id, referred_by_address } = event.payload;
  if (!referred_by_address) return;

  const referrer = await models.Address.findOne({
    where: { address: referred_by_address },
    attributes: ['user_id'],
  });
  if (!referrer?.user_id) return;

  const referee = await models.User.findOne({
    where: { id: user_id },
    attributes: ['profile'],
  });

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.ReferrerSignedUp,
    users: [{ id: referrer.user_id.toString() }],
    data: {
      referee_user_id: user_id,
      referee_profile_name: referee?.profile?.name || '',
      referee_profile_avatar_url: referee?.profile?.avatar_url || '',
    },
  });
  return !res.some((r) => r.status === 'rejected');
};
