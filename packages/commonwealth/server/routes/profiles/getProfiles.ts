import Sequelize from 'sequelize';
import { AppError, ServerError } from '../../util/errors';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ProfileAttributes } from '../../models/profile';
import { formatPagination, orderBy, orderByOptions } from '../../util/queries';

const { Op } = Sequelize;

type GetProfilesReq = {
  addresses?: string[];

  // goes in pagination helper
  limit?: number;
  page?: number;
  sort?: orderByOptions;
};

export const Errors = {
  NoAddresses: "Must provide community_id",
};

type GetProfilesResp = ProfileAttributes[];

const getProfiles = async (
  models: DB,
  req: TypedRequestQuery<GetProfilesReq>,
  res: TypedResponse<GetProfilesResp>,
) => {
  // This route is for fetching all profiles + addresses by community
  const { addresses } = req.query;

  if (!addresses) throw new AppError(Errors.NoAddresses);

  const pagination = formatPagination(req.query);
  const order = req.query.sort ? orderBy('createdAt', req.query.sort) : {};

  // by addresses
  const profiles = await models.Profile.findAll({
    include: [{ model: models.Address, where: { address: { [Op.in]: addresses, }} }],
    attributes: { exclude: ['user_id'] },
    ...pagination,
    ...order,
  });

  return success(res, profiles);
};

export default getProfiles;
