import Sequelize from 'sequelize';
import { AppError } from '../../util/errors';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { formatPagination } from '../../util/queries';
import { GetProfilesReq, GetProfilesResp } from 'common-common/src/api/extApiTypes';

const { Op } = Sequelize;

export const Errors = {
  NoArgs: "Must provide addresses or profile_ids",
  BothArgs: "Must not provide both args"
};

const getProfiles = async (
  models: DB,
  req: TypedRequestQuery<GetProfilesReq>,
  res: TypedResponse<GetProfilesResp>,
) => {
  if (!req.query) throw new AppError(Errors.NoArgs);
  // This route is for fetching all profiles + addresses by community
  const { addresses, profile_ids, count_only } = req.query;

  if (!addresses && !profile_ids) throw new AppError(Errors.NoArgs);
  if (addresses && profile_ids) throw new AppError(Errors.BothArgs);

  const pagination = formatPagination(req.query);

  const include = [];
  if (addresses) include.push({
    model: models.Address,
    where: { address: { [Op.in]: addresses } },
    required: true
  });

  let profiles, count;
  if(!count_only) {
    ({rows: profiles, count} = await models.Profile.findAndCountAll({
      where: { id: { [Op.in]: profile_ids, } },
      attributes: { exclude: ['user_id'] },
      ...pagination,
    }));
  } else {
    count = await models.Profile.count({
      where: { id: { [Op.in]: profile_ids, } },
      attributes: { exclude: ['user_id'] },
      ...pagination,
    });
  }

  return success(res, { profiles: profiles, count });
};


export default getProfiles;
