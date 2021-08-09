import { Sequelize } from 'sequelize';

import { DATABASE_URI } from './config';

import { factory, formatFilename } from '../shared/logging';

import AddressFactory from './models/address';
import ChainFactory from './models/chain';
import ChainEntityFactory from './models/chain_entity';
import ChainEventFactory from './models/chain_event';
import ChainEventTypeFactory from './models/chain_event_type';
import ChainNodeFactory from './models/chain_node';
import ChatMessageFactory from './models/chat_message';
import CollaborationFactory from './models/collaboration';
import ContractCategoryFactory from './models/contract_category';
import ContractItemFactory from './models/contract_item';
import DiscussionDraftFactory from './models/discussion_draft';
import EdgewareLockdropBalanceFactory from './models/edgeware_lockdrop_balance';
import EdgewareLockdropEventFactory from './models/edgeware_lockdrop_event';
import EdgewareLockdropEverythingFactory from './models/edgeware_lockdrop_everything';
import HedgehogAuthenticationFactory from './models/hedgehog_authentication';
import HedgehogUserFactory from './models/hedgehog_user';
import InviteCodeFactory from './models/invite_code';
import InviteLinkFactory from './models/invite_link';
import LoginTokenFactory from './models/login_token';
import NotificationFactory from './models/notification';
import NotificationCategoryFactory from './models/notification_category';
import OffchainAttachmentFactory from './models/offchain_attachment';
import OffchainCommentFactory from './models/offchain_comment';
import OffchainCommunityFactory from './models/offchain_community';
import OffchainProfileFactory from './models/offchain_profile';
import OffchainReactionFactory from './models/offchain_reaction';
import OffchainThreadFactory from './models/offchain_thread';
import OffchainTopicFactory from './models/offchain_topic';
import OffchainViewCountFactory from './models/offchain_viewcount';
import OffchainVoteFactory from './models/offchain_vote';
import RoleFactory from './models/role';
import SocialAccountFactory from './models/social_account';
import StarredCommunityFactory from './models/starred_community';
import SubscriptionFactory from './models/subscription';
import TaggedThreadFactory from './models/tagged_threads';
import UserModelFactory from './models/user';
import WaitlistRegistrationFactory from './models/waitlist_registration';
import WebhookFactory from './models/webhook';

const log = factory.getLogger(formatFilename(__filename));
export const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging: (process.env.NODE_ENV === 'test') ? false : (msg) => { log.trace(msg); },
  dialectOptions: (process.env.NODE_ENV !== 'production') ? {
    requestTimeout: 40000,
  } : {
    requestTimeout: 40000,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  }
});

const models = {
  Address: AddressFactory(sequelize),
  Chain: ChainFactory(sequelize),
  ChainEntity: ChainEntityFactory(sequelize),
  ChainEvent: ChainEventFactory(sequelize),
  ChainEventType:  ChainEventTypeFactory(sequelize),
  ChainNode: ChainNodeFactory(sequelize),
  ChatMessage: ChatMessageFactory(sequelize),
  Collaboration: CollaborationFactory(sequelize),
  ContractCategory: ContractCategoryFactory(sequelize),
  ContractItem: ContractItemFactory(sequelize),
  DiscussionDraft: DiscussionDraftFactory(sequelize),
  EdgewareLockdropBalance: EdgewareLockdropBalanceFactory(sequelize),
  EdgewareLockdropEvent: EdgewareLockdropEventFactory(sequelize),
  EdgewareLockdropEverything: EdgewareLockdropEverythingFactory(sequelize),
  HedgehogAuthentication: HedgehogAuthenticationFactory(sequelize),
  HedgehogUser: HedgehogUserFactory(sequelize),
  InviteCode: InviteCodeFactory(sequelize),
  InviteLink: InviteLinkFactory(sequelize),
  LoginToken: LoginTokenFactory(sequelize),
  Notification: NotificationFactory(sequelize),
  NotificationCategory: NotificationCategoryFactory(sequelize),
  OffchainAttachment: OffchainAttachmentFactory(sequelize),
  OffchainComment: OffchainCommentFactory(sequelize),
  OffchainCommunity: OffchainCommunityFactory(sequelize),
  OffchainProfile: OffchainProfileFactory(sequelize),
  OffchainReaction: OffchainReactionFactory(sequelize),
  OffchainThread: OffchainThreadFactory(sequelize),
  OffchainTopic: OffchainTopicFactory(sequelize),
  OffchainViewCount: OffchainViewCountFactory(sequelize),
  OffchainVote: OffchainVoteFactory(sequelize),
  Role: RoleFactory(sequelize),
  SocialAccount: SocialAccountFactory(sequelize),
  StarredCommunity: StarredCommunityFactory(sequelize),
  Subscription: SubscriptionFactory(sequelize),
  TaggedThread: TaggedThreadFactory(sequelize),
  User: UserModelFactory(sequelize),
  WaitlistRegistration: WaitlistRegistrationFactory(sequelize),
  Webhook: WebhookFactory(sequelize),
};

const db = {
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
