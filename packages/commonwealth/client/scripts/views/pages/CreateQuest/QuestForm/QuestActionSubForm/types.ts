import { QuestEvents } from '@hicommonwealth/schemas';

export type QuestAction = keyof typeof QuestEvents;

export type QuestActionSubFormErrors = {
  action?: string;
  instructionsLink?: string;
  contentLink?: string;
  rewardAmount?: string;
  creatorRewardAmount?: string;
};

export type QuestActionSubFormFields = {
  action?: QuestAction;
  instructionsLink?: string;
  contentLink?: string;
  rewardAmount?: string | number;
  creatorRewardAmount?: string | number;
};

export type QuestActionSubFormConfig = {
  requires_creator_points: boolean;
  with_optional_thread_id: boolean;
  with_optional_comment_id: boolean;
};

export type QuestActionSubFormProps = {
  errors?: QuestActionSubFormErrors;
  defaultValues?: QuestActionSubFormFields;
  onChange?: (params: QuestActionSubFormFields) => void;
  config?: QuestActionSubFormConfig;
  isRemoveable?: boolean;
  onRemove?: () => void;
  hiddenActions?: QuestAction[];
};

export type QuestActionSubFormState = {
  id: number;
  values: QuestActionSubFormFields;
  errors?: QuestActionSubFormErrors;
  config?: QuestActionSubFormConfig;
};

export type useQuestActionMultiFormsStateProps = {
  minSubForms: number;
  maxSubForms: number;
  validateAfterUpdate?: boolean;
};
