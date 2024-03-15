import { Op, QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';

import { AppError } from '@hicommonwealth/core';
import { flatten, uniq } from 'lodash';
import moment from 'moment';
import { contractHelpers } from '../../../../../libs/model/src/services/commonProtocol';
import { buildPaginatedResponse } from '../../util/queries';
import { RoleInstanceWithPermission, findAllRoles } from '../../util/roles';
import { ServerProfilesController } from '../server_profiles_controller';

export const Errors = {
  StakeNotFound: 'Stake not found',
  StakeholderGroup: 'Stakeholder group not found',
  ChainNodeNotFound: 'Chain node not found',
  CommunityNotFound: 'Community not found',
};

export type MembershipFilters =
  | 'in-group'
  | `in-group:${number}`
  | 'not-in-group';

export type GetMemberProfilesOptions = {
  communityId: string;
  search: string;
  includeRoles?: boolean;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  memberships?: MembershipFilters;
  includeGroupIds?: boolean;
  includeStakeBalances?: boolean;
};

type Profile = {
  id: number;
  user_id: string;
  profile_name: string;
  avatar_url: string;
  addresses: {
    id: number;
    chain: string;
    address: string;
    stake_balance?: string;
  }[];
  roles?: any[];
  group_ids: number[];
};
export type GetCommunityMembersResult = TypedPaginatedResult<Profile>;

export async function __getCommunityMembers(
  this: ServerProfilesController,
  {
    communityId,
    search,
    includeRoles,
    limit,
    page,
    orderBy,
    orderDirection,
    memberships,
    includeGroupIds,
    includeStakeBalances,
  }: GetMemberProfilesOptions,
): Promise<GetCommunityMembersResult> {
  const community = await this.models.Community.findByPk(communityId);
  if (!community) {
    throw new AppError(Errors.CommunityNotFound);
  }
  page = Math.max(1, page);

  const bind: any = {
    searchTerm: `%${search}%`,
  };
  if (community) {
    bind.community_id = community.id;
  }

  const communityWhere = bind.community_id
    ? `"Addresses".community_id = $community_id AND`
    : '';

  const groupIdFromMemberships = parseInt(
    ((memberships || '').match(/in-group:(\d+)/) || [`0`, `0`])[1],
  );
  let membershipsWhere = memberships
    ? `SELECT 1 FROM "Memberships"
    JOIN "Groups" ON "Groups".id = "Memberships".group_id
    WHERE "Memberships".address_id = "Addresses".id
    AND "Groups".community_id = $community_id
    ${
      groupIdFromMemberships
        ? `AND "Groups".id = ${groupIdFromMemberships}`
        : ''
    }
    `
    : '';

  if (memberships) {
    switch (memberships) {
      case 'in-group':
      case `in-group:${groupIdFromMemberships}`:
        membershipsWhere = `AND EXISTS (${membershipsWhere} AND "Memberships".reject_reason IS NULL)`;
        break;
      case 'not-in-group':
        membershipsWhere = `AND NOT EXISTS (${membershipsWhere} AND "Memberships".reject_reason IS NULL)`;
        break;
      default:
        throw new AppError(`unsupported memberships param: ${memberships}`);
    }
  }

  const sqlWithoutPagination = `
    SELECT
      "Profiles".id,
      "Profiles".user_id,
      "Profiles".profile_name,
      "Profiles".avatar_url,
      "Profiles".created_at,
      array_agg("Addresses".id) as address_ids,
      array_agg("Addresses".community_id) as chains,
      array_agg("Addresses".address) as addresses,
      MAX("Addresses".last_active) as last_active
    FROM
      "Profiles"
    JOIN
      "Addresses" ON "Profiles".user_id = "Addresses".user_id
    WHERE
      ${communityWhere}
      (
        "Profiles".profile_name ILIKE '%' || $searchTerm || '%'
        OR
        "Addresses".address ILIKE '%' || $searchTerm || '%'
      )
      ${membershipsWhere}
    GROUP BY
      "Profiles".id
  `;

  const fullResults = await this.models.sequelize.query<{
    id: number;
    user_id: number;
    profile_name: string;
    avatar_url: string;
    created_at: string;
    address_id: string[];
    chains: string[];
    addresses: string[];
    stake_balances: string[];
    last_active: string;
  }>(`${sqlWithoutPagination}`, {
    bind,
    type: QueryTypes.SELECT,
  });
  const totalResults = fullResults.length;

  if (includeStakeBalances) {
    const stake = await this.models.CommunityStake.findOne({
      where: { community_id: community.id },
    });
    if (!stake) {
      throw new AppError(Errors.StakeNotFound);
    }
    const stakeholderGroup = await this.models.Group.findOne({
      where: {
        community_id: community.id,
        is_system_managed: true,
      },
    });
    if (!stakeholderGroup) {
      throw new AppError(Errors.StakeholderGroup);
    }
    const node = await this.models.ChainNode.findByPk(community.chain_node_id);
    if (!node) {
      throw new AppError(Errors.ChainNodeNotFound);
    }
    const addresses = fullResults.map((p) => p.addresses).flat();
    const balances = await contractHelpers.getNamespaceBalance(
      community.namespace,
      stake.stake_id,
      node.eth_chain_id,
      addresses,
      node.url,
    );
    // add balances to profiles
    for (const profile of fullResults) {
      for (const address of profile.addresses) {
        profile.stake_balances ||= [];
        profile.stake_balances.push(balances[address] || '0');
      }
    }
  }

  const paginatedResults = fullResults
    .slice()
    .sort((a, b) => {
      let comparison = 0;
      switch (orderBy) {
        case 'created_at':
          comparison = moment(a.created_at).isAfter(b.created_at) ? 1 : -1;
          break;
        case 'profile_name':
          comparison = a.profile_name.localeCompare(b.profile_name);
          break;
        default:
          comparison = moment(a.last_active).isAfter(b.last_active) ? 1 : -1;
      }
      // Adjust sort order based on orderDirection
      return orderDirection === 'DESC' ? -comparison : comparison;
    })
    .slice((page - 1) * limit, page * limit);

  const profilesWithAddresses: Profile[] = paginatedResults.map(
    (profile: any) => {
      return {
        id: profile.id,
        user_id: profile.user_id,
        profile_name: profile.profile_name,
        avatar_url: profile.avatar_url,
        addresses: profile.address_ids.map((_, i) => {
          const address: any = {
            id: profile.address_ids[i],
            chain: profile.chains[i],
            address: profile.addresses[i],
          };
          if (profile.stake_balances) {
            address.stake_balance = profile.stake_balances?.[i] || '0';
          }
          return address;
        }),
        roles: [],
        group_ids: [],
      };
    },
  );

  if (includeRoles) {
    const profileAddressIds = profilesWithAddresses.reduce((acc, p) => {
      const ids = p.addresses.map((addr) => addr.id);
      return [...acc, ...ids];
    }, []);

    const roles = await findAllRoles(
      this.models,
      {
        where: {
          address_id: {
            [Op.in]: uniq(profileAddressIds),
          },
        },
      },
      community?.id,
      ['member', 'moderator', 'admin'],
    );

    const addressIdRoles: Record<number, RoleInstanceWithPermission[]> = {};
    for (const role of roles) {
      const attributes = role.toJSON();
      addressIdRoles[attributes.address_id] = [];
      addressIdRoles[attributes.address_id].push(role);
    }

    // add roles to associated profiles in response
    for (const profile of profilesWithAddresses) {
      for (const address of profile.addresses) {
        const addressRoles = addressIdRoles[address.id] || [];
        for (const role of addressRoles) {
          profile.roles.push(role.toJSON());
        }
      }
    }
  }

  if (includeGroupIds) {
    const addressIds = uniq(
      flatten(profilesWithAddresses.map((p) => p.addresses)).map((a) => a.id),
    );
    const existingMemberships = await this.models.Membership.findAll({
      where: {
        address_id: {
          [Op.in]: addressIds,
        },
        reject_reason: null,
      },
    });
    // add group IDs to profiles
    for (const profile of profilesWithAddresses) {
      profile.group_ids = uniq(
        existingMemberships
          .filter((m) => {
            return profile.addresses.map((a) => a.id).includes(m.address_id);
          })
          .map((m) => m.group_id),
      );
    }
  }

  return buildPaginatedResponse(profilesWithAddresses, totalResults, {
    limit,
    offset: limit * (page - 1),
  });
}
