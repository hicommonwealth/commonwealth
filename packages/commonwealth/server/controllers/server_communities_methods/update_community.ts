/* eslint-disable no-continue */
import { AppError } from '@hicommonwealth/adapters';
import { ChainBase } from '@hicommonwealth/core';
import type {
  CommunityAttributes,
  CommunitySnapshotSpaceWithSpaceAttached,
} from '@hicommonwealth/model';
import { UserInstance } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { urlHasValidHTTPPrefix } from '../../../shared/utils';
import { ALL_COMMUNITIES } from '../../middleware/databaseValidationService';
import { validateNamespace } from '../../util/commonProtocol/newNamespaceValidator';
import { findOneRole } from '../../util/roles';
import { TrackOptions } from '../server_analytics_methods/track';
import { ServerCommunitiesController } from '../server_communities_controller';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoCommunityId: 'Must provide community ID',
  ReservedId: 'The id is reserved and cannot be used',
  CantChangeNetwork: 'Cannot change community network',
  NotAdmin: 'Not an admin',
  NoCommunityFound: 'Community not found',
  InvalidSocialLink: 'Social Link must begin with http(s)://',
  InvalidCustomDomain: 'Custom domain may not include "commonwealth"',
  InvalidSnapshot: 'Snapshot must fit the naming pattern of *.eth or *.xyz',
  SnapshotOnlyOnEthereum:
    'Snapshot data may only be added to chains with Ethereum base',
  InvalidTerms: 'Terms of Service must begin with https://',
  InvalidDefaultPage: 'Default page does not exist',
  InvalidTransactionHash: 'Valid transaction hash required to verify namespace',
};

export type UpdateCommunityOptions = CommunityAttributes & {
  user: UserInstance;
  featuredTopics?: string[];
  snapshot?: string[];
  transactionHash?: string;
};
export type UpdateCommunityResult = CommunityAttributes & {
  snapshot: string[];
  analyticsOptions: TrackOptions;
};

