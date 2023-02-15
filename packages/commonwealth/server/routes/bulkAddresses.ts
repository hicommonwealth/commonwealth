/* eslint-disable dot-notation */
import Sequelize from 'sequelize';
import type { FindOptions } from 'sequelize'
import type { AddressAttributes } from '../models/address';
import type { DB } from '../models';

const { Op } = Sequelize;

// the bulkAddress route takes a chain/community (mandatory) and a limit & order (both optional)
// If a chain is supplied, queried addresses are limited to having roles on said chain.
// If a limit is supplied, the query will only return X results.
// If an order is supplied (e.g. ['name', 'ASC'], the results will be first & accordingly sorted.
// Otherwise, it defaults to returning them in order of ['created_at', 'DESC'] (following to /bulkMembers).

const bulkAddresses = async (models: DB, req, res) => {
  const options: FindOptions<AddressAttributes> = {
    order: req.query.order ? [req.query.order as [string, string]] : [['created_at', 'DESC']],
  };

  if (req.query.limit) options.limit = req.query.limit;

  if (req.query.chain) {
    options.include = {
      model: models.RoleAssignment,
      required: true,
      include: [{
        model: models.CommunityRole,
        required: true,
        where: { chain_id: req.query.chain }
      }],
    };
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
    options.where = subStr;
  }

  const addresses = await models.Address.findAll(options);
  return res.json({
    status: 'Success',
    result: addresses.map((p) => p.toJSON()),
  });
};

export default bulkAddresses;
