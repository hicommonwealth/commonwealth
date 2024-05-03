import { entities } from '@hicommonwealth/shared';
import { z } from 'zod';

export default function validateMetadata(
  metadata: z.infer<typeof entities.GroupMetadata>,
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
    return err;
  }
  return null;
}
