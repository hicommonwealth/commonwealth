import { Sequelize, DataTypes } from 'sequelize';

import type { DB, Models } from './models';
import AddressFactory from './models/address';
import AttachmentFactory from './models/attachment';
import BanFactory from './models/ban';
import ChainFactory from './models/chain';
import ChainCategoryFactory from './models/chain_category';
import ChainCategoryTypeFactory from './models/chain_category_type';
import ChainEntityMetaFactory from './models/chain_entity_meta';
import ChainEventTypeFactory from './models/chain_event_type';
import ChainNodeFactory from './models/chain_node';
import ChatChannelFactory from './models/chat_channel';
import ChatMessageFactory from './models/chat_message';
import CollaborationFactory from './models/collaboration';
import CommentFactory from './models/comment';
import CommunityBannerFactory from './models/community_banner';
import CommunityContractFactory from './models/community_contract';
import CommunityRoleFactory from './models/community_role';
import CommunitySnapshotSpaceFactory from './models/community_snapshot_spaces';
import SnapshotSpaceFactory from './models/snapshot_spaces';
import ContractFactory from './models/contract';
import ContractAbiFactory from './models/contract_abi';
import DiscussionDraftFactory from './models/discussion_draft';
import IdentityCacheFactory from './models/identity_cache';
import InviteCodeFactory from './models/invite_code';
import LinkedThread from './models/linked_thread';
import LoginTokenFactory from './models/login_token';
import NotificationFactory from './models/notification';
import NotificationsReadFactory from './models/notifications_read';
import NotificationCategoryFactory from './models/notification_category';
import OffchainProfileFactory from './models/offchain_profile';
import PollFactory from './models/poll';
import ProfileFactory from './models/profile';
import ReactionFactory from './models/reaction';
import RoleAssignmentFactory from './models/role_assignment';
import RoleFactory from './models/role';
import RuleFactory from './models/rule';
import SocialAccountFactory from './models/social_account';
import SsoTokenFactory from './models/sso_token';
import StarredCommunityFactory from './models/starred_community';
import SubscriptionFactory from './models/subscription';
import TaggedThreadFactory from './models/tagged_threads';
import ThreadFactory from './models/thread';
import TokenFactory from './models/token';
import TopicFactory from './models/topic';
import UserModelFactory from './models/user';
import ViewCountFactory from './models/viewcount';
import VoteFactory from './models/vote';
import WaitlistRegistrationFactory from './models/waitlist_registration';
import WebhookFactory from './models/webhook';
import SnapshotProposalFactory from './models/snapshot_proposal';
import DiscordBotConfigFactory from './models/discord_bot_config';

// db is exported => { db: <something> }
// then, we set <something> to the correct data once initialized
const db = {
  db: {
    sequelize: null,
    Sequelize,
  } as DB
};

export function initDb(connectFn: () => Sequelize) {
  const sequelize = connectFn();
  const models: Models = {
    Address: AddressFactory(sequelize, DataTypes),
    Ban: BanFactory(sequelize, DataTypes),
    Chain: ChainFactory(sequelize, DataTypes),
    ChainCategory: ChainCategoryFactory(sequelize, DataTypes),
    ChainCategoryType: ChainCategoryTypeFactory(sequelize, DataTypes),
    ChainNode: ChainNodeFactory(sequelize, DataTypes),
    ChatChannel: ChatChannelFactory(sequelize, DataTypes),
    ChainEntityMeta: ChainEntityMetaFactory(sequelize, DataTypes),
    ChainEventType: ChainEventTypeFactory(sequelize, DataTypes),
    ChatMessage: ChatMessageFactory(sequelize, DataTypes),
    Collaboration: CollaborationFactory(sequelize, DataTypes),
    Contract: ContractFactory(sequelize, DataTypes),
    ContractAbi: ContractAbiFactory(sequelize, DataTypes),
    CommunityContract: CommunityContractFactory(sequelize, DataTypes),
    CommunityBanner: CommunityBannerFactory(sequelize, DataTypes),
    CommunityRole: CommunityRoleFactory(sequelize, DataTypes),
    CommunitySnapshotSpaces: CommunitySnapshotSpaceFactory(sequelize, DataTypes),
    DiscussionDraft: DiscussionDraftFactory(sequelize, DataTypes),
    DiscordBotConfig: DiscordBotConfigFactory(sequelize, DataTypes),
    IdentityCache: IdentityCacheFactory(sequelize, DataTypes),
    InviteCode: InviteCodeFactory(sequelize, DataTypes),
    LinkedThread: LinkedThread(sequelize, DataTypes),
    LoginToken: LoginTokenFactory(sequelize, DataTypes),
    Notification: NotificationFactory(sequelize, DataTypes),
    NotificationCategory: NotificationCategoryFactory(sequelize, DataTypes),
    NotificationsRead: NotificationsReadFactory(sequelize, DataTypes),
    Attachment: AttachmentFactory(sequelize, DataTypes),
    Comment: CommentFactory(sequelize, DataTypes),
    Poll: PollFactory(sequelize, DataTypes),
    OffchainProfile: OffchainProfileFactory(sequelize, DataTypes),
    Reaction: ReactionFactory(sequelize, DataTypes),
    Thread: ThreadFactory(sequelize, DataTypes),
    Topic: TopicFactory(sequelize, DataTypes),
    ViewCount: ViewCountFactory(sequelize, DataTypes),
    Vote: VoteFactory(sequelize, DataTypes),
    Profile: ProfileFactory(sequelize, DataTypes),
    Role: RoleFactory(sequelize, DataTypes),
    RoleAssignment: RoleAssignmentFactory(sequelize, DataTypes),
    Rule: RuleFactory(sequelize, DataTypes),
    SocialAccount: SocialAccountFactory(sequelize, DataTypes),
    SsoToken: SsoTokenFactory(sequelize, DataTypes),
    StarredCommunity: StarredCommunityFactory(sequelize, DataTypes),
    SnapshotProposal: SnapshotProposalFactory(sequelize, DataTypes),
    SnapshotSpace: SnapshotSpaceFactory(sequelize, DataTypes),
    Subscription: SubscriptionFactory(sequelize, DataTypes),
    Token: TokenFactory(sequelize, DataTypes),
    TaggedThread: TaggedThreadFactory(sequelize, DataTypes),
    User: UserModelFactory(sequelize, DataTypes),
    WaitlistRegistration: WaitlistRegistrationFactory(sequelize, DataTypes),
    Webhook: WebhookFactory(sequelize, DataTypes),
  };

  // setup associations
  Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
      models[modelName].associate(models);
    }
  });

  db.db = {
    sequelize,
    Sequelize,
    ...models,
  } as DB;
}


export default db;
