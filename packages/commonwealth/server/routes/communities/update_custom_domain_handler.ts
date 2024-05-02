import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import {
  UpdateCustomDomainOptions,
  UpdateCustomDomainResult,
  UpdateCustomDomainSchema,
} from '../../controllers/server_communities_methods/update_custom_domain';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

type UpdateCustomDomainParams = UpdateCustomDomainOptions;
type UpdateCustomDomainResponse = UpdateCustomDomainResult;

export const updateCustomDomainHandler = async (
  models: DB,
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateCustomDomainParams>,
  res: TypedResponse<UpdateCustomDomainResponse>,
) => {
  if (!req.user.isAdmin) {
    throw new AppError('Must be a site admin to update custom domain');
  }

  const validationResult = UpdateCustomDomainSchema.safeParse(req.body);

  if (validationResult.success === false) {
    throw new AppError(formatErrorPretty(validationResult));
  }

  const result = await controllers.communities.updateCustomDomain(
    validationResult.data,
  );

  return success(res, result);
};
