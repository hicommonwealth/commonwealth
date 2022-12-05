import {NextFunction} from 'express';
import Web3 from 'web3';
import * as solw3 from '@solana/web3.js';
import {Cluster} from '@solana/web3.js';
import {Tendermint34Client} from '@cosmjs/tendermint-rpc';
import BN from 'bn.js';
import {Op} from 'sequelize';
import {factory, formatFilename} from 'common-common/src/logging';
import {BalanceType,ChainBase, ChainType, NotificationCategories} from 'common-common/src/types';
import {urlHasValidHTTPPrefix} from '../../shared/utils';
import {ChainAttributes} from '../models/chain';
import {ChainNodeAttributes} from '../models/chain_node';
import testSubstrateSpec from '../util/testSubstrateSpec';
import {DB} from '../models';
import {success, TypedRequestBody, TypedResponse} from '../types';

import {AddressInstance} from '../models/address';
import {mixpanelTrack} from '../util/mixpanelUtil';
import {MixpanelCommunityCreationEvent} from '../../shared/analytics/types';
import {RoleAttributes, RoleInstance} from '../models/role';

import {AppError, ServerError} from 'common-common/src/errors';
import { createDefaultCommunityRoles, createRole } from '../util/roles';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoId: 'Must provide id',
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
  InvalidChainIdOrUrl:
    'Could not determine a valid endpoint for provided chain',
  ChainAddressExists: 'The address already exists',
  ChainIDExists:
    'The id for this chain already exists, please choose another id',
  ChainNameExists:
    'The name for this chain already exists, please choose another name',
  InvalidIconUrl: 'Icon url must begin with https://',
  InvalidWebsite: 'Website must begin with https://',
  InvalidDiscord: 'Discord must begin with https://',
  InvalidElement: 'Element must begin with https://',
  InvalidTelegram: 'Telegram must begin with https://t.me/',
  InvalidGithub: 'Github must begin with https://github.com/',
  InvalidAddress: 'Address is invalid',
  NotAdmin: 'Must be admin',
};

type CreateChainReq = Omit<ChainAttributes, 'substrate_spec'> & Omit<ChainNodeAttributes, 'id'> & {
  id: string;
  node_url: string;
  substrate_spec: string;
  address?: string;
  decimals: number;
};

type CreateChainResp = {
  chain: ChainAttributes;
  node: ChainNodeAttributes;
  role: RoleAttributes;
  admin_address: string;
};

