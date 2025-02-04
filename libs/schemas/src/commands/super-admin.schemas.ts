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

export type Type1 = z.infer<typeof TriggerNotificationsWorkflow.input>;
