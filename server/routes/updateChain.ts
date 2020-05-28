import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const updateChain = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.id) return next(new Error('Must provide chain id'));
  if (req.body.network) return next(new Error('Cannot change chain network'));

  const chain = await models.Chain.findOne({ where: { id: req.body.id } });
  if (!chain) return next(new Error('Chain not found'));
  else {
    const userAddressIds = await req.user.getAddresses().map((address) => address.id);
    const userMembership = await models.Role.findOne({
      where: {
        address_id: { [Op.in]: userAddressIds },
        chain_id: chain.id,
        permission: 'admin',
      },
    });
    if (!userMembership) {
      return next(new Error('Not an admin'));
    }
  }

  if (req.body.name) chain.name = req.body.name;
  if (req.body.symbol) chain.symbol = req.body.symbol;
  if (req.body.icon_url) chain.IconUrl = req.body.icon_url;
  if (req.body.active !== undefined) chain.active = req.body.active;
  if (req.body.type) chain.type = req.body.type;
  if (req.body['featured_tags[]']) chain.featured_tags = req.body['featured_tags[]'];

  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default updateChain;
