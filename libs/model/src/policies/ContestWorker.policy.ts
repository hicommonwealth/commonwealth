import { Actor, logger, Policy, ServerError } from '@hicommonwealth/core';
import {
  createPrivateEvmClient,
  rollOverContest,
} from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { config, Contest, models } from '..';
import { GetActiveContestManagers } from '../contest';
import { buildThreadContentUrl, getChainNodeUrl } from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './contest-utils';

const log = logger(import.meta);

const inputs = {
  ThreadCreated: events.ThreadCreated,
  ThreadUpvoted: events.ThreadUpvoted,
  ContestRolloverTimerTicked: events.ContestRolloverTimerTicked,
};

export function ContestWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const content_url = buildThreadContentUrl(
          payload.community_id,
          payload.id!,
        );

        const contestManagers = await Contest.GetActiveContestManagers().body({
          actor: {} as Actor,
          payload: {
            community_id: payload.community_id!,
            topic_id: payload.topic_id!,
          },
        });
        if (!contestManagers?.length) {
          log.warn('ThreadCreated: no matching contest managers found');
          return;
        }

        await createOnchainContestContent({
          contestManagers,
          bypass_quota: false,
          content_url,
          author_address: payload.address!,
        });
      },
      ThreadUpvoted: async ({ payload }) => {
        const content_url = buildThreadContentUrl(
          payload.community_id,
          payload.thread_id,
        );

        const activeContestManagersWithoutVote = await models.sequelize.query<{
          url: string;
          private_url: string;
          contest_address: string;
          content_id: number;
        }>(
          `
              SELECT cn.private_url, cn.url, cm.contest_address, added.content_id
              FROM "Communities" c
                       JOIN "ChainNodes" cn ON c.chain_node_id = cn.id
                       JOIN "ContestManagers" cm ON cm.community_id = c.id
                       JOIN "Contests" co ON cm.contest_address = co.contest_address
                  AND co.contest_id = (SELECT MAX(contest_id) AS max_id
                                       FROM "Contests" c1
                                       WHERE c1.contest_address = cm.contest_address)
                       JOIN "ContestActions" added on co.contest_address = added.contest_address
                  AND added.content_url = :content_url
                  AND added.action = 'added'
              WHERE cm.topic_id = :topic_id
                AND cm.community_id = :community_id
                AND cm.cancelled = false
                AND (
                  cm.interval = 0 AND NOW() < co.end_time
                      OR
                  cm.interval > 0
                  )
                -- content cannot be a winner in a previous contest
                AND NOT EXISTS (WITH max_contest AS (SELECT MAX(contest_id) AS max_id
                                                     FROM "Contests" c1
                                                     WHERE c1.contest_address = cm.contest_address)
                                SELECT c2.score
                                FROM "Contests" c2,
                                     jsonb_array_elements(c2.score) AS score_result
                                WHERE c2.contest_address = cm.contest_address
                                  AND (score_result ->> 'content_id')::int = added.content_id::int
                                  AND (score_result ->> 'prize')::float > 0
                                  AND c2.contest_id != (SELECT max_id FROM max_contest))
          `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              content_url: content_url,
              actor_address: payload.address,
              topic_id: payload.topic_id,
              community_id: payload.community_id,
            },
          },
        );
        if (!activeContestManagersWithoutVote?.length) {
          // throw to trigger retry in case the content is pending creation
          throw new Error(
            'ThreadUpvoted: no matching active contests without actions',
          );
        }

        const chainNodeUrl = getChainNodeUrl(
          activeContestManagersWithoutVote[0]!,
        );

        const contestManagers = activeContestManagersWithoutVote.map(
          ({ contest_address, content_id }) => ({
            url: chainNodeUrl,
            contest_address,
            content_id,
          }),
        );

        await createOnchainContestVote({
          contestManagers,
          content_url,
          author_address: payload.address!,
        });
      },
      ContestRolloverTimerTicked: async () => {
        try {
          await checkContests();
        } catch (err) {
          log.error('error checking contests', err as Error);
        }
        try {
          await rolloverContests();
        } catch (err) {
          log.error('error rolling over contests', err as Error);
        }
      },
    },
  };
}

const getPrivateWalletAddress = (): string => {
  const web3 = createPrivateEvmClient({ privateKey: config.WEB3.PRIVATE_KEY });
  return web3.eth.defaultAccount!;
};

const checkContests = async () => {
  const activeContestManagers = await GetActiveContestManagers().body({
    actor: {} as Actor,
    payload: {},
  });
  // find active contests that have content with no upvotes and will end in one hour
  const contestsWithoutVote = activeContestManagers!.filter(
    (contestManager) =>
      contestManager.actions.some((action) => action.action === 'added') &&
      !contestManager.actions.some((action) => action.action === 'upvoted') &&
      moment(contestManager.end_time).diff(moment(), 'minutes') < 60,
  );

  const promises = contestsWithoutVote.map(async (contestManager) => {
    // add onchain vote to the first content
    const firstContent = contestManager.actions.find(
      (action) => action.action === 'added',
    );

    await createOnchainContestVote({
      contestManagers: [
        {
          url: contestManager.url,
          contest_address: contestManager.contest_address,
          content_id: firstContent!.content_id,
        },
      ],
      content_url: firstContent!.content_url!,
      author_address: getPrivateWalletAddress(),
    });
  });

  const promiseResults = await Promise.allSettled(promises);

  const errors = promiseResults
    .filter(({ status }) => status === 'rejected')
    .map(
      (result) =>
        (result as PromiseRejectedResult).reason || '<unknown reason>',
    );

  if (errors.length > 0) {
    log.error(`CheckContests: failed with errors: ${errors.join(', ')}"`);
  }
};

const rolloverContests = async () => {
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
                             (cm.interval = 0 AND cm.ended IS NOT TRUE)
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

      if (!config.WEB3.PRIVATE_KEY)
        throw new ServerError('WEB3 private key not set!');

      await rollOverContest({
        privateKey: config.WEB3.PRIVATE_KEY,
        rpc: getChainNodeUrl({ url, private_url }),
        contest: contest_address,
        oneOff: interval === 0,
      });

      // clean up neynar webhooks when farcaster contest ends
      if (neynar_webhook_id) {
        try {
          const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
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
    log.error(
      `PerformContestRollovers: failed with errors: ${errors.join(', ')}"`,
    );
  }
};
