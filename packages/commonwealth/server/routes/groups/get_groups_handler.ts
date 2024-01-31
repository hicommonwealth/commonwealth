import { AppError } from '@hicommonwealth/core';
import z from 'zod';
import { GetGroupsResult } from '../../controllers/server_groups_methods/get_groups';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse, success } from '../../types';

type GetGroupsQueryQuery = {
  include_topics?: string;
};
type GetGroupsResponse = GetGroupsResult;

export const getGroupsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetGroupsQueryQuery>,
  res: TypedResponse<GetGroupsResponse>,
) => {
  const { community } = req;

  const schema = z.object({
    query: z.object({
      address_id: z.coerce.number().optional(),
      include_members: z.coerce.boolean().optional(),
      include_topics: z.coerce.boolean().optional(),
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }
  const {
    query: { include_members, include_topics },
  } = validationResult.data;

  const result = await controllers.groups.getGroups({
    communityId: community.id,
    includeMembers: include_members,
    includeTopics: include_topics,
  });
  return success(res, result);
};
