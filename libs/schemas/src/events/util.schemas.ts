import { z } from 'zod';

// All events should carry this common metadata
export const EventMetadata = z.object({
  created_at: z.coerce.date().optional().describe('When the event was emitted'),
  // TODO: TBD
  // aggregateType: z.enum(Aggregates).describe("Event emitter aggregate type")
  // aggregateId: z.string().describe("Event emitter aggregate id")
  // correlation: z.string().describe("Event correlation key")
  // causation: z.object({}).describe("Event causation")
});
