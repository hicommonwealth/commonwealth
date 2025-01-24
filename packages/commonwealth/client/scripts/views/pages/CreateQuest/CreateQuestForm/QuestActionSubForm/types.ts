import { QuestEvents } from '@hicommonwealth/schemas';

export type QuestAction = keyof typeof QuestEvents;

export type QuestActionSubFormErrors = {
  action?: string;
  questLink?: string;
  rewardAmount?: string;
};

export type QuestActionSubFormFields = {
  action?: QuestAction;
  questLink?: string;
  rewardAmount?: string | number;
};

export type QuestActionSubFormProps = {
  errors?: QuestActionSubFormErrors;
  defaultValues?: QuestActionSubFormFields;
  onChange?: (params: QuestActionSubFormFields) => void;
  isRemoveable?: boolean;
  onRemove?: () => void;
  hiddenActions?: QuestAction[];
};

export type QuestActionSubFormState = {
  id: number;
  values: QuestActionSubFormFields;
  errors?: QuestActionSubFormErrors;
};

export type useQuestActionMultiFormsStateProps = {
  minSubForms: number;
  maxSubForms: number;
  validateAfterUpdate?: boolean;
};
