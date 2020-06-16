import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const getDiscussionDrafts = async (models, req: Request, res: Response, next: NextFunction) => {
  const [addresses] = user.getAddresses();
  const myAddressIds = Array.from(addresses.map((address) => address.id));

  const drafts = await models.DiscussionDraft.findAll({
    where: {
      author_id: {
        [Op.in]: myAddressIds,
      }
    },
    include: [
      models.Address,
      models.OffchainAttachment
    ],
  });

  return res.json({ status: 'Success', result: drafts });
};

export default getDiscussionDrafts;
