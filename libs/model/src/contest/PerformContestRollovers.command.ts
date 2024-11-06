import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { QueryTypes } from 'sequelize';
import { config } from '../config';
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
        neynar_webhook_id?: string;
      }>(
        `
            SELECT cm.contest_address,
                   cm.interval,
                   cm.ended,
                   cm.neynar_webhook_id,
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
        async ({
          url,
          private_url,
          contest_address,
          interval,
          ended,
          neynar_webhook_id,
        }) => {
          log.info(`ROLLOVER: ${contest_address}`);

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

          await rollOverContest(
            getChainNodeUrl({ url, private_url }),
            contest_address,
            interval === 0,
          );

          // clean up neynar webhooks when farcaster contest ends
          if (interval === 0 && neynar_webhook_id) {
            try {
              const client = new NeynarAPIClient(
                config.CONTESTS.NEYNAR_API_KEY!,
              );
              await client.deleteWebhook(neynar_webhook_id);
              await models.ContestManager.update(
                {
                  neynar_webhook_id: null,
                  neynar_webhook_secret: null,
                },
                {
                  where: {
                    contest_address,
                  },
                },
              );
            } catch (err) {
              log.warn(`failed to delete neynar webhook: ${neynar_webhook_id}`);
            }
          }
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