export async function __updateCommunity(
  this: ServerCommunitiesController,
  { user, id, network, ...rest }: UpdateCommunityOptions,
): Promise<UpdateCommunityResult> {
  if (!user) {
    throw new AppError(Errors.NotLoggedIn);
  }
  if (!id) {
    throw new AppError(Errors.NoCommunityId);
  }
  if (id === ALL_COMMUNITIES) {
    throw new AppError(Errors.ReservedId);
  }
  if (network) {
    throw new AppError(Errors.CantChangeNetwork);
  }

  const community = await this.models.Community.findOne({ where: { id: id } });
  let addresses;
  if (!community) {
    throw new AppError(Errors.NoCommunityFound);
  } else {
    addresses = (await user.getAddresses()).filter((addr) => !!addr.verified);
    const userAddressIds = addresses.map((addr) => addr.id);
    const userMembership = await findOneRole(
      this.models,
      { where: { address_id: { [Op.in]: userAddressIds } } },
      community.id,
      ['admin'],
    );
    if (!user.isAdmin && !userMembership) {
      throw new AppError(Errors.NotAdmin);
    }
  }

  const {
    active,
    icon_url,
    default_symbol,
    type,
    name,
    description,
    social_links,
    hide_projects,
    stages_enabled,
    custom_stages,
    custom_domain,
    default_summary_view,
    default_page,
    has_homepage,
    terms,
    chain_node_id,
    directory_page_enabled,
    directory_page_chain_node_id,
    namespace,
    transactionHash,
  } = rest;

  // Handle single string case and undefined case
  let { snapshot } = rest;
  if (snapshot !== undefined && typeof snapshot === 'string') {
    snapshot = [snapshot];
  } else if (snapshot === undefined) {
    snapshot = [];
  }

  const nonEmptySocialLinks = social_links?.filter((s) => s && s !== '');
  const invalidSocialLinks = nonEmptySocialLinks?.filter(
    (s) => !urlHasValidHTTPPrefix(s),
  );
  if (nonEmptySocialLinks && invalidSocialLinks.length > 0) {
    throw new AppError(`${invalidSocialLinks[0]}: ${Errors.InvalidSocialLink}`);
  } else if (custom_domain && custom_domain.includes('commonwealth')) {
    throw new AppError(Errors.InvalidCustomDomain);
  } else if (
    snapshot.some((snapshot_space) => {
      const lastFour = snapshot_space.slice(snapshot_space.length - 4);
      return (
        snapshot_space !== '' && lastFour !== '.eth' && lastFour !== '.xyz'
      );
    })
  ) {
    throw new AppError(Errors.InvalidSnapshot);
  } else if (snapshot.length > 0 && community.base !== ChainBase.Ethereum) {
    throw new AppError(Errors.SnapshotOnlyOnEthereum);
  } else if (terms && !urlHasValidHTTPPrefix(terms)) {
    throw new AppError(Errors.InvalidTerms);
  }

  const snapshotSpaces: CommunitySnapshotSpaceWithSpaceAttached[] =
    await this.models.CommunitySnapshotSpaces.findAll({
      where: { community_id: community.id },
      include: {
        model: this.models.SnapshotSpace,
        as: 'snapshot_space',
      },
    });

  // Check if any snapshot spaces are being removed
  const removedSpaces = snapshotSpaces.filter((space) => {
    return !snapshot.includes(space.snapshot_space.snapshot_space);
  });
  const existingSpaces = snapshotSpaces.filter((space) => {
    return snapshot.includes(space.snapshot_space.snapshot_space);
  });
  const existingSpaceNames = existingSpaces.map((space) => {
    return space.snapshot_space.snapshot_space;
  });

  for (const spaceName of snapshot) {
    // check if its in the mapping
    if (!existingSpaceNames.includes(spaceName)) {
      const spaceModelInstance = await this.models.SnapshotSpace.findOrCreate({
        where: { snapshot_space: spaceName },
      });

      // if it isnt, create it
      await this.models.CommunitySnapshotSpaces.create({
        snapshot_space_id: spaceModelInstance[0].snapshot_space,
        community_id: community.id,
      });
    }
  }

  // delete unwanted associations
  for (const removedSpace of removedSpaces) {
    await this.models.CommunitySnapshotSpaces.destroy({
      where: {
        snapshot_space_id: removedSpace.snapshot_space_id,
        community_id: community.id,
      },
    });
  }

  if (name) community.name = name;
  if (description) community.description = description;
  if (default_symbol) community.default_symbol = default_symbol;
  if (icon_url) community.icon_url = icon_url;
  if (active !== undefined) community.active = active;
  if (type) community.type = type;
  if (nonEmptySocialLinks !== undefined && nonEmptySocialLinks.length >= 0)
    community.social_links = nonEmptySocialLinks;
  if (hide_projects) community.hide_projects = hide_projects;
  if (typeof stages_enabled === 'boolean')
    community.stages_enabled = stages_enabled;
  if (typeof custom_stages === 'string')
    community.custom_stages = custom_stages;
  if (typeof terms === 'string') community.terms = terms;
  if (has_homepage) community.has_homepage = has_homepage;
  if (default_page) {
    if (!has_homepage) {
      throw new AppError(Errors.InvalidDefaultPage);
    } else {
      community.default_page = default_page;
    }
  }
  if (chain_node_id) {
    community.chain_node_id = chain_node_id;
  }

  let mixpanelEvent: MixpanelCommunityInteractionEvent;
  let communitySelected = null;

  if (community.directory_page_enabled !== directory_page_enabled) {
    mixpanelEvent = directory_page_enabled
      ? MixpanelCommunityInteractionEvent.DIRECTORY_PAGE_ENABLED
      : MixpanelCommunityInteractionEvent.DIRECTORY_PAGE_DISABLED;

    if (directory_page_enabled) {
      communitySelected = await this.models.Community.findOne({
        where: { chain_node_id: directory_page_chain_node_id },
      });
    }
  }

  if (directory_page_enabled !== undefined) {
    community.directory_page_enabled = directory_page_enabled;
  }
  if (directory_page_chain_node_id !== undefined) {
    community.directory_page_chain_node_id = directory_page_chain_node_id;
  }
  if (namespace !== undefined) {
    if (!transactionHash) {
      throw new AppError(Errors.InvalidTransactionHash);
    }

    const ownerOfChain = addresses.find(
      (a) => a.community_id === community.id && a.role === 'admin',
    );
    if (!ownerOfChain) {
      throw new AppError(Errors.NotAdmin);
    }

    await validateNamespace(
      this.models,
      this.tokenBalanceCache,
      namespace,
      transactionHash,
      ownerOfChain.address,
      community.id,
    );

    community.namespace = namespace;
  }

  // TODO Graham 3/31/22: Will this potentially lead to undesirable effects if toggle
  // is left un-updated? Is there a better approach?
  community.default_summary_view = default_summary_view || false;

  // Under our current security policy, custom domains must be set by trusted
  // administrators only. Otherwise an attacker could configure a custom domain and
  // use the code they run to steal login tokens for arbitrary users.
  //
  // chain.custom_domain = custom_domain;

  await community.save();

  // Suggested solution for serializing BigInts
  // https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-1006086291
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const analyticsOptions = {
    event: mixpanelEvent,
    community: community.id,
    userId: user.id,
    isCustomDomain: null,
    ...(communitySelected && { communitySelected: communitySelected.id }),
  };

  return { ...community.toJSON(), snapshot, analyticsOptions };
}
