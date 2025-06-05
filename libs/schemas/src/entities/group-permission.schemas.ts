import { GatedActionEnum } from '@hicommonwealth/shared';
import { z } from 'zod/v4';
import { PG_INT } from '../utils';

export const GroupGatedAction = z.object({
  group_id: PG_INT,
  topic_id: PG_INT,
  is_private: z.boolean(),
  gated_actions: z.array(z.nativeEnum(GatedActionEnum)),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
