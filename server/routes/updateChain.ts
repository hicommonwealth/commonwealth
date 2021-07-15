import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { urlHasValidHTTPPrefix } from '../../shared/utils';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoChainId: 'Must provide chain ID',
  CantChangeNetwork: 'Cannot change chain network',
  NotAdmin: 'Not an admin',
  NoChainFound: 'Chain not found',
  InvalidWebsite: 'Website must begin with https://',
  InvalidDiscord: 'Discord must begin with https://',
  InvalidElement: 'Element must begin with https://',
  InvalidTelegram: 'Telegram must begin with https://t.me/',
  InvalidGithub: 'Github must begin with https://github.com/',
  InvalidCustomDomain: 'Custom domain may not include "commonwealth"',
  InvalidSnapshot: 'Snapshot must fit the naming pattern of *.eth',
  SnapshotOnlyOnEthereum: 'Snapshot data may only be added to chains with Ethereum base'
};

const updateChain = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.id) return next(new Error(Errors.NoChainId));
  if (req.body.network) return next(new Error(Errors.CantChangeNetwork));

  const chain = await models.Chain.findOne({ where: { id: req.body.id } });
  if (!chain) return next(new Error(Errors.NoChainFound));
  else {
    const userAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
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

  const { active, icon_url, symbol, type, name, description, website, discord, element, telegram, github, stagesEnabled, additionalStages, customDomain, snapshot } = req.body;

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
  } else if (customDomain && customDomain.includes('commonwealth')) {
    return next(new Error(Errors.InvalidCustomDomain));
  } else if (snapshot && !(/^[a-z]+\.eth/).test(snapshot)) {
    return next(new Error(Errors.InvalidSnapshot));
  } else if (snapshot && chain.base !== 'ethereum') {
    return next(new Error(Errors.SnapshotOnlyOnEthereum));
  }

  if (name) chain.name = name;
  if (description) chain.description = description;
  if (symbol) chain.symbol = symbol;
  if (icon_url) chain.icon_url = icon_url;
  if (active !== undefined) chain.active = active;
  if (type) chain.type = type;
  chain.website = website;
  chain.discord = discord;
  chain.element = element;
  chain.telegram = telegram;
  chain.github = github;
  chain.stagesEnabled = stagesEnabled;
  chain.additionalStages = additionalStages;
  chain.customDomain = customDomain;
  if (chain.base === 'ethereum') chain.snapshot = snapshot;
  if (req.body['featured_topics[]']) chain.featured_topics = req.body['featured_topics[]'];

  await chain.save();

  return res.json({ status: 'Success', result: chain.toJSON() });
};

export default updateChain;
