import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
const { Op } = Sequelize;

const DEFAULT_SEARCH_LIMIT = 50;
const DEFAULT_ORDER = ['created_at', 'DESC'];

const getCommunitiesAndChains = async (models, req: Request, res: Response, next: NextFunction) => {
  const params = {
    order: req.query.order ? [req.query.order] : [DEFAULT_ORDER],
    limit: req.query.limit ? req.query.limit : DEFAULT_SEARCH_LIMIT
  };
  if (req.query.searchTerm) {
    params['where'] = { name: { [Op.iLike]: `%${req.query.searchTerm}%` } };
  }
  const chains = await models.Chain.findAll(params);
  const communities = await models.OffchainCommunity.findAll(params);
  const chainsAndCommunities = chains.concat(communities);

  return res.json({ status: 'Success', result: chainsAndCommunities.map((p) => p.toJSON()) });
};

export default getCommunitiesAndChains;
