import moment from 'moment';

import { AppError } from '@hicommonwealth/adapters';
import { NotificationCategories, ProposalType } from '@hicommonwealth/core';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { renderQuillDeltaToText } from '../../../shared/utils';
import { AddressInstance } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { ThreadAttributes } from '../../models/thread';
import { UserInstance } from '../../models/user';
import { parseUserMentions } from '../../util/parseUserMentions';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_methods/track';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  ParseMentionsFailed: 'Failed to parse mentions',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only discussion and link posts supported',
  FailedCreateThread: 'Failed to create thread',
  DiscussionMissingTitle: 'Discussion posts must include a title',
  NoBody: 'Thread body cannot be blank',
};

export type CreateThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  community: CommunityInstance;
  title: string;
  body: string;
  kind: string;
  readOnly: boolean;
  topicId?: number;
  stage?: string;
  url?: string;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
  discordMeta?: any;
};

export type CreateThreadResult = [
  ThreadAttributes,
  EmitOptions[],
  TrackOptions,
];

export async function __createThread(
  this: ServerThreadsController,
  {
    user,
    address,
    community,
    title,
    body,
    kind,
    readOnly,
    topicId,
    stage,
    url,
    canvasAction,
    canvasSession,
    canvasHash,
    discordMeta,
  }: CreateThreadOptions,
): Promise<CreateThreadResult> {
  if (kind === 'discussion') {
    if (!title || !title.trim()) {
      throw new AppError(Errors.DiscussionMissingTitle);
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === '') {
        throw new AppError(Errors.NoBody);
      }
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'link') {
    if (!title?.trim() || !url?.trim()) {
      throw new AppError(Errors.LinkMissingTitleOrUrl);
    }
  } else {
    throw new AppError(Errors.UnsupportedKind);
  }

  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: community.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`Ban error: ${banError}`);
  }

  // Render a copy of the thread to plaintext for the search indexer
  const plaintext = (() => {
    try {
      return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
    } catch (e) {
      return decodeURIComponent(body);
    }
  })();

  // New threads get an empty version history initialized, which is passed
  // the thread's first version, formatted on the frontend with timestamps
  const firstVersion: any = {
    timestamp: moment(),
    author: address,
    body: decodeURIComponent(body),
  };
  const version_history: string[] = [JSON.stringify(firstVersion)];

  const threadContent: Partial<ThreadAttributes> = {
    community_id: community.id,
    address_id: address.id,
    title,
    body,
    plaintext,
    version_history,
    kind,
    stage,
    url,
    read_only: readOnly,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
    discord_meta: discordMeta,
    topic_id: +topicId,
  };

  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: community.id,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    const { isValid, message } = await validateTopicGroupsMembership(
      this.models,
      this.tokenBalanceCache,
      topicId,
      community,
      address,
    );
    if (!isValid) {
      throw new AppError(`${Errors.FailedCreateThread}: ${message}`);
    }
  }

  // begin essential database changes within transaction
  const newThreadId = await this.models.sequelize.transaction(
    async (transaction) => {
      const thread = await this.models.Thread.create(threadContent, {
        transaction,
      });

      address.last_active = new Date();
      await address.save({ transaction });

      return thread.id;
      // end of transaction
    },
  );

  const finalThread = await this.models.Thread.findOne({
    where: { id: newThreadId },
    include: [
      { model: this.models.Address, as: 'Address' },
      { model: this.models.Topic, as: 'topic' },
    ],
  });

  // exit early on error, do not emit notifications
  if (!finalThread) {
    throw new AppError(Errors.FailedCreateThread);
  }

  // -----

  // auto-subscribe thread creator to comments & reactions
  await this.models.Subscription.bulkCreate([
    {
      subscriber_id: user.id,
      category_id: NotificationCategories.NewComment,
      thread_id: finalThread.id,
      community_id: finalThread.community_id,
      is_active: true,
    },
    {
      subscriber_id: user.id,
      category_id: NotificationCategories.NewReaction,
      thread_id: finalThread.id,
      community_id: finalThread.community_id,
      is_active: true,
    },
  ]);

  // grab mentions to notify tagged users
  const bodyText = decodeURIComponent(body);
  let mentionedAddresses;
  try {
    const mentions = parseUserMentions(bodyText);
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(
        mentions.map(async (mention) => {
          return this.models.Address.findOne({
            where: {
              community_id: mention[0] || null,
              address: mention[1] || null,
            },
            include: [this.models.User],
          });
        }),
      );
      // filter null results
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    throw new AppError(Errors.ParseMentionsFailed);
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalThread.Address.address);

  // dispatch notifications to subscribers of the given chain
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.NewThread,
      data: {
        created_at: new Date(),
        thread_id: finalThread.id,
        root_type: ProposalType.Thread,
        root_title: finalThread.title,
        comment_text: finalThread.body,
        chain_id: finalThread.community_id,
        author_address: finalThread.Address.address,
        author_chain: finalThread.Address.community_id,
      },
    },
    excludeAddresses: excludedAddrs,
  });

  // notify mentioned users, given permissions are in place
  if (mentionedAddresses?.length > 0)
    mentionedAddresses.forEach((mentionedAddress) => {
      if (!mentionedAddress.User) {
        return; // some Addresses may be missing users, e.g. if the user removed the address
      }
      allNotificationOptions.push({
        notification: {
          categoryId: NotificationCategories.NewMention,
          data: {
            mentioned_user_id: mentionedAddress.User.id,
            created_at: new Date(),
            thread_id: finalThread.id,
            root_type: ProposalType.Thread,
            root_title: finalThread.title,
            comment_text: finalThread.body,
            chain_id: finalThread.community_id,
            author_address: finalThread.Address.address,
            author_chain: finalThread.Address.community_id,
          },
        },
        excludeAddresses: [finalThread.Address.address],
      });
    });

  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
    community: community.id,
    userId: user.id,
  };

  return [finalThread.toJSON(), allNotificationOptions, analyticsOptions];
}
