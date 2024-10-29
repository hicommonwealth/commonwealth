import { logger } from '@hicommonwealth/core';
import { ContestAction } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { config } from '..';
import { contestHelper } from '../services/commonProtocol';

const log = logger(import.meta);

export async function createOnchainContestContent(payload: {
  contestManagers: Array<{
    url: string;
    contest_address: string;
    actions: Array<z.infer<typeof ContestAction>>;
  }>;
  bypass_quota: boolean;
  content_url: string;
  author_address: string;
}) {
  const addressesToProcess = payload.contestManagers
    .filter((c) => {
      if (payload.bypass_quota) {
        return true;
      }
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
          `createContestContent: user reached post limit for contest ${c.contest_address}`,
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
    payload.contestManagers[0].url,
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
    throw new Error(`addContent failed with errors: ${errors.join(', ')}"`);
  }
}

export async function createOnchainContestVote(payload: {
  contestManagers: Array<{
    url: string;
    contest_address: string;
    content_id: number;
  }>;
  content_url: string;
  author_address: string;
}) {
  log.debug(
    `createOnchainContestVote: contest managers to process: ${JSON.stringify(
      payload.contestManagers,
      null,
      2,
    )}`,
  );

  const results = await contestHelper.voteContentBatch(
    payload.contestManagers[0].url,
    payload.author_address,
    payload.contestManagers.map((m) => ({
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
