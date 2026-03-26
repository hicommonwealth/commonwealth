import Sequelize from 'sequelize';
import type { Associable } from './types';

import Address from './address';
import AICompletionToken from './ai_completion_token';
import ApiKey from './api_key';
import ChainEventXpSource from './chain_event_xp_sources';
import ChainNode from './chain_node';
import Collaboration from './collaboration';
import Comment from './comment';
import CommentSubscription from './comment_subscriptions';
import CommentVersionHistory from './comment_version_history';
import Community from './community';
import CommunityAlert from './community_alerts';
import CommunityDirectoryTags from './community_directory_tags';
import { CommunityGoalMeta, CommunityGoalReached } from './community_goal';
import CommunityStake from './community_stake';
import CommunityTags from './community_tags';
import Contest from './contest';
import ContestAction from './contest_action';
import ContestManager from './contest_manager';
import DiscordBotConfig from './discord_bot_config';
import Dlq from './dlq';
import EmailUpdateToken from './email_update_token';
import EvmEventSource from './evmEventSource';
import GovernanceProposal from './governance_proposals';
import Group from './group';
import GroupGatedAction from './groupGatedAction';
import GroupSnapshot from './groupSnapshot';
import LastProcessedEvmBlock from './lastProcessedEvmBlock';
import LaunchpadTrade from './launchpad_trade';
import { CommunityMarket, Market } from './market';
import MCPServer from './mcp_server';
import MCPServerCommunity from './mcp_server_community';
import Membership from './membership';
import Outbox from './outbox';
import PinnedToken from './pinned_token';
import Poll from './poll';
import {
  PredictionMarket,
  PredictionMarketPosition,
  PredictionMarketTrade,
} from './prediction_market';
import ProfileTags from './profile_tags';
import ProposalVote from './proposal_votes';
import { Quest, QuestActionMeta } from './quest';
import QuestTweets from './quest_tweets';
import Reaction from './reaction';
import { Referral } from './referral';
import { ReferralFee } from './referral_fee';
import SsoToken from './sso_token';
import StakeTransaction from './stake_transaction';
import StarredCommunity from './starred_community';
import SubscriptionPreference from './subscription_preference';
import Tags from './tags';
import Thread from './thread';
import ThreadRank from './thread_rank';
import ThreadSubscription from './thread_subscriptions';
import ThreadToken from './thread_token';
import ThreadTokenTrade from './thread_token_trade';
import ThreadVersionHistory from './thread_version_history';
import LaunchpadToken from './token';
import {
  AuraAllocations,
  ClaimAddresses,
  ClaimEvents,
  HistoricalAllocations,
  NftSnapshot,
} from './token-allocation';
import Topic from './topic';
import TopicSubscription from './topic_subscription';
import TwitterCursor from './twitter_cursor';
import User from './user';
import Vote from './vote';
import Wallets from './wallets';
import Webhook from './webhook';
import XpLog from './xp_log';

export const Factories = {
  Address,
  AICompletionToken,
  ApiKey,
  AuraAllocations,
  ChainNode,
  ClaimAddresses,
  ClaimEvents,
  Collaboration,
  Comment,
  CommentVersionHistory,
  CommentSubscription,
  Community,
  CommunityAlert,
  CommunityGoalMeta,
  CommunityGoalReached,
  CommunityMarket,
  CommunityStake,
  CommunityTags,
  CommunityDirectoryTags,
  Contest,
  ContestAction,
  ContestManager,
  ChainEventXpSource,
  DiscordBotConfig,
  Dlq,
  EmailUpdateToken,
  EvmEventSource,
  GovernanceProposal,
  Group,
  GroupGatedAction,
  GroupSnapshot,
  HistoricalAllocations,
  LastProcessedEvmBlock,
  LaunchpadTrade,
  Market,
  MCPServer,
  MCPServerCommunity,
  Membership,
  Outbox,
  PinnedToken,
  Poll,
  ProfileTags,
  ProposalVote,
  PredictionMarket,
  PredictionMarketPosition,
  PredictionMarketTrade,
  Quest,
  QuestActionMeta,
  QuestTweets,
  Reaction,
  Referral,
  ReferralFee,
  SsoToken,
  StakeTransaction,
  StarredCommunity,
  Tags,
  SubscriptionPreference,
  Thread,
  ThreadRank,
  ThreadSubscription,
  ThreadVersionHistory,
  Topic,
  TopicSubscription,
  TwitterCursor,
  User,
  Vote,
  Webhook,
  Wallets,
  LaunchpadToken,
  XpLog,
  ThreadToken,
  ThreadTokenTrade,
  NftSnapshot,
};

export type DB = {
  [K in keyof typeof Factories]: ReturnType<(typeof Factories)[K]> &
    Associable<ReturnType<(typeof Factories)[K]>>;
} & {
  sequelize: Sequelize.Sequelize;
  Sequelize: typeof Sequelize.Sequelize;
};
