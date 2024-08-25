import {
  Actor,
  AppError,
  InvalidInput,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  BalanceSourceType,
  NotificationCategories,
  renderQuillDeltaToText,
} from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import moment from 'moment';
import { z } from 'zod';
import { Contest, config, models, tokenBalanceCache } from '..';
import { isCommunityAdminOrTopicMember } from '../middleware';
import { verifyThreadSignature } from '../middleware/canvas';
import { mustExist } from '../middleware/guards';
import {
  emitMentions,
  parseUserMentions,
  sanitizeQuillText,
  uniqueMentions,
} from '../utils';

const Errors = {
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

const getActiveContestManagersQuery = Contest.GetActiveContestManagers();

function toPlainString(decodedBody: string) {
  try {
    const quillDoc = JSON.parse(decodedBody);
    if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === '')
      throw new InvalidInput(Errors.NoBody);
    return renderQuillDeltaToText(quillDoc);
  } catch {
    // check always passes if the body isn't a Quill document
  }
  return decodedBody;
}

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
async function checkContestLimits(
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
    throw new AppError(Errors.PostLimitReached);
}

export function CreateThread(): Command<typeof schemas.CreateThread> {
  return {
    ...schemas.CreateThread,
    auth: [
      isCommunityAdminOrTopicMember(schemas.PermissionEnum.CREATE_THREAD),
      verifyThreadSignature,
    ],
    body: async ({ actor, payload }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, community_id, topic_id, kind, url, ...rest } = payload;

      if (kind === 'link' && !url?.trim())
        throw new InvalidInput(Errors.LinkMissingTitleOrUrl);

      const body = sanitizeQuillText(payload.body);
      const plaintext = kind === 'discussion' ? toPlainString(body) : body;
      const mentions = uniqueMentions(parseUserMentions(body));

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
        await checkContestLimits(activeContestManagers, actor.address!);
      }

      // New threads get an empty version history initialized, which is passed
      // the thread's first version, formatted on the frontend with timestamps
      const version_history = [
        JSON.stringify({
          timestamp: moment(),
          author: { id: actor.addressId, address: actor.address },
          body,
        }),
      ];

      // Load membership info (we can optimize this with middleware auth cache)
      const address = await models.Address.findOne({
        where: {
          user_id: actor.user.id,
          community_id,
          address: actor.address,
        },
      });
      if (!mustExist('Community address', address)) return;

      // Thread aggregate mutation is a transaction boundary
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
              version_history,
              view_count: 0,
              comment_count: 0,
              reaction_count: 0,
              reaction_weights_sum: 0,
              max_notif_id: 0,
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
            },
            {
              transaction,
            },
          );

          address.last_active = new Date();
          await address.save({ transaction });

          // TODO: this should be a notification policy
          await emitMentions(models, transaction, {
            authorAddressId: address.id!,
            authorUserId: actor.user.id!,
            authorAddress: address.address,
            mentions: mentions,
            thread,
            community_id: thread.community_id,
          });

          // TODO: check with Tim-> auto-subscribe thread creator to comments & reactions
          await models.Subscription.bulkCreate(
            [
              {
                subscriber_id: actor.user.id!,
                category_id: NotificationCategories.NewComment,
                thread_id: thread.id,
                community_id,
                is_active: true,
              },
              {
                subscriber_id: actor.user.id!,
                category_id: NotificationCategories.NewReaction,
                thread_id: thread.id,
                community_id,
                is_active: true,
              },
            ],
            { transaction },
          );

          return thread.id;
        },
      );

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
