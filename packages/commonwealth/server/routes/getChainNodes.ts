import Sequelize from 'sequelize';
import { DB } from 'server/models';
import { success, TypedRequestQuery, TypedResponse } from 'server/types';
import {
  GetChainNodesReq,
  GetChainNodesResp,
} from 'common-common/src/api/extApiTypes';
import { AppError } from 'server/util/errors';
import { formatPagination } from 'server/util/queries';

const { Op } = Sequelize;

export const Errors = {
  NoArgs: "Must provide balance_type or name",
  BothArgs: "Must not provide both args"
};

export const getChainNodes = async (
  models: DB,
  req: TypedRequestQuery<GetChainNodesReq>,
  res: TypedResponse<GetChainNodesResp>,
) => {

  if (!req.query) throw new AppError(Errors.NoArgs);
  // This route is for fetching all profiles + addresses by community
  const { balance_types, names } = req.query;

  if (!balance_types && !names) throw new AppError(Errors.NoArgs);
  if (balance_types && names) throw new AppError(Errors.BothArgs);

  const where = balance_types ? { balance_type: { [Op.in]: balance_types } } : { name: { [Op.in]: names } };

  const pagination = formatPagination(req.query);

  const { rows: chainNodes, count } = await models.ChainNode.findAndCountAll({
    where,
    ...pagination,
  });

  return success(res, { chain_nodes: chainNodes.map((t) => t.toJSON()), count });
};