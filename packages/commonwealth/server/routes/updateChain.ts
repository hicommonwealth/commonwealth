import { NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainBase } from 'common-common/src/types';
import { Action } from 'common-common/src/permissions';
import { urlHasValidHTTPPrefix } from '../../shared/utils';
import { DB } from '../models';
import { ChainAttributes } from '../models/chain';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { AppError, ServerError } from '../util/errors';
import { findOneRole } from '../util/roles';
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
  SnapshotOnlyOnEthereum:
    'Snapshot data may only be added to chains with Ethereum base',
  InvalidTerms: 'Terms of Service must begin with https://',
};

type UpdateChainReq = ChainAttributes & {
  id: string;
  'featured_topics[]'?: string[];
  'snapshot[]'?: string[];
};

type UpdateChainResp = ChainAttributes;

const updateChain = async (
  models: DB,
  req: TypedRequestBody<UpdateChainReq>,
  res: TypedResponse<UpdateChainResp>,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.id) return next(new AppError(Errors.NoChainId));
  if (req.body.network) return next(new AppError(Errors.CantChangeNetwork));

  const chain = await models.Chain.findOne({ where: { id: req.body.id } });
  if (!chain) return next(new AppError(Errors.NoChainFound));
  else {
    const userAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const userMembership = await findOneRole(
      models,
      { where: { address_id: { [Op.in]: userAddressIds } } },
      chain.id,
      ['admin']
    );
    if (!req.user.isAdmin && !userMembership) {
      return next(new AppError(Errors.NotAdmin));
    }
  }

  const {
    active,
    icon_url,
    default_symbol,
    type,
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
    default_allow_permissions,
    default_deny_permissions,
    default_summary_view,
    terms,
  } = req.body;

  let snapshot = req.body['snapshot[]'];

  // Handle single string case and undefined case
  if (snapshot !== undefined && typeof snapshot === 'string') {
    snapshot = [snapshot];
  } else if (snapshot === undefined) {
    snapshot = [];
  }

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
  } else if (custom_domain && custom_domain.includes('commonwealth')) {
    return next(new AppError(Errors.InvalidCustomDomain));
  } else if (
    snapshot.some(
      (snapshot_space) =>
        snapshot_space !== '' &&
        snapshot_space.slice(snapshot_space.length - 4) !== '.eth'
    )
  ) {
    return next(new AppError(Errors.InvalidSnapshot));
  } else if (snapshot.length > 0 && chain.base !== ChainBase.Ethereum) {
    return next(new AppError(Errors.SnapshotOnlyOnEthereum));
  } else if (terms && !urlHasValidHTTPPrefix(terms)) {
    return next(new AppError(Errors.InvalidTerms));
  }

  if (name) chain.name = name;
  if (description) chain.description = description;
  if (default_symbol) chain.default_symbol = default_symbol;
  if (icon_url) chain.icon_url = icon_url;
  if (active !== undefined) chain.active = active;
  if (type) chain.type = type;
  if (website) chain.website = website;
  if (discord) chain.discord = discord;
  if (element) chain.element = element;
  if (telegram) chain.telegram = telegram;
  if (github) chain.github = github;
  if (stages_enabled) chain.stages_enabled = stages_enabled;
  if (custom_stages) chain.custom_stages = custom_stages;
  if (terms) chain.terms = terms;
  if (snapshot) chain.snapshot = snapshot;
  // Set default allow/deny permissions
  chain.default_allow_permissions = default_allow_permissions || BigInt(0);
  chain.default_deny_permissions = default_deny_permissions || BigInt(0);
  // TODO Graham 3/31/22: Will this potentially lead to undesirable effects if toggle
  // is left un-updated? Is there a better approach?
  chain.default_summary_view = default_summary_view || false;

  // Under our current security policy, custom domains must be set by trusted
  // administrators only. Otherwise an attacker could configure a custom domain and
  // use the code they run to steal login tokens for arbitrary users.
  //
  // chain.custom_domain = custom_domain;

  await chain.save();

  // Suggested solution for serializing BigInts
  // https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-1006086291
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  return success(res, chain.toJSON());
};

export default updateChain;
