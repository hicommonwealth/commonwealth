import { factory, formatFilename } from 'common-common/src/logging';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));
const bulkMembers = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  const members = await findAllRoles(
    models,
    {
      include: [
        {
          model: models.Address,
          required: true,
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
