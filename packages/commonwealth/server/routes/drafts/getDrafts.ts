import type { Request, Response } from 'express';
import { Op } from 'sequelize';

const getDiscussionDrafts = async (models, req: Request, res: Response) => {
  const addresses = await models.Address.findAll({
    where: {
      user_id: req.user.id,
    },
  });
  const addressIds = Array.from(addresses.map((address) => address.id));

  const drafts = await models.DiscussionDraft.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
    },
    include: [models.Address, models.Attachment],
  });

  return res.json({ status: 'Success', result: drafts.map((d) => d.toJSON()) });
};

export default getDiscussionDrafts;
