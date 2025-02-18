import { QuestEvents } from '@hicommonwealth/schemas';

export type QuestAction = keyof typeof QuestEvents;

export type QuestActionSubFormErrors = {
  action?: string;
  actionLink?: string;
  rewardAmount?: string;
  creatorRewardAmount?: string;
};

export type QuestActionSubFormFields = {
  action?: QuestAction;
  actionLink?: string;
  rewardAmount?: string | number;
  creatorRewardAmount?: string | number;
};

export type QuestActionSubFormConfig = {
  requires_creator_points: boolean;
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
