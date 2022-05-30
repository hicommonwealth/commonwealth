import { Op } from 'sequelize';
import { NextFunction } from 'express';
import { ChainBase, ChainType } from '../../shared/types';
import testSubstrateSpec from '../util/testSubstrateSpec';
import { DB } from '../database';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { CommunityAttributes } from '../models/community';
import { ChainNodeAttributes } from '../models/chain_node';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be admin',
  MissingParams: 'Must provide chain ID, name, symbol, network, and node url',
  NodeExists: 'Node already exists',
  MustSpecifyContract: 'This is a contract, you must specify a contract address',
  InvalidJSON: 'Substrate spec supplied has invalid JSON'
};

type AddChainNodeReq = Omit<CommunityAttributes, 'substrate_spec'> & Omit<ChainNodeAttributes, 'id'> & {
  id: string;
  node_url: string;
  substrate_spec: string;
};

type AddChainNodeResp = ChainNodeAttributes;

const addChainNode = async (
  models: DB,
  req: TypedRequestBody<AddChainNodeReq>,
  res: TypedResponse<AddChainNodeResp>,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin && req.body?.base !== ChainBase.NEAR) {
    return next(new Error(Errors.MustBeAdmin));
  }
  if (
    !req.body.id?.trim()
    || !req.body.name?.trim()
    || !req.body.symbol?.trim()
    || !req.body.network?.trim()
    || !req.body.node_url?.trim()
    || !req.body.base?.trim()
  ) {
    return next(new Error(Errors.MissingParams));
  }

  let sanitizedSpec;
  if (req.body.substrate_spec) {
    try {
      sanitizedSpec = await testSubstrateSpec(req.body.substrate_spec, req.body.node_url);
    } catch (e) {
      return next(new Error('Failed to validate Substrate Spec'));
    }
  }

  let community = await models.Community.findOne({ where: {
    // TODO: should we only check id?
    [Op.or]: [
      { id: req.body.id },
      { name: req.body.name }
    ]
  } });
  if (community) {
    const existingNode = await models.ChainNode.findOne({ where: {
      community_id: community.id,
      url: req.body.node_url,
    } });
    if (existingNode) {
      return next(new Error(Errors.NodeExists));
    }
  } else {
    community = await models.Community.create({
      id: req.body.id,
      name: req.body.name,
      symbol: req.body.symbol,
      network: req.body.network,
      icon_url: req.body.icon_url,
      active: true,
      base: req.body.base,
      substrate_spec: sanitizedSpec || '',
      website: req.body.website ? req.body.website : '',
      discord: req.body.discord ? req.body.discord : '',
      telegram: req.body.telegram ? req.body.telegram : '',
      github: req.body.github ? req.body.github : '',
      element: req.body.element ? req.body.element : '',
      description: req.body.description ? req.body.description : '',
      type: req.body.type ? req.body.type : ChainType.Chain,
      // TODO: set this to true for Comp/Aave
      has_chain_events_listener: false,
      bech32_prefix: req.body.bech32_prefix || null,
    });
  }

  if (community.type === ChainType.DAO && !req.body.address && req.body.base !== ChainBase.NEAR) {
    return next(new Error(Errors.MustSpecifyContract));
  }

  const node = await models.ChainNode.create({
    community_id: community.id,
    url: req.body.node_url,
    address: req.body.address || '',
    token_name: req.body.token_name || null,
    eth_chain_id: req.body.eth_chain_id || null, // TODO: will this work on nullable field?
    alt_wallet_url: req.body.alt_wallet_url || null,
  });

  // TODO: trigger migration job if turning on chain events for Comp/Aave

  return success(res, node.toJSON());
};

export default addChainNode;
