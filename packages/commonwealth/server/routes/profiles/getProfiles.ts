import Sequelize from 'sequelize';
import { AppError, ServerError } from '../../util/errors';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ProfileAttributes } from '../../models/profile';
import { formatPagination, orderBy, orderByOptions } from '../../util/queries';

const { Op } = Sequelize;

type GetProfilesReq = {
  addresses?: string[];
  profile_ids?: number[]; // TODO: Not Implemented

  // goes in pagination helper
  limit?: number;
  page?: number;
  sort?: orderByOptions;
};

export const Errors = {
  NoArgs: "Must provide addresses or profile_ids",
  BothArgs: "Must not provide both args"
};

type GetProfilesResp = ProfileAttributes[];

const getProfiles = async (
  models: DB,
  req: TypedRequestQuery<GetProfilesReq>,
  res: TypedResponse<GetProfilesResp>,
) => {
  // This route is for fetching all profiles + addresses by community
  const { addresses, profile_ids } = req.query;

  if (!addresses && !profile_ids) throw new AppError(Errors.NoArgs);
  if (addresses && profile_ids) throw new AppError(Errors.BothArgs);

  const pagination = formatPagination(req.query);
  const order = req.query.sort ? orderBy('createdAt', req.query.sort) : {};

  let profiles;

  // by addresses
  if (addresses) {
    profiles = await models.Profile.findAll({
      include: [{ model: models.Address, where: { address: { [Op.in]: addresses, }} }],
      attributes: { exclude: ['user_id'] },
      ...pagination,
      ...order,
    });
  } else if (profile_ids) {
    profiles = await models.Profile.findAll({
      where: { id: { [Op.in]: profile_ids, }},
      attributes: { exclude: ['user_id'] },
      ...pagination,
      ...order,
    });
  }

  return success(res, profiles);
};

export default getProfiles;
