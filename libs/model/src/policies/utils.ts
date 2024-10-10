import { Actor, logger } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { Contest, config, models } from '..';
import { contestHelper } from '../services/commonProtocol';
import { getChainNodeUrl } from '../utils';

const log = logger(import.meta);

export async function createOnchainContestContent(payload: {
  community_id: string;
  topic_id: number;
  content_url: string;
  author_address: string;
}) {
  const activeContestManagers = await Contest.GetActiveContestManagers().body({
    actor: {} as Actor,
    payload: {
      community_id: payload.community_id!,
      topic_id: payload.topic_id,
    },
  });
  if (!activeContestManagers?.length) {
    log.warn('createOnchainContestContent: no matching contest managers found');
    return;
  }

  const chainNodeUrl = activeContestManagers[0]!.url;

  const addressesToProcess = activeContestManagers
    .filter((c) => {
      // if a projection exists with the same content url, don't add it onchain again
      const duplicatePosts = c.actions.filter(
        (action) =>
          action.action === 'added' &&
          action.content_url === payload.content_url,
      );
      if (duplicatePosts.length > 0) {
        log.warn('createContestContent: duplicate content found by url');
        return false;
      }
      // only process contest managers for which
      // the user has not exceeded the post limit
      // on the latest contest
      const userPostsInContest = c.actions.filter(
        (action) =>
          action.actor_address === payload.author_address &&
          action.action === 'added',
      );
      const quotaReached =
        userPostsInContest.length >= config.CONTESTS.MAX_USER_POSTS_PER_CONTEST;
      if (quotaReached) {
        log.warn(
          `createContestContent: user reached post limit for contest ${c.contest_address} (ID ${c.max_contest_id})`,
        );
      }
      return !quotaReached;
    })
    .map((c) => c.contest_address);

  log.debug(
    `createContestContent: addresses to process: ${JSON.stringify(
      addressesToProcess,
      null,
      2,
    )}`,
  );

  const results = await contestHelper.addContentBatch(
    chainNodeUrl!,
    addressesToProcess,
    payload.author_address!,
    payload.content_url,
  );

  const errors = results
    .filter(({ status }) => status === 'rejected')
    .map(
      (result) =>
        (result as PromiseRejectedResult).reason || '<unknown reason>',
    );

  if (errors.length > 0) {
    // TODO: ignore duplicate content error
    throw new Error(`addContent failed with errors: ${errors.join(', ')}"`);
  }
}

export async function createOnchainContestVote(payload: {
  community_id: string;
  topic_id: number;
  content_url: string;
  author_address: string;
}) {
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
            JOIN "ContestTopics" ct ON cm.contest_address = ct.contest_address
            JOIN "Contests" co ON cm.contest_address = co.contest_address
              AND co.contest_id = (
                SELECT MAX(contest_id) AS max_id
                FROM "Contests" c1
                WHERE c1.contest_address = cm.contest_address
              )
            JOIN "ContestActions" added on co.contest_address = added.contest_address
              AND added.content_url = :content_url
              AND added.action = 'added'
            WHERE ct.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
            AND (
              cm.interval = 0 AND NOW() < co.end_time
              OR
              cm.interval > 0
            )
          -- content cannot be a winner in a previous contest
          AND NOT EXISTS (
            WITH max_contest AS (
              SELECT MAX(contest_id) AS max_id
              FROM "Contests" c1
              WHERE c1.contest_address = cm.contest_address
            )
            SELECT c2.score
            FROM "Contests" c2,
                jsonb_array_elements(c2.score) AS score_result
            WHERE
                c2.contest_address = cm.contest_address AND
                (score_result->>'content_id')::int = added.content_id::int AND
                (score_result->>'prize')::float > 0 AND
                c2.contest_id != (SELECT max_id FROM max_contest)
          )
        `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        content_url: payload.content_url!,
        actor_address: payload.author_address,
        topic_id: payload.topic_id,
        community_id: payload.community_id,
      },
    },
  );

  if (!activeContestManagersWithoutVote?.length) {
    // throw to trigger retry in case the content is pending creation
    throw new Error(
      'createOnchainContestVote: no matching active contests without actions',
    );
  }

  const chainNodeUrl = getChainNodeUrl(activeContestManagersWithoutVote[0]!);

  log.debug(
    `createOnchainContestVote: contest managers to process: ${JSON.stringify(
      activeContestManagersWithoutVote,
      null,
      2,
    )}`,
  );

  const results = await contestHelper.voteContentBatch(
    chainNodeUrl!,
    payload.author_address,
    activeContestManagersWithoutVote.map((m) => ({
      contestAddress: m.contest_address,
      contentId: m.content_id.toString(),
    })),
  );

  const errors = results
    .filter(({ status }) => status === 'rejected')
    .map(
      (result) =>
        (result as PromiseRejectedResult).reason || '<unknown reason>',
    );

  if (errors.length > 0) {
    throw new Error(
      `voteContent failed ${errors.length} times: ${errors.join(', ')}"`,
    );
  }
}
