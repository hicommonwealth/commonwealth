import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetGroupsResult } from '../../controllers/server_groups_methods/get_groups';
import z from 'zod';
import { AppError } from '../../../../common-common/src/errors';

type GetGroupsQueryQuery = {
  include_members?: string;
  include_topics?: string;
  address_id?: string;
};
type GetGroupsResponse = GetGroupsResult;

export const getGroupsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetGroupsQueryQuery>,
  res: TypedResponse<GetGroupsResponse>
) => {
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
    query: { address_id, include_members, include_topics },
  } = validationResult.data;

  const result = await controllers.groups.getGroups({
    chain: req.chain,
    includeMembers: include_members,
    includeTopics: include_topics,
    addressId: address_id,
  });
  return success(res, result);
};
