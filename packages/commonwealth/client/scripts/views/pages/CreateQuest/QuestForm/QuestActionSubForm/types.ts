import {
  QuestActionNames,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';

export type QuestAction = (typeof QuestActionNames)[number];
export enum QuestActionContentIdScope {
  Topic = 'topic',
  Thread = 'thread',
}

export type QuestActionSubFormErrors = {
  action?: string;
  instructionsLink?: string;
  contentIdScope?: string;
  contentLink?: string;
  rewardAmount?: string;
  creatorRewardAmount?: string;
  participationLimit?: string;
};

export type QuestActionSubFormFields = {
  action?: QuestAction;
  instructionsLink?: string;
  contentIdScope?: QuestActionContentIdScope;
  contentLink?: string;
  rewardAmount?: string | number;
  creatorRewardAmount?: string | number;
  participationLimit?: QuestParticipationLimit;
  participationPeriod?: QuestParticipationPeriod;
  participationTimesPerPeriod?: string | number;
};

export type QuestActionSubFormConfig = {
  requires_creator_points: boolean;
  with_optional_topic_id: boolean;
  with_optional_thread_id: boolean;
  with_optional_comment_id: boolean;
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
