import { z } from 'zod';

export const TriggerNotificationsWorkflow = {
  input: z.object({
    workflow_key: z.string(),
    data: z.record(z.any()),
  }),
  output: z.object({
    numFailed: z
      .number()
      .describe('The number of users for which triggering the workflow failed'),
    numSucceeded: z
      .number()
      .describe(
        'The number of users for which triggering the workflow succeeded',
      ),
  }),
};

export const EnableDigestEmail = {
  input: z.object({
    communityId: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
};

export const UpdateResourceTimestamps = {
  input: z
    .object({
      resource_id: z.string().or(z.number()),
      resource_name: z.enum(['Quests']), // add more resource/table names when needed
      date_field_name: z.enum([
        'start_date',
        'end_date',
        'created_at',
        'updated_at',
        'deleted_at',
      ]), // add more date fields as required
      date_field_value: z.string(),
    })
    .refine(
      (data) => {
        if (
          data.resource_name === 'Quests' &&
          typeof data.resource_id !== 'number'
        ) {
          return false;
        }
        return true;
      },
      {
        path: ['resource_id'],
        message: `For resource_name=Quests, resource_id must be a number`,
      },
    )
    .refine(
      (data) => {
        if (
          data.resource_name === 'Quests' &&
          !['start_date', 'end_date', 'created_at', 'updated_at'].includes(
            data.date_field_name,
          )
        ) {
          return false;
        }
        return true;
      },
      {
        path: ['date_field_name'],
        message: `For resource_name=Quests, date_field_name must be either 'start_date' or 'end_date'`,
      },
    ),
  output: z.object({
    success: z.boolean(),
  }),
};

export type Type1 = z.infer<typeof TriggerNotificationsWorkflow.input>;
