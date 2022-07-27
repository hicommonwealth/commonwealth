import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

import { DATABASE_URI } from './config';

import { factory, formatFilename } from 'common-common/src/logging';

import AddressFactory, { AddressModelStatic } from 'common-common/src/models/address';
import BanFactory, { BanModelStatic } from 'common-common/src/models/ban';
import ChainFactory, { ChainModelStatic } from 'common-common/src/models/chain';
import ChainCategoryFactory, {
  ChainCategoryModelStatic,
} from 'common-common/src/models/chain_category';
import ChainCategoryTypeFactory, {
  ChainCategoryTypeModelStatic,
} from 'common-common/src/models/chain_category_type';
import ChainEntityFactory, {
  ChainEntityModelStatic,
} from 'common-common/src/models/chain_entity';
import ChainEventFactory, { ChainEventModelStatic } from 'common-common/src/models/chain_event';
import ChainEventTypeFactory, {
  ChainEventTypeModelStatic,
} from 'common-common/src/models/chain_event_type';
import ChainNodeFactory, { ChainNodeModelStatic } from 'common-common/src/models/chain_node';
import ChatChannelFactory, { ChatChannelModelStatic } from 'common-common/src/models/chat_channel';
import ChatMessageFactory, {
  ChatMessageModelStatic,
} from 'common-common/src/models/chat_message';
import CommunityBannerFactory, { CommunityBannerModelStatic } from 'common-common/src/models/community_banner';
import CollaborationFactory, {
  CollaborationModelStatic,
} from 'common-common/src/models/collaboration';
import ContractCategoryFactory, {
  ContractCategoryModelStatic,
} from 'common-common/src/models/contract_category';
import ContractItemFactory, {
  ContractItemModelStatic,
} from 'common-common/src/models/contract_item';
import DiscussionDraftFactory, {
  DiscussionDraftModelStatic,
} from 'common-common/src/models/discussion_draft';
import IdentityCacheFactory, {
  IdentityCacheStatic,
} from 'common-common/src/models/identity_cache';
import InviteCodeFactory, { InviteCodeModelStatic } from 'common-common/src/models/invite_code';
import LinkedThread, { LinkedThreadModelStatic } from 'common-common/src/models/linked_thread';
import LoginTokenFactory, { LoginTokenModelStatic } from 'common-common/src/models/login_token';
import NotificationFactory, {
  NotificationModelStatic,
} from 'common-common/src/models/notification';
import NotificationCategoryFactory, {
  NotificationCategoryModelStatic,
} from 'common-common/src/models/notification_category';
import OffchainAttachmentFactory, {
  OffchainAttachmentModelStatic,
} from 'common-common/src/models/offchain_attachment';
import OffchainCommentFactory, {
  OffchainCommentModelStatic,
} from 'common-common/src/models/offchain_comment';
import OffchainProfileFactory, {
  OffchainProfileModelStatic,
} from 'common-common/src/models/offchain_profile';
import OffchainReactionFactory, {
  OffchainReactionModelStatic,
} from 'common-common/src/models/offchain_reaction';
import OffchainThreadFactory, {
  OffchainThreadModelStatic,
} from 'common-common/src/models/offchain_thread';
import OffchainTopicFactory, {
  OffchainTopicModelStatic,
} from 'common-common/src/models/offchain_topic';
import OffchainViewCountFactory, {
  OffchainViewCountModelStatic,
} from 'common-common/src/models/offchain_viewcount';
import OffchainVoteFactory, {
  OffchainVoteModelStatic,
} from 'common-common/src/models/offchain_vote';
import OffchainPollFactory, {
  OffchainPollModelStatic,
} from 'common-common/src/models/offchain_poll';
import ProfileFactory, { ProfileModelStatic } from 'common-common/src/models/profile';
import RoleFactory, { RoleModelStatic } from 'common-common/src/models/role';
import RuleFactory, { RuleModelStatic } from 'common-common/src/models/rule';
import SocialAccountFactory, {
  SocialAccountModelStatic,
} from 'common-common/src/models/social_account';
import SsoTokenFactory, { SsoTokenModelStatic } from 'common-common/src/models/sso_token';
import StarredCommunityFactory, {
  StarredCommunityModelStatic,
} from 'common-common/src/models/starred_community';
import SubscriptionFactory, {
  SubscriptionModelStatic,
} from 'common-common/src/models/subscription';
import TokenFactory, { TokenModelStatic } from 'common-common/src/models/token';
import TaggedThreadFactory, {
  TaggedThreadModelStatic,
} from 'common-common/src/models/tagged_threads';
import UserModelFactory, { UserModelStatic } from 'common-common/src/models/user';
import WaitlistRegistrationFactory, {
  WaitlistRegistrationModelStatic,
} from 'common-common/src/models/waitlist_registration';
import WebhookFactory, { WebhookModelStatic } from 'common-common/src/models/webhook';
import NotificationsReadFactory, {
  NotificationsReadModelStatic,
} from 'common-common/src/models/notifications_read';
import IpfsPinsFactory, { IpfsPinsModelStatic } from 'common-common/src/models/ipfs_pins';

