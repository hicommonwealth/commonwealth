import type { Request, Response } from 'express';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

const bulkMembers = async (models: DB, req: Request, res: Response) => {
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
