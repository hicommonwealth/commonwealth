import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';
import { rollOverContest } from '../services/commonProtocol/contestHelper';
import { getChainNodeUrl } from '../utils/utils';

const log = logger(import.meta);

export function PerformContestRollovers(): Command<
  typeof schemas.PerformContestRollovers
> {
  return {
    ...schemas.PerformContestRollovers,
    auth: [],
    body: async () => {
      const contestManagersWithEndedContest = await models.sequelize.query<{
        contest_address: string;
        interval: number;
        ended: boolean;
        url: string;
        private_url: string;
      }>(
        `
            SELECT cm.contest_address,
                   cm.interval,
                   cm.ended,
                   co.end_time,
                   cn.private_url,
                   cn.url
            FROM "ContestManagers" cm
                     JOIN (SELECT *
                           FROM "Contests"
                           WHERE (contest_address, contest_id) IN (SELECT contest_address, MAX(contest_id) AS contest_id
                                                                   FROM "Contests"
                                                                   GROUP BY contest_address)) co
                          ON co.contest_address = cm.contest_address
                              AND (
                                 cm.interval = 0 AND cm.ended IS NOT TRUE
                                     OR
                                 cm.interval > 0
                                 )
                              AND NOW() > co.end_time
                              AND cm.cancelled IS NOT TRUE
                     JOIN "Communities" cu ON cm.community_id = cu.id
                     JOIN "ChainNodes" cn ON cu.chain_node_id = cn.id;
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
        },
      );

      const contestRolloverPromises = contestManagersWithEndedContest.map(
        async ({ url, private_url, contest_address, interval, ended }) => {
          log.debug(`ROLLOVER: ${contest_address}`);

          if (interval === 0 && !ended) {
            // preemptively mark as ended so that rollover
            // is not attempted again after failure
            await models.ContestManager.update(
              {
                ended: true,
              },
              {
                where: {
                  contest_address,
                },
              },
            );
          }

          return rollOverContest(
            getChainNodeUrl({ url, private_url }),
            contest_address,
            interval === 0,
          );
        },
      );

      const promiseResults = await Promise.allSettled(contestRolloverPromises);

      const errors = promiseResults
        .filter(({ status }) => status === 'rejected')
        .map(
          (result) =>
            (result as PromiseRejectedResult).reason || '<unknown reason>',
        );

      if (errors.length > 0) {
        log.warn(
          `GetAllContests performContestRollovers: failed with errors: ${errors.join(
            ', ',
          )}"`,
        );
      }
    },
  };
}