export type Models = {
  Address: AddressModelStatic;
  Ban: BanModelStatic;
  Chain: ChainModelStatic;
  ChainCategory: ChainCategoryModelStatic;
  ChainCategoryType: ChainCategoryTypeModelStatic;
  ChainEntity: ChainEntityModelStatic;
  ChainEvent: ChainEventModelStatic;
  ChainEventType: ChainEventTypeModelStatic;
  ChainNode: ChainNodeModelStatic;
  ChatChannel: ChatChannelModelStatic;
  ChatMessage: ChatMessageModelStatic;
  Collaboration: CollaborationModelStatic;
  CommunityBanner: CommunityBannerModelStatic;
  ContractCategory: ContractCategoryModelStatic;
  ContractItem: ContractItemModelStatic;
  DiscussionDraft: DiscussionDraftModelStatic;
  IdentityCache: IdentityCacheStatic;
  InviteCode: InviteCodeModelStatic;
  IpfsPins: IpfsPinsModelStatic;
  LinkedThread: LinkedThreadModelStatic;
  LoginToken: LoginTokenModelStatic;
  Notification: NotificationModelStatic;
  NotificationCategory: NotificationCategoryModelStatic;
  NotificationsRead: NotificationsReadModelStatic;
  OffchainAttachment: OffchainAttachmentModelStatic;
  OffchainComment: OffchainCommentModelStatic;
  OffchainPoll: OffchainPollModelStatic;
  OffchainProfile: OffchainProfileModelStatic;
  OffchainReaction: OffchainReactionModelStatic;
  OffchainThread: OffchainThreadModelStatic;
  OffchainTopic: OffchainTopicModelStatic;
  OffchainViewCount: OffchainViewCountModelStatic;
  OffchainVote: OffchainVoteModelStatic;
  Profile: ProfileModelStatic;
  Role: RoleModelStatic;
  Rule: RuleModelStatic;
  SocialAccount: SocialAccountModelStatic;
  SsoToken: SsoTokenModelStatic;
  StarredCommunity: StarredCommunityModelStatic;
  Subscription: SubscriptionModelStatic;
  Token: TokenModelStatic;
  TaggedThread: TaggedThreadModelStatic;
  User: UserModelStatic;
  WaitlistRegistration: WaitlistRegistrationModelStatic;
  Webhook: WebhookModelStatic;
};

export interface DB extends Models {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

const log = factory.getLogger(formatFilename(__filename));

export const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging:
    process.env.NODE_ENV === 'test'
      ? false
      : (msg) => {
          log.trace(msg);
        },
  dialectOptions:
    process.env.NODE_ENV !== 'production'
      ? {
          requestTimeout: 40000,
        }
      : {
          requestTimeout: 40000,
          ssl: { rejectUnauthorized: false },
        },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});

export const Address = AddressFactory(sequelize, DataTypes);
const models: Models = {
  Address: AddressFactory(sequelize, DataTypes),
  Ban: BanFactory(sequelize, DataTypes),
  Chain: ChainFactory(sequelize, DataTypes),
  ChainCategory: ChainCategoryFactory(sequelize, DataTypes),
  ChainCategoryType: ChainCategoryTypeFactory(sequelize, DataTypes),
  ChainEntity: ChainEntityFactory(sequelize, DataTypes),
  ChainEvent: ChainEventFactory(sequelize, DataTypes),
  ChainEventType: ChainEventTypeFactory(sequelize, DataTypes),
  ChainNode: ChainNodeFactory(sequelize, DataTypes),
  ChatChannel: ChatChannelFactory(sequelize, DataTypes),
  ChatMessage: ChatMessageFactory(sequelize, DataTypes),
  Collaboration: CollaborationFactory(sequelize, DataTypes),
  CommunityBanner: CommunityBannerFactory(sequelize, DataTypes),
  ContractCategory: ContractCategoryFactory(sequelize, DataTypes),
  ContractItem: ContractItemFactory(sequelize, DataTypes),
  DiscussionDraft: DiscussionDraftFactory(sequelize, DataTypes),
  IdentityCache: IdentityCacheFactory(sequelize, DataTypes),
  InviteCode: InviteCodeFactory(sequelize, DataTypes),
  IpfsPins: IpfsPinsFactory(sequelize, DataTypes),
  LinkedThread: LinkedThread(sequelize, DataTypes),
  LoginToken: LoginTokenFactory(sequelize, DataTypes),
  Notification: NotificationFactory(sequelize, DataTypes),
  NotificationCategory: NotificationCategoryFactory(sequelize, DataTypes),
  NotificationsRead: NotificationsReadFactory(sequelize, DataTypes),
  OffchainAttachment: OffchainAttachmentFactory(sequelize, DataTypes),
  OffchainComment: OffchainCommentFactory(sequelize, DataTypes),
  OffchainPoll: OffchainPollFactory(sequelize, DataTypes),
  OffchainProfile: OffchainProfileFactory(sequelize, DataTypes),
  OffchainReaction: OffchainReactionFactory(sequelize, DataTypes),
  OffchainThread: OffchainThreadFactory(sequelize, DataTypes),
  OffchainTopic: OffchainTopicFactory(sequelize, DataTypes),
  OffchainViewCount: OffchainViewCountFactory(sequelize, DataTypes),
  OffchainVote: OffchainVoteFactory(sequelize, DataTypes),
  Profile: ProfileFactory(sequelize, DataTypes),
  Role: RoleFactory(sequelize, DataTypes),
  Rule: RuleFactory(sequelize, DataTypes),
  SocialAccount: SocialAccountFactory(sequelize, DataTypes),
  SsoToken: SsoTokenFactory(sequelize, DataTypes),
  StarredCommunity: StarredCommunityFactory(sequelize, DataTypes),
  Subscription: SubscriptionFactory(sequelize, DataTypes),
  Token: TokenFactory(sequelize, DataTypes),
  TaggedThread: TaggedThreadFactory(sequelize, DataTypes),
  User: UserModelFactory(sequelize, DataTypes),
  WaitlistRegistration: WaitlistRegistrationFactory(sequelize, DataTypes),
  Webhook: WebhookFactory(sequelize, DataTypes),
};

const db: DB = {
  sequelize,
  Sequelize,
  ...models,
};

// setup associations
Object.keys(models).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

export default db;
