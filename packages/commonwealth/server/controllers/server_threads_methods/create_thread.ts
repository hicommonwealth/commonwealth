import moment from 'moment';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { UserInstance } from '../../models/user';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ThreadAttributes } from '../../models/thread';
import { TrackOptions } from '../server_analytics_methods/track';
import { getThreadUrl, renderQuillDeltaToText } from '../../../shared/utils';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
  ProposalType,
} from '../../../../common-common/src/types';
import { findAllRoles } from '../../util/roles';
import validateTopicThreshold from '../../util/validateTopicThreshold';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { AppError } from '../../../../common-common/src/errors';
import { parseUserMentions } from '../../util/parseUserMentions';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';

export const Errors = {
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  ParseMentionsFailed: 'Failed to parse mentions',
  NoBodyOrAttachments: 'Discussion posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only discussion and link posts supported',
  FailedCreateThread: 'Failed to create thread',
  DiscussionMissingTitle: 'Discussion posts must include a title',
};

export type CreateThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  title: string;
  body: string;
  kind: string;
  readOnly: boolean;
  topicId?: number;
  topicName?: string;
  stage?: string;
  url?: string;
  attachments?: any;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type CreateThreadResult = [
  ThreadAttributes,
  EmitOptions[],
  TrackOptions
];

