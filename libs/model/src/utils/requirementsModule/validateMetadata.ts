console.log('LOADING src/utils/requirementsModule/validateMetadata.ts START');
import { GroupMetadata } from '@hicommonwealth/schemas';
import { z } from 'zod';

export function validateMetadata(
  metadata: z.infer<typeof GroupMetadata>,
): Error | null {
  const schema = z.object({
    name: z.string(),
    description: z.string(),
    required_requirements: z.number().optional(),
    membership_ttl: z.number().optional(),
  });
  try {
    schema.parse(metadata);
  } catch (err) {
    return err as Error;
  }
  return null;
}

console.log('LOADING src/utils/requirementsModule/validateMetadata.ts END');
