import { Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { slugify, urlHasValidHTTPPrefix } from '../../shared/utils';
import { DB } from '../database';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoName: 'Must provide name',
  InvalidNameLength: 'Name should not exceed 255',
  NoSymbol: 'Must provide symbol',
  InvalidSymbolLength: 'Symbol should not exceed 255',
  NoType: 'Must provide chain type',
  NoBase: 'Must provide chain base',
  NoNodeUrl: 'Must provide node url',
  InvalidNodeUrl: 'Node url must begin with http://, https://, ws://, wss://',
  InvalidBase: 'Must provide valid chain base',
  ChainNameExists: 'The name for this chain already exists, please choose another name',
  InvalidIconUrl: 'Icon url must begin with https://',
  InvalidWebsite: 'Website must begin with https://',
  InvalidDiscord: 'Discord must begin with https://',
  InvalidElement: 'Element must begin with https://',
  InvalidTelegram: 'Telegram must begin with https://t.me/',
  InvalidGithub: 'Github must begin with https://github.com/',
  InvalidAddress: 'Address is invalid',
};

const createChain = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.name || !req.body.name.trim()) {
    return next(new Error(Errors.NoName));
  }
  if (req.body.name.length > 255) {
    return next(new Error(Errors.InvalidNameLength));
  }
  if (!req.body.symbol || !req.body.symbol.trim()) {
    return next(new Error(Errors.NoSymbol));
  }
  if (req.body.symbol.length > 255) {
    return next(new Error(Errors.InvalidSymbolLength));
  }
  if (!req.body.type || !req.body.type.trim()) {
    return next(new Error(Errors.NoType));
  }
  if (!req.body.base || !req.body.base.trim()) {
    return next(new Error(Errors.NoBase));
  }

  const existingBaseChain = await models.Chain.findOne({
    where: { base: req.body.base }
  });
  if (!existingBaseChain) {
    return next(new Error(Errors.InvalidBase));
  }
  if (req.body.base === 'ethereum') {
    if (!Web3.utils.isAddress(req.body.address)) {
      return next(new Error(Errors.InvalidAddress));
    }
  }

  const { website, discord, element, telegram, github, icon_url, node_url } = req.body;

  if (!node_url || !node_url.trim()) {
    return next(new Error(Errors.NoNodeUrl));
  }

  if (!urlHasValidHTTPPrefix(node_url) && !node_url.startsWith('ws://') && !node_url.startsWith('wss://')) {
    return next(new Error(Errors.InvalidNodeUrl));
  }

  if (website && !urlHasValidHTTPPrefix(website)) {
    return next(new Error(Errors.InvalidWebsite));
  } else if (discord && !urlHasValidHTTPPrefix(discord)) {
    return next(new Error(Errors.InvalidDiscord));
  } else if (element && !urlHasValidHTTPPrefix(element)) {
    return next(new Error(Errors.InvalidElement));
  } else if (telegram && !telegram.startsWith('https://t.me/')) {
    return next(new Error(Errors.InvalidTelegram));
  } else if (github && !github.startsWith('https://github.com/')) {
    return next(new Error(Errors.InvalidGithub));
  } else if (icon_url && !urlHasValidHTTPPrefix(icon_url)) {
    return next(new Error(Errors.InvalidIconUrl));
  }

  const oldChain = await models.Chain.findOne({
    where: { name: req.body.name },
  });
  if (oldChain) {
    return next(new Error(Errors.ChainNameExists));
  }

  const createdId = slugify(req.body.name);
  const chainContent = {
    id: createdId,
    name: req.body.name,
    symbol: req.body.symbol,
    icon_url: req.body.icon_url,
    description: req.body.description,
    active: true,
    network: createdId,
    type: req.body.type,
    website: req.body.website,
    discord: req.body.discord,
    telegram: req.body.telegram,
    github: req.body.github,
    element: req.body.element,
    base: req.body.base
  };
  const chain = await models.Chain.create(chainContent);

  const chainNodeContent = {
    chain: createdId,
    url: req.body.node_url,
    address: req.body.address,
  };
  const node = await models.ChainNode.create(chainNodeContent);

  return res.json({ status: 'Success', result: { chain: chain.toJSON(), node: node.toJSON() } });
};

export default createChain;
