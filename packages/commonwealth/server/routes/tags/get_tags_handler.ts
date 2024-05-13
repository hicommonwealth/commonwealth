import { Tag } from '@hicommonwealth/schemas';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse, success } from '../../types';

export type GetTagsResponse = z.infer<typeof Tag>[];

export const getTagsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery,
  res: TypedResponse<GetTagsResponse>,
) => {
  const tags = await controllers.tags.getTags();
  return success(res, tags);
};
