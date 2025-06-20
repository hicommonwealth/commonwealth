import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod/v4';

export type Topic = z.infer<typeof schemas.TopicView>;
