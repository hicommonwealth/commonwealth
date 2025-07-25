import {
  Actor,
  command,
  logger,
  Policy,
  ServerError,
} from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import dayjs from 'dayjs';
import { QueryTypes } from 'sequelize';
import { GetActiveContestManagers } from '../aggregates/contest';
import { SetContestEnded } from '../aggregates/contest/SetContestEnded.command';
import { SetContestEnding } from '../aggregates/contest/SetContestEnding.command';
import { config } from '../config';
import { models } from '../database';
import { systemActor } from '../middleware';
import { buildThreadContentUrl, getChainNodeUrl } from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './utils/contest-utils';

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

        const contestManagers = await GetActiveContestManagers().body({
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
          eth_chain_id: number;
          private_url: string;
          contest_address: string;
          namespace_judge_token_id: number | null;
          namespace_judges: string[] | null;
          content_id: number;
          creator_address: string;
        }>(
          `
              SELECT
                cn.private_url,
                cn.url,
                cn.eth_chain_id,
                cm.contest_address,
                cm.namespace_judge_token_id,
                cm.namespace_judges,
                added.content_id,
                cm.creator_address
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
          ({
            contest_address,
            content_id,
            eth_chain_id,
            namespace_judge_token_id,
            namespace_judges,
            creator_address,
          }) => ({
            url: chainNodeUrl,
            contest_address,
            content_id,
            eth_chain_id,
            namespace_judge_token_id,
            namespace_judges,
            creator_address,
          }),
        );

        const allowedContestManagers = contestManagers.filter(
          (contestManager) => {
            // if judged contest, only allow judge
            if (contestManager.namespace_judge_token_id) {
              const isJudge = (contestManager.namespace_judges || [])
                .map((addr) => addr.toLowerCase())
                .includes(payload.address!.toLowerCase());
              if (!isJudge) {
                log.warn(
                  `ThreadUpvoted: ${payload.address} is not a judge for contest ${contestManager.contest_address}– vote skipped`,
                );
              }
              return isJudge;
            }
            // if not judged contest, allow all to vote
            return true;
          },
        );

        await createOnchainContestVote({
          contestManagers: allowedContestManagers,
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

const checkContests = async () => {
  const activeContestManagers = await GetActiveContestManagers().body({
    actor: {} as Actor,
    payload: {},
  });
  // active contests with content that are ending in one hour
  const contestsEndingInOneHour = activeContestManagers!.filter(
    (contestManager) => {
      if (contestManager.environment !== config.APP_ENV) {
        return false;
      }
      const firstContent = contestManager.actions.find(
        (action) => action.action === 'added',
      );
      const timeLeft = dayjs(contestManager.end_time).diff(dayjs(), 'minutes');
      const isEnding =
        !contestManager.ending && !!firstContent && timeLeft < 60;
      return isEnding;
    },
  );

  const promiseResults = await Promise.allSettled(
    contestsEndingInOneHour.map(async (contestManager) => {
      log.info(`ENDING: ${contestManager.contest_address}`);
      await command(SetContestEnding(), {
        actor: systemActor({}),
        payload: {
          contest_address: contestManager.contest_address,
          contest_id: contestManager.max_contest_id,
          is_one_off: contestManager.interval === 0,
          actions: contestManager.actions.map((a) => ({
            action: a.action,
            content_id: a.content_id,
            content_url: a.content_url,
          })),
          chain_url: contestManager.url,
        },
      });
    }),
  );
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
  if (!config.WEB3.PRIVATE_KEY)
    throw new ServerError('WEB3 private key not set!');

  const activeContestManagersPassedEndTime = await models.sequelize.query<{
    eth_chain_id: number;
    contest_address: string;
    interval: number;
    prize_percentage: number;
    payout_structure: number[];
    contest_id: number;
    url: string;
    private_url: string;
  }>(
    `
SELECT
  cn.eth_chain_id,
  cm.contest_address,
  cm.interval,
  coalesce(cm.prize_percentage, 0) as prize_percentage,
  cm.payout_structure,
  co.contest_id,
  cn.url,
  cn.private_url,
  cm.environment
FROM
  "ContestManagers" cm
  JOIN (SELECT * FROM "Contests" WHERE (contest_address, contest_id) IN (
      SELECT contest_address, MAX(contest_id) AS contest_id FROM "Contests" GROUP BY contest_address)
  ) co ON co.contest_address = cm.contest_address
    AND ((cm.interval = 0 AND cm.ended IS NOT TRUE) OR cm.interval > 0)
    AND NOW() > co.end_time
    AND cm.cancelled IS NOT TRUE
    AND cm.environment = :environment
  JOIN "Communities" cu ON cm.community_id = cu.id
  JOIN "ChainNodes" cn ON cu.chain_node_id = cn.id;
`,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        environment: config.APP_ENV,
      },
    },
  );

  const promiseResults = await Promise.allSettled(
    activeContestManagersPassedEndTime.map(
      async ({
        eth_chain_id,
        url,
        private_url,
        contest_address,
        contest_id,
        interval,
        prize_percentage,
        payout_structure,
      }) => {
        log.info(`ROLLOVER: ${contest_address}`);
        await command(SetContestEnded(), {
          actor: systemActor({}),
          payload: {
            eth_chain_id,
            contest_address,
            contest_id,
            prize_percentage,
            payout_structure,
            is_one_off: interval === 0,
            chain_url: url,
            chain_private_url: private_url,
          },
        });
      },
    ),
  );
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
