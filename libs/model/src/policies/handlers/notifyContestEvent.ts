import {
  ContestNotification,
  EventContext,
  EventHandler,
  notificationsProvider,
  NotificationUser,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op, QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';

async function getContestDetails(contest_address: string, contest_id: number) {
  const [contest] = await models.sequelize.query<
    z.infer<typeof ContestNotification>
  >(
    `
    SELECT
       C.contest_id,
       C.start_time,
       C.end_time,
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
  const { contest_address, contest_id } = event.payload;
  const data = await getContestDetails(contest_address, contest_id);

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
      const { winners } = event.payload as z.infer<typeof events.ContestEnded>;
      const profiles = await models.Address.findAll({
        where: {
          address: { [Op.in]: winners.map((s) => s.address) },
        },
        attributes: ['address'],
        include: [
          {
            model: models.User,
            attributes: ['profile'],
          },
        ],
      });
      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.ContestEnded,
        users,
        data: {
          ...data,
          winners: winners.map((s) => ({
            address: s.address,
            content: s.content,
            name:
              profiles.find((p) => p.address === s.address)?.User?.profile
                ?.name ?? s.address,
            votes: s.votes,
            prize: s.prize,
          })),
        },
      });
      return !res.some((r) => r.status === 'rejected');
    }
    default:
      throw new Error('Invalid event');
  }
};
