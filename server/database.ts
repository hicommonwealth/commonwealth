import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

import { DATABASE_URI } from './config';

import { factory, formatFilename } from '../shared/logging';

import AddressFactory, { AddressModelStatic } from './models/address';
import BanFactory, { BanModelStatic } from './models/ban';
import ChainFactory, { ChainModelStatic } from './models/chain';
import ChainCategoryFactory, {
  ChainCategoryModelStatic,
} from './models/chain_category';
import ChainCategoryTypeFactory, {
  ChainCategoryTypeModelStatic,
} from './models/chain_category_type';
import ChainEntityFactory, {
  ChainEntityModelStatic,
} from './models/chain_entity';
import ChainEventFactory, { ChainEventModelStatic } from './models/chain_event';
import ChainEventTypeFactory, {
  ChainEventTypeModelStatic,
} from './models/chain_event_type';
import ChainNodeFactory, { ChainNodeModelStatic } from './models/chain_node';
import ChatChannelFactory, { ChatChannelModelStatic } from './models/chat_channel';
import ChatMessageFactory, {
  ChatMessageModelStatic,
} from './models/chat_message';
import CommunityBannerFactory, { CommunityBannerModelStatic } from './models/community_banner';
import CollaborationFactory, {
  CollaborationModelStatic,
} from './models/collaboration';
import ContractCategoryFactory, {
  ContractCategoryModelStatic,
} from './models/contract_category';
import ContractItemFactory, {
  ContractItemModelStatic,
} from './models/contract_item';
import DiscussionDraftFactory, {
  DiscussionDraftModelStatic,
} from './models/discussion_draft';
import IdentityCacheFactory, {
  IdentityCacheStatic,
} from './models/identity_cache';
import InviteCodeFactory, { InviteCodeModelStatic } from './models/invite_code';
import LinkedThread, { LinkedThreadModelStatic } from './models/linked_thread';
import LoginTokenFactory, { LoginTokenModelStatic } from './models/login_token';
import NotificationFactory, {
  NotificationModelStatic,
} from './models/notification';
import NotificationCategoryFactory, {
  NotificationCategoryModelStatic,
} from './models/notification_category';
import OffchainAttachmentFactory, {
  OffchainAttachmentModelStatic,
} from './models/offchain_attachment';
import OffchainCommentFactory, {
  OffchainCommentModelStatic,
} from './models/offchain_comment';
import OffchainProfileFactory, {
  OffchainProfileModelStatic,
} from './models/offchain_profile';
import OffchainReactionFactory, {
  OffchainReactionModelStatic,
} from './models/offchain_reaction';
import OffchainThreadFactory, {
  OffchainThreadModelStatic,
} from './models/offchain_thread';
import OffchainTopicFactory, {
  OffchainTopicModelStatic,
} from './models/offchain_topic';
import OffchainViewCountFactory, {
  OffchainViewCountModelStatic,
} from './models/offchain_viewcount';
import OffchainVoteFactory, {
  OffchainVoteModelStatic,
} from './models/offchain_vote';
import OffchainPollFactory, {
  OffchainPollModelStatic,
} from './models/offchain_poll';
import ProfileFactory, { ProfileModelStatic } from './models/profile';
import RoleFactory, { RoleModelStatic } from './models/role';
import RuleFactory, { RuleModelStatic } from './models/rule';
import SocialAccountFactory, {
  SocialAccountModelStatic,
} from './models/social_account';
import SsoTokenFactory, { SsoTokenModelStatic } from './models/sso_token';
import StarredCommunityFactory, {
  StarredCommunityModelStatic,
} from './models/starred_community';
import SubscriptionFactory, {
  SubscriptionModelStatic,
} from './models/subscription';
import TokenFactory, { TokenModelStatic } from './models/token';
import TaggedThreadFactory, {
  TaggedThreadModelStatic,
} from './models/tagged_threads';
import UserModelFactory, { UserModelStatic } from './models/user';
import WaitlistRegistrationFactory, {
  WaitlistRegistrationModelStatic,
} from './models/waitlist_registration';
import WebhookFactory, { WebhookModelStatic } from './models/webhook';
import NotificationsReadFactory, {
  NotificationsReadModelStatic,
} from './models/notifications_read';
import IpfsPinsFactory, { IpfsPinsModelStatic } from './models/ipfs_pins';

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
