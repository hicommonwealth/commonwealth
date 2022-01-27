import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

import { DATABASE_URI } from './config';

import { factory, formatFilename } from '../shared/logging';

import AddressFactory, { AddressModelStatic } from './models/address';
import ChainFactory, { ChainModelStatic } from './models/chain';
import ChainEntityFactory, {
  ChainEntityModelStatic,
} from './models/chain_entity';
import ChainEventFactory, { ChainEventModelStatic } from './models/chain_event';
import ChainEventTypeFactory, {
  ChainEventTypeModelStatic,
} from './models/chain_event_type';
import ChainNodeFactory, { ChainNodeModelStatic } from './models/chain_node';
import ChatMessageFactory, {
  ChatMessageModelStatic,
} from './models/chat_message';
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
import EdgewareLockdropBalanceFactory, {
  EdgewareLockdropBalanceModelStatic,
} from './models/edgeware_lockdrop_balance';
import EdgewareLockdropEventFactory, {
  EdgewareLockdropEventModelStatic,
} from './models/edgeware_lockdrop_event';
import EdgewareLockdropEverythingFactory, {
  EdgewareLockdropEverythingModelStatic,
} from './models/edgeware_lockdrop_everything';
import HedgehogAuthenticationFactory, {
  HedgehogAuthenticationModelStatic,
} from './models/hedgehog_authentication';
import HedgehogUserFactory, {
  HedgehogUserModelStatic,
} from './models/hedgehog_user';
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
import ProfileFactory, { ProfileModelStatic } from './models/profile';
import RoleFactory, { RoleModelStatic } from './models/role';
import SocialAccountFactory, {
  SocialAccountModelStatic,
} from './models/social_account';
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
import NotificationsReadFactory, { NotificationsReadModelStatic } from './models/notifications_read';

export type Models = {
  Address: AddressModelStatic;
  Chain: ChainModelStatic;
  ChainEntity: ChainEntityModelStatic;
  ChainEvent: ChainEventModelStatic;
  ChainEventType: ChainEventTypeModelStatic;
  ChainNode: ChainNodeModelStatic;
  ChatMessage: ChatMessageModelStatic;
  Collaboration: CollaborationModelStatic;
  ContractCategory: ContractCategoryModelStatic;
  ContractItem: ContractItemModelStatic;
  DiscussionDraft: DiscussionDraftModelStatic;
  EdgewareLockdropBalance: EdgewareLockdropBalanceModelStatic;
  EdgewareLockdropEvent: EdgewareLockdropEventModelStatic;
  EdgewareLockdropEverything: EdgewareLockdropEverythingModelStatic;
  HedgehogAuthentication: HedgehogAuthenticationModelStatic;
  HedgehogUser: HedgehogUserModelStatic;
  IdentityCache: IdentityCacheStatic;
  InviteCode: InviteCodeModelStatic;
  LinkedThread: LinkedThreadModelStatic;
  LoginToken: LoginTokenModelStatic;
  Notification: NotificationModelStatic;
  NotificationCategory: NotificationCategoryModelStatic;
  NotificationsRead: NotificationsReadModelStatic;
  OffchainAttachment: OffchainAttachmentModelStatic;
  OffchainComment: OffchainCommentModelStatic;
  OffchainProfile: OffchainProfileModelStatic;
  OffchainReaction: OffchainReactionModelStatic;
  OffchainThread: OffchainThreadModelStatic;
  OffchainTopic: OffchainTopicModelStatic;
  OffchainViewCount: OffchainViewCountModelStatic;
  OffchainVote: OffchainVoteModelStatic;
  Profile: ProfileModelStatic;
  Role: RoleModelStatic;
  SocialAccount: SocialAccountModelStatic;
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
  Chain: ChainFactory(sequelize, DataTypes),
  ChainEntity: ChainEntityFactory(sequelize, DataTypes),
  ChainEvent: ChainEventFactory(sequelize, DataTypes),
  ChainEventType: ChainEventTypeFactory(sequelize, DataTypes),
  ChainNode: ChainNodeFactory(sequelize, DataTypes),
  ChatMessage: ChatMessageFactory(sequelize, DataTypes),
  Collaboration: CollaborationFactory(sequelize, DataTypes),
  ContractCategory: ContractCategoryFactory(sequelize, DataTypes),
  ContractItem: ContractItemFactory(sequelize, DataTypes),
  DiscussionDraft: DiscussionDraftFactory(sequelize, DataTypes),
  EdgewareLockdropBalance: EdgewareLockdropBalanceFactory(sequelize, DataTypes),
  EdgewareLockdropEvent: EdgewareLockdropEventFactory(sequelize, DataTypes),
  EdgewareLockdropEverything: EdgewareLockdropEverythingFactory(
    sequelize,
    DataTypes
  ),
  HedgehogAuthentication: HedgehogAuthenticationFactory(sequelize, DataTypes),
  HedgehogUser: HedgehogUserFactory(sequelize, DataTypes),
  IdentityCache: IdentityCacheFactory(sequelize, DataTypes),
  InviteCode: InviteCodeFactory(sequelize, DataTypes),
  LinkedThread: LinkedThread(sequelize, DataTypes),
  LoginToken: LoginTokenFactory(sequelize, DataTypes),
  Notification: NotificationFactory(sequelize, DataTypes),
  NotificationCategory: NotificationCategoryFactory(sequelize, DataTypes),
  NotificationsRead: NotificationsReadFactory(sequelize, DataTypes),
  OffchainAttachment: OffchainAttachmentFactory(sequelize, DataTypes),
  OffchainComment: OffchainCommentFactory(sequelize, DataTypes),
  OffchainProfile: OffchainProfileFactory(sequelize, DataTypes),
  OffchainReaction: OffchainReactionFactory(sequelize, DataTypes),
  OffchainThread: OffchainThreadFactory(sequelize, DataTypes),
  OffchainTopic: OffchainTopicFactory(sequelize, DataTypes),
  OffchainViewCount: OffchainViewCountFactory(sequelize, DataTypes),
  OffchainVote: OffchainVoteFactory(sequelize, DataTypes),
  Profile: ProfileFactory(sequelize, DataTypes),
  Role: RoleFactory(sequelize, DataTypes),
  SocialAccount: SocialAccountFactory(sequelize, DataTypes),
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
