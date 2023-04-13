/* eslint-disable dot-notation */
import Sequelize from 'sequelize';
import type { DB } from '../models';
import { ALL_CHAINS } from '../middleware/databaseValidationService';
import { AppError } from '../../../common-common/src/errors';

const { Op } = Sequelize;

export const Errors = {
  InvalidChain: 'Invalid chain',
};

// the bulkAddress route takes a chain/community (mandatory) and a limit & order (both optional)
// If a chain is supplied, queried addresses are limited to being on said chain.
// If a community is supplied, all addresses with names (i.e. registered with profiles) are queried.
// If a limit is supplied, the query will only return X results.
// If an order is supplied (e.g. ['name', 'ASC'], the results will be first & accordingly sorted.
// Otherwise, it defaults to returning them in order of ['created_at', 'DESC'] (following to /bulkMembers).

const bulkAddresses = async (models: DB, req, res) => {
  const options = {
    order: req.query.order ? [[req.query.order]] : [['created_at', 'DESC']],
  };

  if (req.query.limit) options['limit'] = req.query.limit;

  if (!req.query.chain) {
    throw new AppError(Errors.InvalidChain);
  }

  if (req.query.chain === ALL_CHAINS) {
    const allChains = await models.Chain.findAll({});
    const allChainIds = allChains.map((chain) => chain.id);
    options['where'] = {
      chain: {
        [Op.in]: allChainIds,
      },
    };
    options['group'] = 'address';
  } else {
    options['where'] = { chain: req.query.chain };
  }

  if (req.query.searchTerm?.length) {
    const subStr = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${req.query.searchTerm}%` } },
        {
          [Op.and]: [
            { name: { [Op.ne]: null } },
            { address: { [Op.iLike]: `%${req.query.searchTerm}%` } },
          ],
        },
      ],
    };
    options['where'] = options['where']
      ? Object.assign(options['where'], subStr)
      : subStr;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const addresses = await models.Address.findAll(options);
  return res.json({
    status: 'Success',
    result: addresses.map((p) => p.toJSON()),
  });
};

export default bulkAddresses;
