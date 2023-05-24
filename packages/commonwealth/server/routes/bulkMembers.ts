import type { Request, Response } from 'express';
import Sequelize from 'sequelize';
import type { DB } from '../models';

const { Op } = Sequelize;

const bulkMembers = async (models: DB, req: Request, res: Response) => {
  const chain = req.chain;
  const searchTerm = req.query.searchTerm;

  if (searchTerm && searchTerm?.length === 0) {
    return res.json({
      status: 'Success',
      result: [],
    });
  }

  const options = { where: { chain: chain.id } };

  if (searchTerm?.length >= 0) {
    const subStr = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        {
          [Op.and]: [
            { name: { [Op.ne]: null } },
            { address: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
      ],
    };
    options['where'] = Object.assign(options['where'], subStr);
  }

  const members = await models.Address.findAll({
    ...options['where'],
    order: [['created_at', 'DESC']],
  });

  return res.json({
    status: 'Success',
    result: members.map((p) => p.toJSON()),
  });
};

export default bulkMembers;
