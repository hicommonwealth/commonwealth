import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const updateChain = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.user.isAdmin) return next(new Error('Must be admin'));
  if (!req.body.id) return next(new Error('Must provide chain id'));
  if (req.body.network) return next(new Error('Cannot change chain network'));

  const chain = await models.Chain.findOne({ where: { id: req.body.id } });
  if (!chain) return next(new Error('Chain not found'));
  else {
    const userAddressIds = await req.user.getAddresses().map((address) => address.id);
    const userMembership = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        chain_id: chain.id,
      },
    });
    if (userMembership.role.permission !== 'admin') {
      return next(new Error('Invalid community or chain'));
    }
  }

  if (req.body.name) chain.setName(req.body.name);
  if (req.body.symbol) chain.setSymbol(req.body.symbol);
  if (req.body.icon_url) chain.setIconUrl(req.body.icon_url);
  if (req.body.active !== undefined) chain.setActive(req.body.active);
  if (req.body.type) chain.setActive(req.body.type);
  if (req.body['featured_tags[]']) chain.featured_tags = req.body['featured_tags[]'];

  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default updateChain;
