import {
  ContestNotification,
  EventContext,
  EventHandler,
  notificationsProvider,
  NotificationUser,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { ContestScore } from '@hicommonwealth/schemas';
import { Op, QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';

async function getContestDetails({
  contest_address,
  contest_id,
}: {
  contest_address: string;
  contest_id: number;
}) {
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
       M.community_id,
       CO.name as community_name   
    FROM 
      "Contests" C 
      JOIN "ContestManagers" M ON C.contest_address = M.contest_address
      JOIN "Communities" CO ON M.community_id = CO.id
    WHERE
      C.contest_address = :contest_address 
      AND C.contest_id = :contest_id
    `,
    { type: QueryTypes.SELECT, replacements: { contest_address, contest_id } },
  );
  if (!contest) throw new Error('Contest not found');
  return contest;
}

export const notifyContestEvent: EventHandler<
  'ContestStarted' | 'ContestEnding' | 'ContestEnded',
  z.ZodBoolean
> = async (
  event: EventContext<'ContestStarted' | 'ContestEnding' | 'ContestEnded'>,
) => {
  const data = await getContestDetails(event.payload);

  // all community users get notified
  const addresses = await models.Address.findAll({
    where: { community_id: data.community_id, verified: { [Op.not]: null } },
    attributes: ['user_id'],
  });
  const users = addresses.map((a) => {
    return { id: a.user_id?.toString() } as NotificationUser;
  });

  const provider = notificationsProvider();
  switch (event.name) {
    case 'ContestStarted': {
      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.ContestStarted,
        users,
        data,
      });
      return !res.some((r) => r.status === 'rejected');
    }
    case 'ContestEnding': {
      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.ContestEnding,
        users,
        data,
      });
      return !res.some((r) => r.status === 'rejected');
    }
    case 'ContestEnded': {
      // TODO: @rbennettcw what is the contest service to get the final score?
      const scores = (data.score?.length ?? 0) > 0 ? data.score : undefined;
      const winners = scores
        ? await models.Address.findAll({
            where: {
              address: { [Op.in]: scores.map((s) => s.creator_address) },
            },
            attributes: ['address', 'user_id'],
            include: [
              {
                model: models.User,
                attributes: ['profile'],
              },
            ],
          })
        : [];

      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.ContestEnded,
        users,
        data: {
          ...data,
          score:
            scores?.map((s) => ({
              address: s.creator_address,
              name:
                winners.find((w) => w.address === s.creator_address)?.User
                  ?.profile?.name ?? s.creator_address,
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
