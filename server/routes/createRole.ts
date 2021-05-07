import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { NotificationCategories } from '../../shared/types';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { getTokensFromListsInternal } from './getTokensFromLists';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleAlreadyExists: 'Role already exists',
};

const checkNewChainInfoWithTokenList = async (newChainInfo) => {
  const tokens = await getTokensFromListsInternal()
  if( !newChainInfo.iconUrl ) throw new Error("Missing iconUrl");
  if( !newChainInfo.symbol ) throw new Error("Missing symbol");
  if( !newChainInfo.name ) throw new Error("Missing name");
  if( !newChainInfo.address ) throw new Error("Missing address");

  let token = tokens.find(o=> o.name == newChainInfo.name && 
    o.symbol == newChainInfo.symbol &&
    o.address == newChainInfo.address)
  return token;
}

const createChainForAddress = async (models, newChainInfo) => {
  try {
    const foundInList = await checkNewChainInfoWithTokenList(newChainInfo);
    if(!foundInList) {
      throw new Error("New chain not found in token list")
    }
    
    const createdId = newChainInfo.name.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    
    const chainContent = {
      id: createdId,
      active: true,
      network: createdId,
      type: "token",
      icon_url: newChainInfo.iconUrl,
      symbol: newChainInfo.symbol, 
      name: newChainInfo.name,
      default_chain: 'ethereum',
      base: 'ethereum',
    };

    const chainNodeContent = {
      chain: createdId,
      url: "wss://mainnet.infura.io/ws",
      address: newChainInfo.address
    }
    const chain = await models.Chain.create(chainContent);
    await models.ChainNode.create(chainNodeContent);

    return [chain, null, null]
  } catch(e) {
    return [null, null, e]
  }
}

const createRole = async (models, req, res: Response, next: NextFunction) => {
  let chain, community, error;
  if (req.body.isNewChain) {
    const newChain = {
      address: req.body[`newChainInfo[address]`],
      iconUrl: req.body[`newChainInfo[iconUrl]`],
      name: req.body[`newChainInfo[name]`],
      symbol: req.body[`newChainInfo[symbol]`],
    };
    [chain, community, error] = await createChainForAddress(models, newChain)
  } else {
    [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  }

  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address_id) return next(new Error(Errors.InvalidAddress));

  // cannot join private communities using this route
  if (community && community.privacyEnabled) return next(new Error(Errors.InvalidChainComm));

  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });
  if (!validAddress) return next(new Error(Errors.InvalidAddress));

  const [ role ] = await models.Role.findOrCreate({ where: chain ? {
    address_id: validAddress.id,
    chain_id: chain.id,
  } : {
    address_id: validAddress.id,
    offchain_community_id: community.id,
  } });

  const [ subscription ] = await models.Subscription.findOrCreate({
    where: chain ? {
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewThread,
      chain_id: chain.id,
      object_id: chain.id,
      is_active: true,
    } : {
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewThread,
      community_id: community.id,
      object_id: community.id,
      is_active: true,
    }
  });

  return res.json({ status: 'Success', result: { role: role.toJSON(), subscription: subscription.toJSON() } });
};

export default createRole;
