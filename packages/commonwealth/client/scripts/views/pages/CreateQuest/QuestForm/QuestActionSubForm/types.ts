import {
  ChannelBatchActions,
  QuestActionNames,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';

export type QuestAction =
  | (typeof QuestActionNames)[number]
  | (typeof ChannelBatchActions)[number];
export enum QuestActionContentIdScope {
  Topic = 'topic',
  Thread = 'thread',
  TwitterTweet = 'twitter_tweet',
  DiscordServer = 'discord_server',
  Chain = 'chain',
  Group = 'group',
  TokenTradeThreshold = 'threshold',
  MemberGoalCount = 'goal',
}

export type QuestActionSubFormErrors = {
  action?: string;
  instructionsLink?: string;
  rewardAmount?: string;
  creatorRewardAmount?: string;
  participationLimit?: string;
  // specific for certain quest action types
  contentIdScope?: string;
  contentIdentifier?: string;
  startLink?: string;
  // specific to twitter actions
  noOfLikes?: string;
  noOfRetweets?: string;
  noOfReplies?: string;
  // specific to launchpad token actions
  amountMultipler?: string;
  // specific to chain event actions
  contractAddress?: string;
  ethChainId?: string;
  eventSignature?: string;
  transactionHash?: string;
};

export type QuestActionSubFormFields = {
  action?: QuestAction;
  instructionsLink?: string;
  rewardAmount?: string | number;
  creatorRewardAmount?: string | number;
  participationLimit?: QuestParticipationLimit;
  participationPeriod?: QuestParticipationPeriod;
  participationTimesPerPeriod?: string | number;
  // specific for certain quest action types
  contentIdScope?: QuestActionContentIdScope;
  // a string containing content identifier
  // this string can be a url ex: `https://common.xyz/discussion/{identifier}`
  // or just the identifier itself ex: `{identifier}`
  contentIdentifier?: string;
  startLink?: string;
  // specific to twitter actions
  noOfLikes?: string | number;
  noOfRetweets?: string | number;
  noOfReplies?: string | number;
  // specific to launchpad token actions
  amountMultipler?: string | number;
  // specific to chain event actions
  contractAddress?: string;
  ethChainId?: string | number;
  eventSignature?: string;
  transactionHash?: string;
};

export type QuestActionSubFormConfig = {
  requires_basic_points: boolean;
  requires_creator_points: boolean;
  is_action_repeatable: boolean;
  with_optional_topic_id: boolean;
  with_optional_thread_id: boolean;
  with_optional_comment_id: boolean;
  requires_twitter_tweet_link: boolean;
  requires_discord_server_id: boolean;
  requires_members_goal_count: boolean;
  requires_chain_event: boolean;
  with_optional_chain_id: boolean;
  requires_group_id: boolean;
  requires_start_link: boolean;
  requires_amount_multipler: boolean;
  with_optional_token_trade_threshold: boolean;
};

export type QuestActionSubFormInternalRefs = {
  runParticipationLimitValidator: () => void;
};

export type QuestActionSubFormProps = {
  errors?: QuestActionSubFormErrors;
  defaultValues?: QuestActionSubFormFields;
  onChange?: (params: QuestActionSubFormFields) => void;
  config?: QuestActionSubFormConfig;
  isRemoveable?: boolean;
  onRemove?: () => void;
  availableActions: QuestAction[];
  hiddenActions?: QuestAction[];
  internalRefs?: QuestActionSubFormInternalRefs;
};

export type QuestActionSubFormState = {
  id: number;
  values: QuestActionSubFormFields;
  errors?: QuestActionSubFormErrors;
  config?: QuestActionSubFormConfig;
  refs?: QuestActionSubFormInternalRefs;
};

export type useQuestActionMultiFormsStateProps = {
  minSubForms: number;
  maxSubForms: number;
  validateAfterUpdate?: boolean;
};
