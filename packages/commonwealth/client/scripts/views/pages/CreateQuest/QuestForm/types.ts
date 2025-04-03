import { QuestParticipationPeriod } from '@hicommonwealth/schemas';
import { z } from 'zod';
import {
  questSubFormValidationSchema,
  questSubFormValidationSchemaWithContentLink,
  questSubFormValidationSchemaWithCreatorPoints,
  questSubFormValidationSchemaWithCreatorPointsWithContentLink,
} from './QuestActionSubForm/validation';
import { buildDynamicQuestFormValidationSchema } from './validation';

export type QuestActionSubFormValues = z.infer<
  typeof questSubFormValidationSchema
>;
export type QuestActionSubFormValuesWithContentLink = z.infer<
  typeof questSubFormValidationSchemaWithContentLink
>;
export type QuestActionSubFormValuesWithCreatorPoints = z.infer<
  typeof questSubFormValidationSchemaWithCreatorPoints
>;
export type QuestActionSubFormValuesWithCreatorPointsWithContentLink = z.infer<
  typeof questSubFormValidationSchemaWithCreatorPointsWithContentLink
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
      initialValues: z.infer<
        ReturnType<typeof buildDynamicQuestFormValidationSchema>
      > & {
        participation_period?: QuestParticipationPeriod;
        participation_times_per_period?: number;
      } & {
        subForms: (
          | QuestActionSubFormValues
          | QuestActionSubFormValuesWithContentLink
          | QuestActionSubFormValuesWithCreatorPoints
          | QuestActionSubFormValuesWithCreatorPointsWithContentLink
        )[];
      };
    };
