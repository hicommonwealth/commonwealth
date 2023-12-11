import { oneOf, query, validationResult } from 'express-validator';
import Sequelize, { WhereOptions } from 'sequelize';
import type { GetProfilesReq, GetProfilesResp } from '../../api/extApiTypes';
import { needParamErrMsg } from '../../api/extApiTypes';
import type { DB } from '../../models';
import { ProfileAttributes } from '../../models/profile';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { paginationValidation } from '../../util/helperValidations';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getProfilesValidation = [
  oneOf(
    [
      query('addresses').exists().toArray(),
      query('profile_ids').exists().toArray(),
    ],
    `${needParamErrMsg} (addresses, profile_ids)`,
  ),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

const getProfiles = async (
  models: DB,
  req: TypedRequestQuery<GetProfilesReq>,
  res: TypedResponse<GetProfilesResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }
  // This route is for fetching all profiles + addresses by community
  const { addresses, profile_ids, count_only } = req.query;

  const pagination = formatPagination(req.query);

  // if address is included, find which profile_ids they correspond to.
  let newProfileIds = [];
  if (addresses) {
    newProfileIds = await models.Address.findAll({
      where: { address: { [Op.in]: addresses } },
      attributes: ['profile_id'],
    });
  }

  const where: WhereOptions<ProfileAttributes> = {};
  if (!profile_ids) {
    where.id = { [Op.in]: newProfileIds.map((p) => p.profile_id) };
  } else {
    where.id = {
      [Op.in]: [...profile_ids, ...newProfileIds.map((p) => p.profile_id)],
    };
  }

  const include = [
    {
      model: models.Address,
      required: true,
      include: [
        { model: models.Community, required: true, where: { active: true } },
        { model: models.Thread },
        { model: models.Comment, include: [{ model: models.Thread }] },
      ],
    },
  ];
  let profiles, count;
  if (!count_only) {
    ({ rows: profiles, count } = await models.Profile.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['user_id', 'address_id'] },
      ...pagination,
    }));
  } else {
    count = await models.Profile.count({
      where,
      attributes: { exclude: ['user_id', 'address_id'] },
      include,
      ...pagination,
    });
  }

  return success(res, { profiles, count });
};

export default getProfiles;
