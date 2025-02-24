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

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.ReferrerSignedUp,
    users: [{ id: referrer.user_id.toString() }],
    data: { referee_user_id: user_id },
  });
  return !res.some((r) => r.status === 'rejected');
};
