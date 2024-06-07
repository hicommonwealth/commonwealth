import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';

export function GetContestLog(): Query<typeof schemas.GetContestLog> {
  return {
    ...schemas.GetContestLog,
    auth: [isCommunityAdmin],
    body: async ({ payload }) => {
      const outboxEvents = await models.Outbox.findAll({
        where: {
          event_name: {
            [Op.in]: [
              'RecurringContestManagerDeployed',
              'OneOffContestManagerDeployed',
              'ContestContentAdded',
              'ContestContentUpvoted',
            ],
          },
          'event_payload.contest_address': payload.contest_address,
        },
        order: [['created_at', 'DESC']],
      });

      // const outbox = await models.sequelize.query<
      //   z.infer<typeof schemas.ContestResults>
      // >(
      //   `

      // `,
      //   {
      //     type: QueryTypes.SELECT,
      //     raw: true,
      //     replacements: { contest_address: payload.contest_address },
      //   },
      // );

      return {
        outbox_events: outboxEvents,
        actions: [],
      };
    },
  };
}
