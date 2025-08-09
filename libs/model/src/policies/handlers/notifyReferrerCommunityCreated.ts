import {
  EventContext,
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import z from 'zod';
import { models } from '../../database';

export const notifyReferrerCommunityCreated: EventHandler<
  'CommunityCreated',
  z.ZodBoolean
> = async (event: EventContext<'CommunityCreated'>) => {
  const { user_id, community_id, referrer_address } = event.payload;
  if (!referrer_address) return;

  const referrer = await models.Address.findOne({
    where: { address: referrer_address },
    attributes: ['user_id'],
  });
  if (!referrer?.user_id) return;

  const referee = await models.User.findOne({
    where: { id: user_id },
    attributes: ['profile'],
  });

  const community = await models.Community.findOne({
    where: { id: community_id },
    attributes: ['name', 'icon_url'],
  });
  if (!community) return;

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.ReferrerCommunityCreated,
    users: [{ id: referrer.user_id.toString() }],
    data: {
      community_id: event.payload.community_id,
      community_name: community.name,
      community_icon_url: community.icon_url || '',
      referee_user_id: user_id,
      referee_profile_name: referee?.profile?.name || '',
      referee_profile_avatar_url: referee?.profile?.avatar_url || '',
    },
  });
  return !res.some((r) => r.status === 'rejected');
};
