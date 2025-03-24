import { QuestParticipationPeriod } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { buildQuestSubFormValidationSchema } from './QuestActionSubForm/validation';
import { questFormValidationSchema } from './validation';

export type QuestActionSubFormValues = ReturnType<
  typeof buildQuestSubFormValidationSchema
>;

export type QuestFormProps =
  | {
      mode: 'create';
      questId?: never;
      initialValues?: never;
    }
  | {
      mode: 'update';
      questId: number;
      initialValues: z.infer<typeof questFormValidationSchema> & {
        participation_period?: QuestParticipationPeriod;
        participation_times_per_period?: number;
      } & {
        subForms: QuestActionSubFormValues[];
      };
    };
