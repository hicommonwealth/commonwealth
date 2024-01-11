import { AppError } from '@hicommonwealth/adapters';
import { ChainBase } from '@hicommonwealth/core';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

import testSubstrateSpec from '../util/testSubstrateSpec';

const editSubstrateSpec = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const chain = req.chain;
  if (!chain) return next(new AppError('Unknown chain.'));
  if (chain.base !== ChainBase.Substrate)
    return next(new AppError('Chain must be substrate'));

  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  const requesterIsAdmin = await findAllRoles(
    models,
    { where: { address_id: adminAddress.id } },
    chain.id,
    ['admin'],
  );
  if (!requesterIsAdmin && !req.user.isAdmin)
    return next(new AppError('Must be admin to edit'));

  const node = await chain.getChainNode();
  if (!node) return next(new AppError('no chain nodes found'));

  let sanitizedSpec;
  try {
    sanitizedSpec = await testSubstrateSpec(req.body.spec, node.url);
  } catch (e) {
    return next(new AppError('Failed to validate Substrate Spec'));
  }

  // write back to database
  chain.substrate_spec = sanitizedSpec;
  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default editSubstrateSpec;
