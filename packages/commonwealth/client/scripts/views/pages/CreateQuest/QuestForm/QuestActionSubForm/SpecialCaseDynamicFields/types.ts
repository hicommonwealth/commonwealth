import { QuestActionSubFormProps } from '../types';

export type SpecialCaseDynamicFieldsProps = Pick<
  QuestActionSubFormProps,
  'defaultValues' | 'errors' | 'onChange' | 'config'
>;
