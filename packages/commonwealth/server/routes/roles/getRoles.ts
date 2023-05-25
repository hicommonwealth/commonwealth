import Sequelize, { FindAndCountOptions } from 'sequelize';
import type {
  GetRolesReq,
  GetRolesResp,
} from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { success, failure } from '../../types';
import type { DB } from '../../models';
import { formatPagination } from '../../util/queries';
import { paginationValidation } from '../../util/helperValidations';
import { RoleAttributes } from 'server/models/role';

const { Op } = Sequelize;

export const getRolesValidation = [
  query('community_id').isString().trim(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
  query('permissions').optional().isArray(),
  ...paginationValidation,
];

export const getRoles = async (
  models: DB,
  req: TypedRequestQuery<GetRolesReq>,
  res: TypedResponse<GetRolesResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, addresses, count_only, permissions } = req.query;

  const where: FindAndCountOptions<RoleAttributes>['where'] = {
    chain_id: community_id,
  };

  const include: FindAndCountOptions<RoleAttributes>['include'] = [];

  if (permissions) {
    where.permission = {
      [Op.in]: permissions,
    };
    include.push({
      model: models.Address,
      required: true,
    });
  }

  if (include.length === 0 && addresses) {
    include.push({
      model: models.Address,
      where: { address: { [Op.in]: addresses } },
      required: true,
    });
  }

  let roles, count;
  if (!count_only) {
    ({ rows: roles, count } = await models.Role.findAndCountAll({
      where,
      include,
      ...formatPagination(req.query),
    }));
  } else {
    count = await models.Role.count({
      where,
      include,
      ...formatPagination(req.query),
    });
  }

  return success(res, { roles, count });
};
