import z from 'zod';
import { AppError } from '../../../../common-common/src/errors';
import { GetGroupMembersResult } from '../../controllers/server_groups_methods/get_group_members';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type GetGroupMembersResponse = GetGroupMembersResult;

export const getGroupMembersHandler = async (
  controllers: ServerControllers,
  req: TypedRequest,
  res: TypedResponse<GetGroupMembersResponse>
) => {
  const schema = z.object({
    query: z.object({
      address_id: z.coerce.number().optional(),
      limit: z.coerce.number().min(1).max(50).optional(),
      page: z.coerce.number().min(1).optional(),
    }),
    params: z.object({
      groupId: z.coerce.number(),
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }

  const result = await controllers.groups.getGroupMembers({
    community: req.chain,
    groupId: validationResult.data.params.groupId,
    limit: validationResult.data.query.limit,
    page: validationResult.data.query.page,
  });
  return success(res, result);
};
