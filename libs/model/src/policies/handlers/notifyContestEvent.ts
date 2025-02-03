import {
  ContestNotification,
  EventContext,
  EventHandler,
  notificationsProvider,
  NotificationUser,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { ContestScore } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';

async function getContestDetails(contest_id: number) {
  const [contest] = await models.sequelize.query<
    z.infer<typeof ContestNotification> & {
      score: z.infer<typeof ContestScore> | null;
    }
  >(
    `
    SELECT
       C.contest_id,
       C.start_time,
       C.end_time,
       C.score,
       M.name as contest_name,
       M.image_url,
       M.community_id
    FROM "Contests" C JOIN "ContestManagers" M ON C.contest_address = M.contest_address
    WHERE contest_id = :contest_id
    `,
    { type: QueryTypes.SELECT, replacements: { contest_id } },
  );
  if (!contest) throw new Error('Contest not found');
  return contest;
}

export const notifyContestEvent: EventHandler<
  'ContestEnding' | 'ContestEnded',
  z.ZodBoolean
> = async (event: EventContext<'ContestEnding' | 'ContestEnded'>) => {
  const data = await getContestDetails(event.payload.contest_id);

  // TODO: find subscriptions
  const users = [] as NotificationUser[];

  const provider = notificationsProvider();

  switch (event.name) {
    case 'ContestEnding': {
      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.ContestEnding,
        users,
        data,
      });
      return !res.some((r) => r.status === 'rejected');
    }
    case 'ContestEnded': {
      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.ContestEnded,
        users,
        data: {
          ...data,
          score:
            data.score?.map((s) => ({
              address: s.creator_address,
              prize: s.prize,
              votes: s.votes,
            })) ?? [],
        },
      });
      return !res.some((r) => r.status === 'rejected');
    }
    default:
      throw new Error('Invalid event');
  }
};
