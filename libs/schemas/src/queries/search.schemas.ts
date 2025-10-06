import { z } from 'zod';

export const AggregateContext = {
  input: z.object({
    // Use a JSON string for mentions to make it OpenAPI-compatible
    mentions: z
      .string()
      .describe(
        'JSON string array of mention objects with id, type, and name properties',
      ),
    communityId: z.string().optional(),
    contextDataDays: z.number().optional().default(30),
  }),
  output: z.object({
    contextResults: z.array(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        entityName: z.string(),
        contextData: z.string(),
      }),
    ),
    formattedContext: z.string(),
    totalMentions: z.number(),
    processedAt: z.string(),
  }),
};
