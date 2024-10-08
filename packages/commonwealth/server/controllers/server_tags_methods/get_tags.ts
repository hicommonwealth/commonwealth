import { Tags } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { ServerTagsController } from '../server_tags_controller';

export type GetTagsResult = z.infer<typeof Tags>[];

export async function __getTags(
  this: ServerTagsController,
): Promise<GetTagsResult> {
  const tags = await this.models.Tags.findAll();

  return tags;
}
