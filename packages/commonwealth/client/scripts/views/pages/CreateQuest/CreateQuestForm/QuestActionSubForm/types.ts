import { QuestEvents } from '@hicommonwealth/schemas';

export type QuestAction = keyof typeof QuestEvents;

export type QuestActionSubFormErrors = {
  action?: string;
  questLink?: string;
};

export type QuestActionSubFormFields = {
  action?: QuestAction;
  questLink?: string;
};

export type QuestActionSubFormProps = {
  errors?: QuestActionSubFormErrors;
  defaultValues?: QuestActionSubFormFields;
  onChange?: ({ action, questLink }: QuestActionSubFormFields) => void;
  isRemoveable?: boolean;
  onRemove?: () => void;
};

export type QuestActionSubFormState = {
  values: QuestActionSubFormFields;
  errors?: QuestActionSubFormErrors;
};

export type useQuestActionMultiFormsStateProps = {
  minSubForms: number;
  maxSubForms: number;
  validateAfterUpdate?: boolean;
};
