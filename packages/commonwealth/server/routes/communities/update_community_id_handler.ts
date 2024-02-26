import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import {
  UpdateCommunityIdOptions,
  UpdateCommunityIdResult,
  UpdateCommunityIdSchema,
} from '../../controllers/server_communities_methods/update_community_id';
import { ServerControllers } from '../../routing/router';
import { success, TypedRequestBody, TypedResponse } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

type UpdateCommunityIdParams = UpdateCommunityIdOptions;
type UpdateCommunityIdResponse = UpdateCommunityIdResult;

export const updateCommunityIdHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateCommunityIdParams>,
  res: TypedResponse<UpdateCommunityIdResponse>,
) => {
  if (!req.user.isAdmin) {
    throw new AppError('Must be a super admin to update community id');
  }

  const validationResult = UpdateCommunityIdSchema.safeParse(req.body);

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const result = await controllers.communities.updateCommunityId(
    validationResult.data,
  );

  return success(res, result);
};
