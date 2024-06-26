import Sequelize from 'sequelize';
import type { Associable } from './types';

import Address from './address';
import Ban from './ban';
import ChainNode from './chain_node';
import Collaboration from './collaboration';
import Comment from './comment';
import CommentSubscription from './comment_subscriptions';
import Community from './community';
import CommunityAlert from './community_alerts';
import CommunityBanner from './community_banner';
import CommunityContract from './community_contract';
import CommunityContractTemplate from './community_contract_template';
import CommunityContractTemplateMetadata from './community_contract_template_metadata';
import CommunityStake from './community_stake';
import CommunityTags from './community_tags';
import Contest from './contest';
import ContestAction from './contest_action';
import ContestManager from './contest_manager';
import ContestTopic from './contest_topic';
import Contract from './contract';
import ContractAbi from './contract_abi';
import DiscordBotConfig from './discord_bot_config';
import EvmEventSource from './evmEventSource';
import Group from './group';
import GroupPermission from './groupPermission';
import LastProcessedEvmBlock from './lastProcessedEvmBlock';
import LoginToken from './login_token';
import Membership from './membership';
import Notification from './notification';
import NotificationCategory from './notification_category';
import NotificationsRead from './notifications_read';
import Outbox from './outbox';
import Poll from './poll';
import Profile from './profile';
import ProfileTags from './profile_tags';
import Reaction from './reaction';
import SsoToken from './sso_token';
import StakeTransaction from './stake_transaction';
import StarredCommunity from './starred_community';
import Subscription from './subscription';
import SubscriptionPreference from './subscription_preference';
import Tags from './tags';
import Template from './template';
import Thread from './thread';
import ThreadSubscription from './thread_subscriptions';
import Topic from './topic';
import User from './user';
import Vote from './vote';
import Webhook from './webhook';

export const Factories = {
  Address,
  Ban,
  ChainNode,
  Collaboration,
  Comment,
  CommentSubscription,
  Community,
  CommunityAlert,
  CommunityBanner,
  CommunityContract,
  CommunityContractTemplate,
  CommunityContractTemplateMetadata,
  CommunityStake,
  CommunityTags,
  Contest,
  ContestAction,
  ContestManager,
  ContestTopic,
  Contract,
  ContractAbi,
  DiscordBotConfig,
  EvmEventSource,
  Group,
  GroupPermission,
  LastProcessedEvmBlock,
  LoginToken,
  Membership,
  Notification,
  NotificationCategory,
  NotificationsRead,
  Outbox,
  Poll,
  Profile,
  ProfileTags,
  Reaction,
  SsoToken,
  StakeTransaction,
  StarredCommunity,
  Subscription,
  Tags,
  SubscriptionPreference,
  Template,
  Thread,
  ThreadSubscription,
  Topic,
  User,
  Vote,
  Webhook,
};

export type DB = {
  [K in keyof typeof Factories]: ReturnType<typeof Factories[K]> &
    Associable<ReturnType<typeof Factories[K]>>;
} & {
  sequelize: Sequelize.Sequelize;
  Sequelize: typeof Sequelize.Sequelize;
};
