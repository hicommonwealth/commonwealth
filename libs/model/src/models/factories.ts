import Sequelize from 'sequelize';
import type { Associable } from './types';

import Address from './address';
import ApiKey from './api_key';
import ChainNode from './chain_node';
import Collaboration from './collaboration';
import Comment from './comment';
import CommentSubscription from './comment_subscriptions';
import CommentVersionHistory from './comment_version_history';
import Community from './community';
import CommunityAlert from './community_alerts';
import CommunityContract from './community_contract';
import CommunityStake from './community_stake';
import CommunityTags from './community_tags';
import Contest from './contest';
import ContestAction from './contest_action';
import ContestManager from './contest_manager';
import ContestTopic from './contest_topic';
import Contract from './contract';
import ContractAbi from './contract_abi';
import DiscordBotConfig from './discord_bot_config';
import EmailUpdateToken from './email_update_token';
import EvmEventSource from './evmEventSource';
import Group from './group';
import GroupPermission from './groupPermission';
import LastProcessedEvmBlock from './lastProcessedEvmBlock';
import Membership from './membership';
import Outbox from './outbox';
import Poll from './poll';
import ProfileTags from './profile_tags';
import Reaction from './reaction';
import SsoToken from './sso_token';
import StakeTransaction from './stake_transaction';
import StarredCommunity from './starred_community';
import SubscriptionPreference from './subscription_preference';
import Tags from './tags';
import Thread from './thread';
import ThreadSubscription from './thread_subscriptions';
import ThreadVersionHistory from './thread_version_history';
import Token from './token';
import Topic from './topic';
import User from './user';
import Vote from './vote';
import Wallets from './wallets';
import Webhook from './webhook';

export const Factories = {
  Address,
  ApiKey,
  ChainNode,
  Collaboration,
  Comment,
  CommentVersionHistory,
  CommentSubscription,
  Community,
  CommunityAlert,
  CommunityContract,
  CommunityStake,
  CommunityTags,
  Contest,
  ContestAction,
  ContestManager,
  ContestTopic,
  Contract,
  ContractAbi,
  DiscordBotConfig,
  EmailUpdateToken,
  EvmEventSource,
  Group,
  GroupPermission,
  LastProcessedEvmBlock,
  Membership,
  Outbox,
  Poll,
  ProfileTags,
  Reaction,
  SsoToken,
  StakeTransaction,
  StarredCommunity,
  Tags,
  SubscriptionPreference,
  Thread,
  ThreadVersionHistory,
  ThreadSubscription,
  Topic,
  User,
  Vote,
  Webhook,
  Wallets,
  Token,
};

export type DB = {
  [K in keyof typeof Factories]: ReturnType<(typeof Factories)[K]> &
    Associable<ReturnType<(typeof Factories)[K]>>;
} & {
  sequelize: Sequelize.Sequelize;
  Sequelize: typeof Sequelize.Sequelize;
};
