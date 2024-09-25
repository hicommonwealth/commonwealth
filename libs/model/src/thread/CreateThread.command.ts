import {
  Actor,
  AppError,
  InvalidInput,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { z } from 'zod';
import { config } from '../config';
import { GetActiveContestManagers } from '../contest';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { verifyThreadSignature } from '../middleware/canvas';
import { mustBeAuthorized } from '../middleware/guards';
import { getThreadSearchVector } from '../models/thread';
import { tokenBalanceCache } from '../services';
import {
  decodeContent,
  emitMentions,
  parseUserMentions,
  quillToPlain,
  uniqueMentions,
  uploadIfLarge,
} from '../utils';

export const CreateThreadErrors = {
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  ParseMentionsFailed: 'Failed to parse mentions',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only discussion and link posts supported',
  FailedCreateThread: 'Failed to create thread',
  DiscussionMissingTitle: 'Discussion posts must include a title',
  NoBody: 'Thread body cannot be blank',
  PostLimitReached: 'Post limit reached',
};

const getActiveContestManagersQuery = GetActiveContestManagers();

/**
 * Ensure that user has non-dust ETH value
 */
async function checkAddressBalance(
  activeContestManagers: z.infer<typeof getActiveContestManagersQuery.output>,
  address: string,
) {
  const balances = await tokenBalanceCache.getBalances({
    balanceSourceType: BalanceSourceType.ETHNative,
    addresses: [address],
    sourceOptions: {
      evmChainId: activeContestManagers[0]!.eth_chain_id,
    },
    cacheRefresh: true,
  });
  const minUserEthBigNumber = BigNumber.from(
    (config.CONTESTS.MIN_USER_ETH * 1e18).toFixed(),
  );
  if (BigNumber.from(balances[address]).lt(minUserEthBigNumber))
    throw new AppError(
      `user ETH balance insufficient (${balances[address]} of ${minUserEthBigNumber})`,
    );
}

/**
 * Ensure post limit not reached on active contests
 */
function checkContestLimits(
  activeContestManagers: z.infer<typeof getActiveContestManagersQuery.output>,
  address: string,
) {
  const validActiveContests = activeContestManagers.filter((c) => {
    const userPostsInContest = c.actions.filter(
      (action) => action.actor_address === address && action.action === 'added',
    );
    const quotaReached =
      userPostsInContest.length >= config.CONTESTS.MAX_USER_POSTS_PER_CONTEST;
    return !quotaReached;
  });
  if (validActiveContests.length === 0)
    throw new AppError(CreateThreadErrors.PostLimitReached);
}

export function CreateThread(): Command<
  typeof schemas.CreateThread,
  AuthContext
> {
  return {
    ...schemas.CreateThread,
    auth: [
      isAuthorized({ action: schemas.PermissionEnum.CREATE_THREAD }),
      verifyThreadSignature,
    ],
    body: async ({ actor, payload, auth }) => {
      const { address } = mustBeAuthorized(actor, auth);

      const { community_id, topic_id, kind, url, ...rest } = payload;

      if (kind === 'link' && !url?.trim())
        throw new InvalidInput(CreateThreadErrors.LinkMissingTitleOrUrl);

      // check contest invariants
      const activeContestManagers = await getActiveContestManagersQuery.body({
        actor: {} as Actor,
        payload: {
          community_id,
          topic_id,
        },
      });
      if (activeContestManagers && activeContestManagers.length > 0) {
        await checkAddressBalance(activeContestManagers, actor.address!);
        checkContestLimits(activeContestManagers, actor.address!);
      }

      const body = decodeContent(payload.body);
      const plaintext = kind === 'discussion' ? quillToPlain(body) : body;
      const mentions = uniqueMentions(parseUserMentions(body));

      const { contentUrl } = await uploadIfLarge('threads', body);

      // == mutation transaction boundary ==
      const new_thread_id = await models.sequelize.transaction(
        async (transaction) => {
          const thread = await models.Thread.create(
            {
              ...rest,
              community_id,
              address_id: address.id!,
              topic_id,
              kind,
              body,
              plaintext,
              view_count: 0,
              comment_count: 0,
              reaction_count: 0,
              reaction_weights_sum: 0,
              search: getThreadSearchVector(rest.title, body),
              content_url: contentUrl,
            },
            {
              transaction,
            },
          );

          await models.ThreadVersionHistory.create(
            {
              thread_id: thread.id!,
              body,
              address: address.address,
              timestamp: thread.created_at!,
              content_url: contentUrl,
            },
            {
              transaction,
            },
          );

          await models.ThreadSubscription.create(
            {
              user_id: actor.user.id!,
              thread_id: thread.id!,
            },
            { transaction },
          );

          mentions.length &&
            (await emitMentions(models, transaction, {
              authorAddressId: address.id!,
              authorUserId: actor.user.id!,
              authorAddress: address.address,
              mentions: mentions,
              thread,
              community_id: thread.community_id,
            }));

          return thread.id;
        },
      );
      // == end of transaction boundary ==

      const thread = await models.Thread.findOne({
        where: { id: new_thread_id },
        include: [
          { model: models.Address, as: 'Address' },
          { model: models.Topic, as: 'topic' },
        ],
      });
      return thread!.toJSON();
    },
  };
}
