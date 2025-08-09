import {
  EventContext,
  EventHandler,
  notificationsProvider,
  NotificationUser,
  WorkflowKeys,
} from '@hicommonwealth/core';
import z from 'zod';

export const notifyQuestStarted: EventHandler<
  'QuestStarted',
  z.ZodBoolean
> = async (event: EventContext<'QuestStarted'>) => {
  const {
    id,
    name,
    description,
    image_url,
    start_date,
    end_date,
    community_id,
  } = event.payload;
  const users: NotificationUser[] = []; // TODO get subscribed users

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.QuestStarted,
    users,
    data: {
      id: id!,
      name,
      description,
      image_url,
      start_date,
      end_date,
      community_id,
    },
  });
  return !res.some((r) => r.status === 'rejected');
};
