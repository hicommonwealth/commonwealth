import * as schemas from '@hicommonwealth/schemas';
import z from 'zod';

// TODO: Inline these types (Current PR is getting too big)
export type TopicAttributes = z.infer<typeof schemas.GetTopics.output>[0];
type Topic = TopicAttributes;
export default Topic;
