/* eslint-disable dot-notation */
import Sequelize from 'sequelize';
import validateChain from '../util/validateChain';
const { Op } = Sequelize;
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import { AppError, ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

// the bulkAddress route takes a chain/community (mandatory) and a limit & order (both optional)
// If a chain is supplied, queried addresses are limited to being on said chain.
// If a community is supplied, all addresses with names (i.e. registered with profiles) are queried.
// If a limit is supplied, the query will only return X results.
// If an order is supplied (e.g. ['name', 'ASC'], the results will be first & accordingly sorted.
// Otherwise, it defaults to returning them in order of ['created_at', 'DESC'] (following to /bulkMembers).

const bulkAddresses = async (models: DB, req, res, next) => {
  const options = {
    order: req.query.order ? [[req.query.order]] : [['created_at', 'DESC']]
  };

  if (req.query.limit) options['limit'] = req.query.limit;

  let chain; let error;
  if (req.query.chain) {
    [chain, error] = await validateChain(models, req.query);
    if (error) return next(new AppError(error));
    options['where'] = { chain: req.query.chain };
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
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const addresses = await models.Address.findAll(options);
  return res.json({ status: 'Success', result: addresses.map((p) => p.toJSON()) });
};

export default bulkAddresses;
