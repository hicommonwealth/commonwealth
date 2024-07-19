import { z } from 'zod';

export const ChainEventCreated = {
  input: z.object({
    webhookId: z.string(),
    createdAt: z.string(),
    type: z.literal('GRAPHQL'),
    event: z.object({
      data: z.object({
        block: z.object({
          hash: z.string(),
          number: z.number(),
          timestamp: z.number(),
          logs: z.array(
            z.object({
              data: z.string(),
              topics: z.array(z.string()),
              index: z.number(),
              account: z.object({
                address: z.string(),
              }),
              transaction: z.object({
                hash: z.string(),
                nonce: z.number(),
                index: z.number(),
                from: z.object({
                  address: z.string(),
                }),
                to: z.object({
                  address: z.string(),
                }),
                value: z.string(),
                gasPrice: z.string(),
                maxFeePerGas: z.string().nullish(),
                maxPriorityFeePerGas: z.string().nullish(),
                gas: z.number(),
                status: z.number(),
                gasUsed: z.number(),
                cumulativeGasUsed: z.number(),
                effectiveGasPrice: z.string(),
                createdContract: z.union([
                  z.null(),
                  z.object({
                    address: z.string(),
                  }),
                ]),
              }),
            }),
          ),
        }),
      }),
      sequenceNumber: z.string(),
    }),
  }),
  output: z.object({}).catchall(z.any()),
};