export async function __createThread({
  user,
  address,
  chain,
  title,
  body,
  kind,
  readOnly,
  topicId,
  topicName,
  stage,
  url,
  attachments,
  canvasAction,
  canvasSession,
  canvasHash,
}): Promise<CreateThreadResult> {
  if (kind === 'discussion') {
    if (!title || !title.trim()) {
      throw new Error(Errors.DiscussionMissingTitle);
    }
    if (
      (!body || !body.trim()) &&
      (!attachments['attachments[]'] ||
        attachments['attachments[]'].length === 0)
    ) {
      throw new Error(Errors.NoBodyOrAttachments);
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (
        quillDoc.ops.length === 1 &&
        quillDoc.ops[0].insert.trim() === '' &&
        (!attachments || attachments.length === 0)
      ) {
        throw new Error(Errors.NoBodyOrAttachments);
      }
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'link') {
    if (!title?.trim() || !url?.trim()) {
      throw new Error(Errors.LinkMissingTitleOrUrl);
    }
  } else {
    throw new Error(Errors.UnsupportedKind);
  }

  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    chain: chain.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new Error(`Ban error: ${banError}`);
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
    chain: chain.id,
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
  };

  // begin essential database changes within transaction
  const newThreadId = await this.models.sequelize.transaction(
    async (transaction) => {
      // New Topic table entries created
      if (topicId) {
        threadContent.topic_id = +topicId;
      } else if (topicName) {
        const [topic] = await this.models.Topic.findOrCreate({
          where: {
            name: topicName,
            chain_id: chain?.id || null,
          },
          transaction,
        });
        threadContent.topic_id = topic.id;
        topicId = topic.id;
      } else {
        if (chain.topics?.length) {
          throw new Error(
            'Must pass a topic_name string and/or a numeric topic_id'
          );
        }
      }

      if (
        chain &&
        (chain.type === ChainType.Token ||
          chain.network === ChainNetwork.Ethereum)
      ) {
        // skip check for admins
        const isAdmin = await findAllRoles(
          this.models,
          { where: { address_id: address.id } },
          chain.id,
          ['admin']
        );
        if (!user.isAdmin && isAdmin.length === 0) {
          let canReact;
          try {
            canReact = await validateTopicThreshold(
              this.tokenBalanceCache,
              this.models,
              topicId,
              address.address
            );
          } catch (e) {
            throw new ServerError(Errors.BalanceCheckFailed, e);
          }

          if (!canReact) {
            throw new AppError(Errors.InsufficientTokenBalance);
          }
        }
      }

      const thread = await this.models.Thread.create(threadContent, {
        transaction,
      });
      if (attachments && typeof attachments === 'string') {
        await this.models.Attachment.create(
          {
            attachable: 'thread',
            attachment_id: thread.id,
            url: attachments,
            description: 'image',
          },
          { transaction }
        );
      } else if (attachments) {
        const data = [];
        attachments.map((u) => {
          data.push({
            attachable: 'thread',
            attachment_id: thread.id,
            url: u,
            description: 'image',
          });
        });
        await this.models.Attachment.bulkCreate(data, { transaction });
      }

      address.last_active = new Date();
      await address.save({ transaction });

      return thread.id;
      // end of transaction
    }
  );

  const finalThread = await this.models.Thread.findOne({
    where: { id: newThreadId },
    include: [
      { model: this.models.Address, as: 'Address' },
      this.models.Attachment,
      { model: this.models.Topic, as: 'topic' },
    ],
  });

  // exit early on error, do not emit notifications
  if (!finalThread) {
    throw new Error(Errors.FailedCreateThread);
  }

  // -----

  // auto-subscribe thread creator to comments & reactions
  await this.models.Subscription.create({
    subscriber_id: user.id,
    category_id: NotificationCategories.NewComment,
    object_id: `discussion_${finalThread.id}`,
    offchain_thread_id: finalThread.id,
    chain_id: finalThread.chain,
    is_active: true,
  });
  await this.models.Subscription.create({
    subscriber_id: user.id,
    category_id: NotificationCategories.NewReaction,
    object_id: `discussion_${finalThread.id}`,
    offchain_thread_id: finalThread.id,
    chain_id: finalThread.chain,
    is_active: true,
  });

  // auto-subscribe NewThread subscribers to NewComment as well
  // findOrCreate because redundant creation if author is also subscribed to NewThreads
  const location = finalThread.chain;
  try {
    await this.models.sequelize.query(
      `
    WITH irrelevant_subs AS (
      SELECT id
      FROM "Subscriptions"
      WHERE subscriber_id IN (
        SELECT subscriber_id FROM "Subscriptions" WHERE category_id = ? AND object_id = ?
      ) AND category_id = ? AND object_id = ? AND offchain_thread_id = ? AND chain_id = ? AND is_active = true
    )
    INSERT INTO "Subscriptions"
    (subscriber_id, category_id, object_id, offchain_thread_id, chain_id, is_active, created_at, updated_at)
    SELECT subscriber_id, ? as category_id, ? as object_id, ? as offchain_thread_id, ? as
     chain_id, true as is_active, NOW() as created_at, NOW() as updated_at
    FROM "Subscriptions"
    WHERE category_id = ? AND object_id = ? AND id NOT IN (SELECT id FROM irrelevant_subs);
  `,
      {
        raw: true,
        type: 'RAW',
        replacements: [
          NotificationCategories.NewThread,
          location,
          NotificationCategories.NewComment,
          `discussion_${finalThread.id}`,
          finalThread.id,
          finalThread.chain,
          NotificationCategories.NewComment,
          `discussion_${finalThread.id}`,
          finalThread.id,
          finalThread.chain,
          NotificationCategories.NewThread,
          location,
        ],
      }
    );
  } catch (e) {
    console.log(e);
  }

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
              chain: mention[0] || null,
              address: mention[1] || null,
            },
            include: [this.models.User],
          });
        })
      );
      // filter null results
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    throw new Error(Errors.ParseMentionsFailed);
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalThread.Address.address);

  // dispatch notifications to subscribers of the given chain
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    categoryId: NotificationCategories.NewThread,
    objectId: location,
    notificationData: {
      created_at: new Date(),
      thread_id: finalThread.id,
      root_type: ProposalType.Thread,
      root_title: finalThread.title,
      comment_text: finalThread.body,
      chain_id: finalThread.chain,
      author_address: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
    },
    webhookData: {
      user: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
      url: getThreadUrl(finalThread),
      title: title,
      bodyUrl: url,
      chain: finalThread.chain,
      body: finalThread.body,
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
        categoryId: NotificationCategories.NewMention,
        objectId: `user-${mentionedAddress.User.id}`,
        notificationData: {
          created_at: new Date(),
          thread_id: finalThread.id,
          root_type: ProposalType.Thread,
          root_title: finalThread.title,
          comment_text: finalThread.body,
          chain_id: finalThread.chain,
          author_address: finalThread.Address.address,
          author_chain: finalThread.Address.chain,
        },
        webhookData: null,
        excludeAddresses: [finalThread.Address.address],
      });
    });

  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
    community: chain.id,
    isCustomDomain: null,
  };

  return [finalThread.toJSON(), allNotificationOptions, analyticsOptions];
}
