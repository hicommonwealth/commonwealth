import { Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import * as solw3 from '@solana/web3.js';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import BN from 'bn.js';
import { Op } from 'sequelize';
import { urlHasValidHTTPPrefix } from '../../shared/utils';
import { DB } from '../database';
import { getUrlsForEthChainId } from '../util/supportedEthChains';

import { ChainBase, ChainType } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoName: 'Must provide name',
  InvalidNameLength: 'Name should not exceed 255',
  NoSymbol: 'Must provide symbol',
  InvalidSymbolLength: 'Symbol should not exceed 9',
  NoType: 'Must provide chain type',
  NoBase: 'Must provide chain base',
  NoNodeUrl: 'Must provide node url',
  InvalidNodeUrl: 'Node url must begin with http://, https://, ws://, wss://',
  InvalidNode: 'Node url returned invalid response',
  MustBeWs: 'Node must support websockets on ethereum',
  InvalidBase: 'Must provide valid chain base',
  InvalidChainId: 'Ethereum chain ID not provided or unsupported',
  InvalidChainIdOrUrl: 'Could not determine a valid endpoint for provided chain',
  ChainAddressExists: 'The address already exists',
  ChainIDExists: 'The id for this chain already exists, please choose another id',
  ChainNameExists: 'The name for this chain already exists, please choose another name',
  InvalidIconUrl: 'Icon url must begin with https://',
  InvalidWebsite: 'Website must begin with https://',
  InvalidDiscord: 'Discord must begin with https://',
  InvalidElement: 'Element must begin with https://',
  InvalidTelegram: 'Telegram must begin with https://t.me/',
  InvalidGithub: 'Github must begin with https://github.com/',
  InvalidAddress: 'Address is invalid',
  NotAdmin: 'Must be admin',
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
  // require Admin privilege for creating Chain/DAO
  if (req.body.type !== ChainType.Token && req.body.type !== ChainType.Offchain) {
    if (!req.user.isAdmin) {
      return next(new Error(Errors.NotAdmin));
    }
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
  if (req.body.symbol.length > 9) {
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
  let eth_chain_id: number = null;
  let url = req.body.node_url;
  let altWalletUrl = req.body.alt_wallet_url;

  // always generate a chain id
  if (req.body.base === ChainBase.Ethereum) {
    if (!req.body.eth_chain_id || !+req.body.eth_chain_id) {
      return next(new Error(Errors.InvalidChainId));
    }
    eth_chain_id = +req.body.eth_chain_id;
  }

  // if not offchain, also validate the address
  if (req.body.base === ChainBase.Ethereum && req.body.type !== ChainType.Offchain) {
    if (!Web3.utils.isAddress(req.body.address)) {
      return next(new Error(Errors.InvalidAddress));
    }

    // override provided URL for eth chains (typically ERC20) with stored, unless none found
    const urls = await getUrlsForEthChainId(models, eth_chain_id);
    if (urls) {
      const { url: ethChainUrl, alt_wallet_url } = urls;
      url = ethChainUrl;
      if (alt_wallet_url) {
        altWalletUrl = alt_wallet_url;
      }
    } else {
      // If using overridden URL, then user must be admin -- we do not allow users to submit
      // custom URLs yet.
      if (!req.user.isAdmin) {
        return next(new Error(Errors.NotAdmin));
      }
    }
    if (!url) {
      return next(new Error(Errors.InvalidChainIdOrUrl));
    }

    const existingChainNode = await models.ChainNode.findOne({
      where: { address: req.body.address, eth_chain_id }
    });
    if (existingChainNode) {
      return next(new Error(Errors.ChainAddressExists));
    }

    const provider = new Web3.providers.WebsocketProvider(url);
    const web3 = new Web3(provider);
    const code = await web3.eth.getCode(req.body.address);
    provider.disconnect(1000, 'finished');
    if (code === '0x') {
      return next(new Error(Errors.InvalidAddress));
    }

    // TODO: test altWalletUrl if available
  } else if (req.body.base === ChainBase.Solana && req.body.type !== ChainType.Offchain) {
    let pubKey: solw3.PublicKey;
    try {
      pubKey = new solw3.PublicKey(req.body.address);
    } catch (e) {
      return next(new Error(Errors.InvalidAddress));
    }
    try {
      const clusterUrl = solw3.clusterApiUrl(url);
      const connection = new solw3.Connection(clusterUrl);
      const supply = await connection.getTokenSupply(pubKey);
      const { decimals, amount } = supply.value;
      req.body.decimals = decimals;
      if (new BN(amount, 10).isZero()) {
        throw new Error('Invalid supply amount');
      }
    } catch (e) {
      return next(new Error(Errors.InvalidNodeUrl));
    }
  } else if (req.body.base === ChainBase.CosmosSDK && req.body.type !== ChainType.Offchain) {
    // test cosmos endpoint validity -- must be http(s)
    if (!urlHasValidHTTPPrefix(url)) {
      return next(new Error(Errors.InvalidNodeUrl));
    }
    try {
      const tmClient = await Tendermint34Client.connect(url);
      const { block } = await tmClient.block();
    } catch (err) {
      return next(new Error(Errors.InvalidNode));
    }

    // TODO: test altWalletUrl if available
  } else {
    if (!url || !url.trim()) {
      return next(new Error(Errors.InvalidNodeUrl));
    }
    if (!urlHasValidHTTPPrefix(url) && !url.match(/wss?:\/\//)) {
      return next(new Error(Errors.InvalidNodeUrl));
    }
  }

  const { website, discord, element, telegram, github, icon_url } = req.body;
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
    where: { [Op.or]: [{ name: req.body.name }, { id: req.body.id }]  },
  });
  if (oldChain && oldChain.id === req.body.id) {
    return next(new Error(Errors.ChainIDExists));
  }
  if (oldChain && oldChain.name === req.body.name) {
    return next(new Error(Errors.ChainNameExists));
  }

  const chainContent = {
    id: req.body.id,
    name: req.body.name,
    symbol: req.body.symbol,
    icon_url: req.body.icon_url,
    description: req.body.description,
    active: true,
    network: req.body.network,
    type: req.body.type,
    website: req.body.website,
    discord: req.body.discord,
    telegram: req.body.telegram,
    github: req.body.github,
    element: req.body.element,
    base: req.body.base,
    bech32_prefix: req.body.bech32_prefix,
    decimals: req.body.decimals,
  };

  const chain = await models.Chain.create(chainContent);

  const chainNodeContent = {
    chain: req.body.id,
    url,
    address: req.body.address,
    eth_chain_id,
    token_name: req.body.token_name,
    alt_wallet_url: altWalletUrl,
  };

  const node = await models.ChainNode.create(chainNodeContent);

  return res.json({ status: 'Success', result: { chain: chain.toJSON(), node: node.toJSON() } });
};

export default createChain;
