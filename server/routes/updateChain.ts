import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoChainId: 'Must provide chain id',
  CantChangeNetwork: 'Cannot change chain network',
  NotAdmin: 'Not an admin',
  NoChainFound: 'Chain not found',
};

const updateChain = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.id) return next(new Error(Errors.NoChainId));
  if (req.body.network) return next(new Error(Errors.CantChangeNetwork));

  const chain = await models.Chain.findOne({ where: { id: req.body.id } });
  if (!chain) return next(new Error(Errors.NoChainFound));
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
      return next(new Error(Errors.NotAdmin));
    }
  }

  if (req.body.name) chain.name = req.body.name;
  if (req.body.symbol) chain.symbol = req.body.symbol;
  if (req.body.icon_url) chain.icon_url = req.body.icon_url;
  if (req.body.active !== undefined) chain.active = req.body.active;
  if (req.body.type) chain.type = req.body.type;
  if (req.body.description) chain.description = req.body.description;
  if (req.body['featured_tags[]']) chain.featured_tags = req.body['featured_tags[]'];

  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default updateChain;
