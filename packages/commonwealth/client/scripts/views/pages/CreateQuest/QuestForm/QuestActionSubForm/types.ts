import {
  ChannelBatchActions,
  KyoFinanceChainIds,
  QuestActionNames,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { z } from 'zod';

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
}

export type KyoFinanceChainIdsType = z.infer<typeof KyoFinanceChainIds>;

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
  // specific to kyo finance actions
  metadata?: {
    // for all kyo finance actions
    chainId: string;
    // for swap kyo finance actions
    outputToken?: string;
    inputToken?: string;
    minOutputAmount?: string;
    minTimestamp?: string;
    minVolumeUSD?: string;
    // for lp kyo finance actions
    poolAddresses?: string;
    minUSDValues?: string;
  };
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
  // specific to kyo finance actions
  metadata?: {
    // for all kyo finance actions
    chainId: KyoFinanceChainIdsType;
    // for swap kyo finance actions
    outputToken?: string;
    inputToken?: string;
    minOutputAmount?: string;
    minTimestamp?: string;
    minVolumeUSD?: string;
    // for lp kyo finance actions
    poolAddresses?: string;
    minUSDValues?: string;
  } | null;
};

export type QuestActionSubFormConfig = {
  requires_creator_points: boolean;
  is_action_repeatable: boolean;
  with_optional_topic_id: boolean;
  with_optional_thread_id: boolean;
  with_optional_comment_id: boolean;
  requires_twitter_tweet_link: boolean;
  requires_discord_server_id: boolean;
  with_optional_chain_id: boolean;
  requires_group_id: boolean;
  requires_start_link: boolean;
  requires_kyo_finance_swap_metadata: boolean;
  requires_kyo_finance_lp_metadata: boolean;
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
