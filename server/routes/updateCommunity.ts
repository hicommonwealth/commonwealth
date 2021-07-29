import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { urlHasValidHTTPPrefix } from '../../shared/utils';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommunityId: 'Must provide community ID',
  CantChangeNetwork: 'Cannot change community network',
  CommunityNotFound: 'Community not found',
  NotAdmin: 'Not an admin',
  InvalidWebsite: 'Website must begin with https://',
  InvalidDiscord: 'Discord must begin with https://',
  InvalidElement: 'Element must begin with https://',
  InvalidTelegram: 'Telegram must begin with https://t.me/',
  InvalidGithub: 'Github must begin with https://github.com/',
  InvalidCustomDomain: 'Custom domain may not include "commonwealth"',
  InvalidTerms: 'Terms of Service must begin with https://',
};

const updateCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.id) return next(new Error(Errors.NoCommunityId));
  if (req.body.network) return next(new Error(Errors.CantChangeNetwork));

  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.id }
  });
  if (!community) return next(new Error(Errors.CommunityNotFound));
  else {
    const userAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const userRole = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });
    if (!userRole || userRole.permission !== 'admin') {
      return next(new Error(Errors.NotAdmin));
    }
  }

  const { iconUrl, name, description, website, discord, element, telegram, github, stagesEnabled, additionalStages, customDomain, invites, privacy, terms } = req.body;

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
  } else if (terms && !urlHasValidHTTPPrefix(terms)) {
    return next(new Error(Errors.InvalidTerms));
  }

  if (req.body.name) community.name = req.body.name;
  if (req.body['featured_topics[]']) community.featured_topics = req.body['featured_topics[]'];
  community.description = description;
  community.iconUrl = iconUrl;
  community.website = website;
  community.discord = discord;
  community.element = element;
  community.telegram = telegram;
  community.github = github;
  community.stagesEnabled = stagesEnabled;
  community.additionalStages = additionalStages;
  community.customDomain = customDomain;
  community.terms = terms;
  community.invitesEnabled = invites || false;
  community.privacyEnabled = privacy || false;
  await community.save();

  // @TODO -> make sure this gets changed... on the front end, only allow one image to be attached
  if (req.body['attachments[]']) {
    await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
      attachable: 'community',
      attachment_id: community.id,
      description: 'image',
      url,
    })));

    const finalCommunity = await models.OffchainCommunity.findOne({
      where: { id: community.id },
      include: [ models.Address, models.OffchainAttachment ],
    });

    return res.json({ status: 'Success', result: finalCommunity.toJSON() });
  }

  return res.json({ status: 'Success', result: community.toJSON() });
};

export default updateCommunity;
