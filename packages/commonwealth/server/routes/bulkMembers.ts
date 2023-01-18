import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
const { Op } = Sequelize;
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';
import { findAllRoles } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));
const bulkMembers = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  const searchTerm = req.query.searchTerm;

  const options = {};

  if (searchTerm && searchTerm?.length === 0) {
    return res.json({
      status: 'Success',
      result: [],
    });
  }

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
    options['where'] = options['where']
      ? Object.assign(options['where'], subStr)
      : subStr;
  }

  const members = await findAllRoles(
    models,
    {
      include: [
        {
          model: models.Address,
          required: true,
          where: { ...options['where'] },
        },
      ],
      order: [['created_at', 'DESC']],
    },
    chain.id
  );

  return res.json({
    status: 'Success',
    result: members.map((p) => p.toJSON()),
  });
};

export default bulkMembers;
