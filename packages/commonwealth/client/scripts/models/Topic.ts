import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';

export type Topic = z.infer<typeof schemas.TopicView>;
