import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

import testSubstrateSpec from '../util/testSubstrateSpec';

const editSubstrateSpec = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain,, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (!chain) return next(new Error('Unknown chain.'));
  if (chain.base !== 'substrate') return next(new Error('Chain must be substrate'));

  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  const requesterIsAdmin = await models.Role.findAll({
    where: {
      address_id: adminAddress.id,
      chain_id: chain.id,
      permission: ['admin'],
    },
  });
  if (!requesterIsAdmin && !req.user.isAdmin) return next(new Error('Must be admin to edit'));

  const nodes = await chain.getChainNodes();
  if (!nodes.length) return next(new Error('no chain nodes found'));

  let sanitizedSpec;
  try {
    sanitizedSpec = await testSubstrateSpec(req.body.spec, nodes[0].url);
  } catch (e) {
    return next(new Error('Failed to validate Substrate Spec'));
  }

  // write back to database
  chain.substrate_spec = sanitizedSpec;
  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};


export default editSubstrateSpec;
