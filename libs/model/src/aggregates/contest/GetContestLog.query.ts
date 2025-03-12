import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetContestLog(): Query<typeof schemas.GetContestLog> {
  return {
    ...schemas.GetContestLog,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const results = await models.sequelize.query<
        z.infer<typeof schemas.ContestLogEntry>
      >(
        `
          SELECT
              o.event_name,
              o.event_payload,
              o.event_payload->>'contest_address' as contest_address,
              COALESCE(ca.contest_id, 0) AS contest_id,
              ca.action,
              ca.actor_address,
              ca.voting_power,
              ca.thread_id,
              t.title as thread_title,
              o.created_at
          FROM
              "Outbox" o
          LEFT JOIN
              "ContestActions" ca
              ON ca.contest_address = o.event_payload->>'contest_address'
              AND (
                  (o.event_name = 'ContestContentAdded' AND ca.action = 'added') OR
                  (o.event_name = 'ContestContentUpvoted' AND ca.action = 'upvoted')
              )
          LEFT JOIN "Threads" t on t.id = ca.thread_id
          WHERE
              o.event_name IN (
                  'RecurringContestManagerDeployed',
                  'OneOffContestManagerDeployed',
                  'ContestContentAdded',
                  'ContestContentUpvoted'
              )
              AND o.event_payload->>'contest_address' = :contest_address
          ORDER BY
              o.created_at DESC;
      `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: { contest_address: payload.contest_address },
        },
      );

      return results;
    },
  };
}
