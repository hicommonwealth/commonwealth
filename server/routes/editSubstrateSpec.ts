import { ApiPromise, WsProvider } from '@polkadot/api';
import { RegisteredTypes } from '@polkadot/types/types';
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

import { constructSubstrateUrl } from '../../shared/substrate';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

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

  // get spec from request
  let unpackedSpec: RegisteredTypes;
  try {
    unpackedSpec = JSON.parse(req.body.spec);
  } catch (e) {
    return next(new Error('Could not parse spec data'));
  }
  const sanitizedSpec: RegisteredTypes = {
    types: unpackedSpec['types'],
    typesAlias: unpackedSpec['typesAlias'],
    typesBundle: unpackedSpec['typesBundle'],
    typesChain: unpackedSpec['typesChain'],
    typesSpec: unpackedSpec['typesSpec'],
  };

  // test out spec
  const nodes = await chain.getChainNodes();
  if (!nodes.length) return next(new Error('no chain nodes found'));
  const provider = new WsProvider(constructSubstrateUrl(nodes[0].url), false);
  try {
    await provider.connect();
  } catch (err) {
    return next(new Error('failed to connect to node url'));
  }
  try {
    const api = await ApiPromise.create({ provider, ...sanitizedSpec });
    const version = api.runtimeVersion;
    const props = await api.rpc.system.properties();
    log.info(`Fetched version: ${version.specName}:${version.specVersion} and properties ${JSON.stringify(props)}`);
  } catch (err) {
    return next(new Error(`failed to initialize polkadot api: ${err.message}`));
  }

  // write back to database
  chain.substrate_spec = sanitizedSpec;
  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default editSubstrateSpec;
