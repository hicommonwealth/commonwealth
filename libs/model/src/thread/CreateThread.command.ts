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

/**
 * Gets sanitized quill body and plaintext for the search indexer
 */
function parseBody({
  body,
  kind,
  url,
}: z.infer<typeof schemas.CreateThread.input>) {
  // TODO: Refactor to simplify - there is some redundant logic in the way quill gets sanitized and plaintext extracted
  const sanitized = sanitizeQuillText(body);
  if (kind === 'discussion') {
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === '')
        throw new InvalidInput(Errors.NoBody);
      const plaintext = (() => {
        try {
          return renderQuillDeltaToText(quillDoc);
        } catch (e) {
          return decodeURIComponent(body);
        }
      })();
      return { body: sanitized, plaintext };
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'link' && !url?.trim())
    throw new InvalidInput(Errors.LinkMissingTitleOrUrl);

  return { body: sanitized, plaintext: decodeURIComponent(body) };
}

async function checkContestLimits(
  community_id: string,
  topic_id: number,
  address: string,
) {
  const activeContestManagers = await Contest.GetActiveContestManagers().body({
    actor: {} as Actor,
    payload: {
      community_id,
      topic_id,
    },
  });

  if (activeContestManagers && activeContestManagers.length > 0) {
    // ensure that user has non-dust ETH value
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

    // ensure post limit not reached on all contests
    const validActiveContests = activeContestManagers.filter((c) => {
      const userPostsInContest = c.actions.filter(
        (action) =>
          action.actor_address === address && action.action === 'added',
      );
      const quotaReached =
        userPostsInContest.length >= config.CONTESTS.MAX_USER_POSTS_PER_CONTEST;
      return !quotaReached;
    });
    if (validActiveContests.length === 0)
      throw new AppError(Errors.PostLimitReached);
  }
}

export function CreateThread(): Command<typeof schemas.CreateThread> {
  return {
    ...schemas.CreateThread,
    auth: [],
    body: async ({ actor, payload }) => {
      // TODO: this should be auth middleware
      //   const isAdmin = await validateOwner({
      //     models: this.models,
      //     user,
      //     communityId: community.id,
      //     allowAdmin: true,
      //     allowSuperAdmin: true,
      //   });
      //   if (!isAdmin) {
      //     const { isValid, message } = await validateTopicGroupsMembership(
      //       this.models,
      //       topicId,
      //       community.id,
      //       address,
      //       PermissionEnum.CREATE_THREAD,
      //     );
      //     if (!isValid) {
      //       throw new AppError(`${Errors.FailedCreateThread}: ${message}`);
      //     }
      //   }

      // TODO: address ban should we part of auth middleware
      // check if banned
      // const [canInteract, banError] = await this.banCache.checkBan({
      //   communityId: community.id,
      //   address: address.address,
      // });
      // if (!canInteract) {
      //   throw new AppError(`Ban error: ${banError}`);
      // }

      const address = actor.address_id!;
      const { community_id, topic_id } = payload;
      const { body, plaintext } = parseBody(payload);
      const mentions = uniqueMentions(parseUserMentions(body));

      await checkContestLimits(community_id, topic_id, actor.address_id!);

      // New threads get an empty version history initialized, which is passed
      // the thread's first version, formatted on the frontend with timestamps
      const version_history = [
        JSON.stringify({
          timestamp: moment(),
          author: actor.address_id!,
          body,
        }),
      ];

      // Thread aggregate mutation is a transaction boundary
      const new_thread_id = await models.sequelize.transaction(
        async (transaction) => {
          const thread = await models.Thread.create(
            {
              ...payload,
              // TODO: address should be resolved by middleware
              address_id: 0, // address.id!,
              body,
              plaintext,
              version_history,
              // TODO: build this... canvas stuff must come from the middleware
              //canvas_signed_data: canvasSignedData,
              //canvas_hash: canvasHash,
              //discord_meta: discordMeta,
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
              address,
              timestamp: thread.created_at!,
            },
            {
              transaction,
            },
          );

          // TODO: address should be resolved by middleware
          //address.last_active = new Date();
          //await address.save({ transaction });

          await emitMentions(models, transaction, {
            // TODO: address should be resolved by middleware
            authorAddressId: 0, // address.id!,
            authorUserId: actor.user.id!,
            authorAddress: address,
            mentions: mentions,
            thread,
            community_id: thread.community_id,
          });

          // auto-subscribe thread creator to comments & reactions
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

      // TODO: move this to middleware
      //   const allNotificationOptions: EmitOptions[] = [];
      //   allNotificationOptions.push({
      //     notification: {
      //       categoryId: NotificationCategories.NewThread,
      //       data: {
      //         created_at: new Date(),
      //         thread_id: finalThread.id,
      //         root_type: ProposalType.Thread,
      //         root_title: finalThread.title,
      //         comment_text: finalThread.body,
      //         community_id: finalThread.community_id,
      //         author_address: finalThread.Address.address,
      //         author_community_id: finalThread.Address.community_id,
      //       },
      //     },
      //     excludeAddresses: [finalThread.Address.address],
      //   });

      //   const analyticsOptions = {
      //     event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
      //     community: community.id,
      //     userId: user.id,
      //   };
    },
  };
}

// TODO: middleware stuff
// export const createThreadHandler = async (
//   controllers: ServerControllers,
//   req: TypedRequestBody<CreateThreadRequestBody>,
//   res: TypedResponse<CreateThreadResponse>,
// ) => {
//   const { user, address, community } = req;

//   const {
//     topic_id: topicId,
//     title,
//     body,
//     kind,
//     stage,
//     url,
//     readOnly,
//     discord_meta,
//   } = req.body;

//   const threadFields: CreateThreadOptions = {
//     user,
//     address,
//     community,
//     title,
//     body,
//     kind,
//     readOnly,
//     topicId: parseInt(topicId, 10) || undefined,
//     stage,
//     url,
//     discordMeta: discord_meta,
//   };

//   if (hasCanvasSignedDataApiArgs(req.body)) {
//     threadFields.canvasSignedData = req.body.canvas_signed_data;
//     threadFields.canvasHash = req.body.canvas_hash;

//     if (config.ENFORCE_SESSION_KEYS) {
//       const { canvasSignedData } = fromCanvasSignedDataApiArgs(req.body);

//       await verifyThread(canvasSignedData, {
//         title,
//         body,
//         address:
//           canvasSignedData.actionMessage.payload.address.split(':')[0] ==
//           'polkadot'
//             ? addressSwapper({
//                 currentPrefix: 42,
//                 // @ts-expect-error <StrictNullChecks>
//                 address: address.address,
//               })
//             : // @ts-expect-error <StrictNullChecks>
//               address.address,
//         // @ts-expect-error <StrictNullChecks>
//         community: community.id,
//         topic: topicId ? parseInt(topicId, 10) : null,
//       });
//     }
//   }
//   const [thread, notificationOptions, analyticsOptions] =
//     await controllers.threads.createThread(threadFields);

//   for (const n of notificationOptions) {
//     controllers.notifications.emit(n).catch(console.error);
//   }

//   controllers.analytics.track(analyticsOptions, req).catch(console.error);

//   return success(res, thread);
// };