const createChain = async (
  models: DB,
  req: TypedRequestBody<CreateChainReq>,
  res: TypedResponse<CreateChainResp>,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Not logged in'));
  }
  // require Admin privilege for creating Chain/DAO
  if (
    req.body.type !== ChainType.Token &&
    req.body.type !== ChainType.Offchain
  ) {
    if (!req.user.isAdmin) {
      return next(new AppError(Errors.NotAdmin));
    }
  }
  if (!req.body.id || !req.body.id.trim()) {
    return next(new AppError(Errors.NoId));
  }
  if (!req.body.name || !req.body.name.trim()) {
    return next(new AppError(Errors.NoName));
  }
  if (req.body.name.length > 255) {
    return next(new AppError(Errors.InvalidNameLength));
  }
  if (!req.body.default_symbol || !req.body.default_symbol.trim()) {
    return next(new AppError(Errors.NoSymbol));
  }
  if (req.body.default_symbol.length > 9) {
    return next(new AppError(Errors.InvalidSymbolLength));
  }
  if (!req.body.type || !req.body.type.trim()) {
    return next(new AppError(Errors.NoType));
  }
  if (!req.body.base || !req.body.base.trim()) {
    return next(new AppError(Errors.NoBase));
  }

  const existingBaseChain = await models.Chain.findOne({
    where: {base: req.body.base},
  });
  if (!existingBaseChain) {
    return next(new AppError(Errors.InvalidBase));
  }

  // TODO: refactor this to use existing nodes rather than always creating one

  let eth_chain_id: number = null;
  let url = req.body.node_url;
  let altWalletUrl = req.body.alt_wallet_url;
  let privateUrl: string | undefined;
  let sanitizedSpec;

  // always generate a chain id
  if (req.body.base === ChainBase.Ethereum) {
    if (!req.body.eth_chain_id || !+req.body.eth_chain_id) {
      return next(new AppError(Errors.InvalidChainId));
    }
    eth_chain_id = +req.body.eth_chain_id;
  }

  // if not offchain, also validate the address
  if (
    req.body.base === ChainBase.Ethereum &&
    req.body.type !== ChainType.Offchain
  ) {
    if (!Web3.utils.isAddress(req.body.address)) {
      return next(new AppError(Errors.InvalidAddress));
    }

    // override provided URL for eth chains (typically ERC20) with stored, unless none found
    const node = await models.ChainNode.scope('withPrivateData').findOne({
      where: {
        eth_chain_id,
      }
    });
    if (!node && !req.user.isAdmin) {
      // if creating a new ETH node, must be admin -- users cannot submit custom URLs
      return next(new AppError(Errors.NotAdmin));
    }
    if (!node && !url) {
      // must provide at least url to create a new node
      return next(new AppError(Errors.InvalidChainIdOrUrl));
    }
    if (node) {
      url = node.url;
      altWalletUrl = node.alt_wallet_url;
      privateUrl = node.private_url;
    }

    const provider = new Web3.providers.WebsocketProvider(privateUrl || url);
    const web3 = new Web3(provider);
    const code = await web3.eth.getCode(req.body.address);
    provider.disconnect(1000, 'finished');
    if (code === '0x') {
      return next(new AppError(Errors.InvalidAddress));
    }

    // TODO: test altWalletUrl if available
  } else if (
    req.body.base === ChainBase.Solana &&
    req.body.type !== ChainType.Offchain
  ) {
    let pubKey: solw3.PublicKey;
    try {
      pubKey = new solw3.PublicKey(req.body.address);
    } catch (e) {
      return next(new AppError(Errors.InvalidAddress));
    }
    try {
      const clusterUrl = solw3.clusterApiUrl(url as Cluster);
      const connection = new solw3.Connection(clusterUrl);
      const supply = await connection.getTokenSupply(pubKey);
      const {decimals, amount} = supply.value;
      if (new BN(amount, 10).isZero()) {
        throw new AppError('Invalid supply amount');
      }
    } catch (e) {
      return next(new AppError(Errors.InvalidNodeUrl));
    }
  } else if (
    req.body.base === ChainBase.CosmosSDK &&
    req.body.type !== ChainType.Offchain
  ) {
    // test cosmos endpoint validity -- must be http(s)
    if (!urlHasValidHTTPPrefix(url)) {
      return next(new AppError(Errors.InvalidNodeUrl));
    }
    try {
      const tmClient = await Tendermint34Client.connect(url);
      const {block} = await tmClient.block();
    } catch (err) {
      return next(new ServerError(Errors.InvalidNode));
    }

    // TODO: test altWalletUrl if available
  } else if (req.body.base === ChainBase.Substrate && req.body.type !== ChainType.Offchain) {
    const spec = req.body.substrate_spec || '{}';
    if (req.body.substrate_spec) {
      try {
        sanitizedSpec = await testSubstrateSpec(spec, req.body.node_url);
      } catch (e) {
        return next(new ServerError(Errors.InvalidNode));
      }
    }

  } else {
    if (!url || !url.trim()) {
      return next(new AppError(Errors.InvalidNodeUrl));
    }
    if (!urlHasValidHTTPPrefix(url) && !url.match(/wss?:\/\//)) {
      return next(new AppError(Errors.InvalidNodeUrl));
    }
  }

  const {
    id,
    name,
    default_symbol,
    icon_url,
    description,
    network,
    type,
    website,
    discord,
    telegram,
    github,
    element,
    base,
    bech32_prefix,
    token_name,
  } = req.body;
  if (website && !urlHasValidHTTPPrefix(website)) {
    return next(new AppError(Errors.InvalidWebsite));
  } else if (discord && !urlHasValidHTTPPrefix(discord)) {
    return next(new AppError(Errors.InvalidDiscord));
  } else if (element && !urlHasValidHTTPPrefix(element)) {
    return next(new AppError(Errors.InvalidElement));
  } else if (telegram && !telegram.startsWith('https://t.me/')) {
    return next(new AppError(Errors.InvalidTelegram));
  } else if (github && !github.startsWith('https://github.com/')) {
    return next(new AppError(Errors.InvalidGithub));
  } else if (icon_url && !urlHasValidHTTPPrefix(icon_url)) {
    return next(new AppError(Errors.InvalidIconUrl));
  }

  const oldChain = await models.Chain.findOne({
    where: {[Op.or]: [{name: req.body.name}, {id: req.body.id}]},
  });
  if (oldChain && oldChain.id === req.body.id) {
    return next(new AppError(Errors.ChainIDExists));
  }
  if (oldChain && oldChain.name === req.body.name) {
    return next(new AppError(Errors.ChainNameExists));
  }

  const [node] = await models.ChainNode.scope('withPrivateData').findOrCreate({
    where: {url},
    defaults: {
      eth_chain_id,
      alt_wallet_url: altWalletUrl,
      private_url: privateUrl,
      balance_type: base === ChainBase.CosmosSDK
        ? BalanceType.Cosmos
        : base === ChainBase.Substrate
        ? BalanceType.Substrate
        : base === ChainBase.Ethereum
        ? BalanceType.Ethereum
        // beyond here should never really happen, but just to make sure...
        : base === ChainBase.NEAR
        ? BalanceType.NEAR
        : base === ChainBase.Solana
        ? BalanceType.Solana
        : undefined,
      // use first chain name as node name
      name: req.body.name,
    }
  });

  const chain = await models.Chain.create({
    id,
    name,
    default_symbol,
    icon_url,
    description,
    network,
    type,
    website,
    discord,
    telegram,
    github,
    element,
    base,
    bech32_prefix,
    active: true,
    substrate_spec: sanitizedSpec || '',
    chain_node_id: node.id,
    token_name,
    has_chain_events_listener: network === 'aave' || network === 'compound'
  });

  await createDefaultCommunityRoles(models, chain.id)

  if (req.body.address) {
    const [contract] = await models.Contract.findOrCreate({
      where: {
        address: req.body.address,
        chain_node_id: node.id,
      },
      defaults: {
        address: req.body.address,
        chain_node_id: node.id,
        decimals: req.body.decimals,
        token_name: chain.token_name,
        symbol: chain.default_symbol,
        type: chain.network,
      }
    });

    await models.CommunityContract.create({
      chain_id: chain.id,
      contract_id: contract.id,
    });

    chain.Contract = contract;
  }

  const nodeJSON = node.toJSON();
  delete nodeJSON.private_url;

  const chatChannels = await models.ChatChannel.create({
    name: 'General',
    chain_id: chain.id,
    category: 'General',
  });

  const topics = await models.Topic.create({
    chain_id: chain.id,
    name: 'General'
  })

  // try to make admin one of the user's addresses
  // TODO: @Zak extend functionality here when we have Bases + Wallets refactored
  let role: RoleInstance | undefined;
  let addressToBeAdmin: AddressInstance | undefined;

  if (chain.base === ChainBase.Ethereum) {
    addressToBeAdmin = await models.Address.findOne({
      where: {
        user_id: req.user.id,
        address: {
          [Op.startsWith]: '0x'
        }
      },
      include: [{
        model: models.Chain,
        where: {base: chain.base},
        required: true,
      }]
    });
  } else if (chain.base === ChainBase.NEAR) {
    addressToBeAdmin = await models.Address.findOne({
      where: {
        user_id: req.user.id,
        address: {
          [Op.endsWith]: '.near'
        }
      },
      include: [{
        model: models.Chain,
        where: {base: chain.base},
        required: true,
      }]
    });
  } else if (chain.base === ChainBase.Solana) {
    addressToBeAdmin = await models.Address.findOne({
      where: {
        user_id: req.user.id,
        address: {
          // This is the regex formatting for solana addresses per their website
          [Op.regexp]: '[1-9A-HJ-NP-Za-km-z]{32,44}'
        }
      },
      include: [{
        model: models.Chain,
        where: {base: chain.base},
        required: true,
      }]
    });
  }

  if (addressToBeAdmin) {
    await createRole(models, addressToBeAdmin.id, chain.id, 'admin', true);

    const [subscription] = await models.Subscription.findOrCreate({
      where: {
        subscriber_id: req.user.id,
        category_id: NotificationCategories.NewThread,
        chain_id: chain.id,
        object_id: chain.id,
        is_active: true,
      }
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    mixpanelTrack({
      chainBase: req.body.base,
      isCustomDomain: null,
      communityType: null,
      event: MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
    });
  }

  return success(res, {
    chain: chain.toJSON(),
    node: nodeJSON,
    role: role?.toJSON(),
    admin_address: addressToBeAdmin?.address,
  });
};

export default createChain;
