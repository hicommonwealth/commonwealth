/* eslint-disable dot-notation */
import Sequelize from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
const { Op } = Sequelize;
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

// the bulkAddress route takes a chain/community (mandatory) and a limit & order (both optional)
// If a chain is supplied, queried addresses are limited to being on said chain.
// If a community is supplied, all addresses with names (i.e. registered with profiles) are queried.
// If a limit is supplied, the query will only return X results.
// If an order is supplied (e.g. ['name', 'ASC'], the results will be first & accordingly sorted.
// Otherwise, it defaults to returning them in order of ['created_at', 'DESC'] (following to /bulkMembers).

const bulkAddresses = async (models, req, res, next) => {
  const options = {
    order: req.query.order ? [req.query.order] : ['created_at', 'DESC']
  };

  if (req.query.limit) options['limit'] = req.query.limit;

  let chain; let community; let error;
  if (req.query.chain || req.query.community) {
    [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
    if (error) return next(new Error(error));
    if (chain) options['where'] = { chain: req.query.chain };
  }

  if (req.query.searchTerm?.length) {
    const subStr = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${req.query.searchTerm}%` } },
        {
          [Op.and]: [
            { name: { [Op.ne]: null } },
            { address: { [Op.iLike]: `%${req.query.searchTerm}%` } }
          ]
        }
      ]
    };
    options['where'] = options['where']
      ? Object.assign(options['where'], subStr)
      : subStr;
    if (req.query.community) {
      options['include'] = [{
        model: models.Role,
        where: { offchain_community_id: community.id },
      }];
    }
  }
  const addresses = await models.Address.findAll(options);
  return res.json({ status: 'Success', result: addresses.map((p) => p.toJSON()) });
};

export default bulkAddresses;
