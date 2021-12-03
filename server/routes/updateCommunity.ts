import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { urlHasValidHTTPPrefix } from '../../shared/utils';
import { DB } from '../database';

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

const updateCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.id) return next(new Error(Errors.NoCommunityId));
  if (req.body.network) return next(new Error(Errors.CantChangeNetwork));

  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.id },
  });
  if (!community) return next(new Error(Errors.CommunityNotFound));
  else {
    const userAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const userRole = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });
    if (!req.user.isAdmin && (!userRole || userRole.permission !== 'admin')) {
      return next(new Error(Errors.NotAdmin));
    }
  }

  const {
    icon_url,
    name,
    description,
    website,
    discord,
    element,
    telegram,
    github,
    stages_enabled,
    custom_stages,
    custom_domain,
    invites,
    privacy,
    default_summary_view,
    terms,
  } = req.body;

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
  } else if (custom_domain && custom_domain.includes('commonwealth')) {
    return next(new Error(Errors.InvalidCustomDomain));
  } else if (terms && !urlHasValidHTTPPrefix(terms)) {
    return next(new Error(Errors.InvalidTerms));
  }

  if (req.body.name) community.name = req.body.name;
  if (req.body['featured_topics[]'])
    community.featured_topics = req.body['featured_topics[]'];
  if (description) community.description = description;
  if (icon_url) community.icon_url = icon_url;
  if (website) community.website = website;
  if (discord) community.discord = discord;
  if (element) community.element = element;
  if (telegram) community.telegram = telegram;
  if (github) community.github = github;
  if (stages_enabled) community.stages_enabled = stages_enabled;
  if (custom_stages) community.custom_stages = custom_stages;
  if (terms) community.terms = terms;
  community.invites_enabled = invites || false;
  community.privacy_enabled = privacy || false;
  community.default_summary_view = default_summary_view || false;
  // Under our current security policy, custom domains must be set by trusted
  // administrators only. Otherwise an attacker could configure a custom domain and
  // use the code they run to steal login tokens for arbitrary users.
  //
  // community.custom_domain = custom_domain;
  await community.save();

  // @TODO -> make sure this gets changed... on the front end, only allow one image to be attached
  if (req.body['attachments[]']) {
    await Promise.all(
      req.body['attachments[]'].map((url) =>
        models.OffchainAttachment.create({
          attachable: 'community',
          // @ts-ignore
          attachment_id: community.id,
          description: 'image',
          url,
        })
      )
    );

    const finalCommunity = await models.OffchainCommunity.findOne({
      where: { id: community.id },
      include: [models.Address, models.OffchainAttachment],
    });

    return res.json({ status: 'Success', result: finalCommunity.toJSON() });
  }

  return res.json({ status: 'Success', result: community.toJSON() });
};

export default updateCommunity;
