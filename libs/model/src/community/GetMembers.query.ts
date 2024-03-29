import { InvalidState, schemas, type Query } from '@hicommonwealth/core';
import { uniq } from 'lodash';
import moment from 'moment';
import { Op, QueryTypes } from 'sequelize';
import { models } from '../database';
import { contractHelpers } from '../services/commonProtocol';

const Errors = {
  StakeNotFound: 'Stake not found',
  StakeholderGroup: 'Stakeholder group not found',
  ChainNodeNotFound: 'Chain node not found',
  CommunityNotFound: 'Community not found',
};

export const GetMembers: Query<
  typeof schemas.queries.GetCommunityMembers
> = () => ({
  ...schemas.queries.GetCommunityMembers,
  auth: [],
  body: async ({ payload }) => {
    const community = await models.Community.findByPk(payload.community_id);
    if (!community) {
      throw new InvalidState(Errors.CommunityNotFound);
    }

    const bind: any = {
      searchTerm: `%${payload.search || ''}%`,
    };
    if (community) {
      bind.community_id = community.id;
    }

    const communityWhere = bind.community_id
      ? `"Addresses".community_id = $community_id AND`
      : '';

    const groupIdFromMemberships = parseInt(
      ((payload.memberships || '').match(/in-group:(\d+)/) || [`0`, `0`])[1],
    );
    let membershipsWhere = payload.memberships
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

    if (payload.memberships) {
      switch (payload.memberships) {
        case 'in-group':
        case `in-group:${groupIdFromMemberships}`:
          membershipsWhere = `AND EXISTS (${membershipsWhere} AND "Memberships".reject_reason IS NULL)`;
          break;
        case 'not-in-group':
          membershipsWhere = `AND NOT EXISTS (${membershipsWhere} AND "Memberships".reject_reason IS NULL)`;
          break;
        default:
          throw new InvalidState(
            `unsupported memberships param: ${payload.memberships}`,
          );
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
      array_agg("Addresses".community_id) as community_ids,
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

    const allCommunityProfiles = await models.sequelize.query<{
      id: number;
      user_id: number;
      profile_name: string;
      avatar_url: string;
      created_at: string;
      address_ids: string[];
      community_ids: string[];
      addresses: string[];
      stake_balances: string[];
      last_active: string;
    }>(`${sqlWithoutPagination}`, {
      bind,
      type: QueryTypes.SELECT,
    });
    const totalResults = allCommunityProfiles.length;

    if (payload.include_stake_balances) {
      const stake = await models.CommunityStake.findOne({
        where: { community_id: community.id },
      });
      if (!stake) {
        throw new InvalidState(Errors.StakeNotFound);
      }
      const stakeholderGroup = await models.Group.findOne({
        where: {
          community_id: community.id,
          is_system_managed: true,
        },
      });
      if (!stakeholderGroup) {
        throw new InvalidState(Errors.StakeholderGroup);
      }
      const node = await models.ChainNode.findByPk(community.chain_node_id);
      if (!node) {
        throw new InvalidState(Errors.ChainNodeNotFound);
      }
      const addresses = allCommunityProfiles.map((p) => p.addresses).flat();
      const balances = await contractHelpers.getNamespaceBalance(
        community.namespace!,
        stake.stake_id,
        node.eth_chain_id!,
        addresses,
        node.url,
      );
      // add balances to profiles
      for (const profile of allCommunityProfiles) {
        for (const address of profile.addresses) {
          profile.stake_balances ||= [];
          profile.stake_balances.push(balances[address] || '0');
        }
      }
    }

    const paginatedResults = allCommunityProfiles
      .slice()
      .sort((a, b) => {
        let comparison = 0;
        switch (payload.order_by) {
          case 'name':
            {
              const nameA = a.profile_name || '';
              const nameB = b.profile_name || '';
              comparison = nameA.localeCompare(nameB);
            }
            break;
          case 'stakeBalance':
            {
              const balanceA = a.stake_balances?.[0] || 0;
              const balanceB = b.stake_balances?.[0] || 0;
              comparison =
                balanceA === balanceB ? 0 : balanceA < balanceB ? 1 : -1;
            }
            break;
          case 'lastActive':
          default: {
            const lastActiveA = moment(a.last_active);
            const lastActiveB = moment(b.last_active);
            comparison = lastActiveA.isSame(lastActiveB)
              ? 0
              : lastActiveA.isAfter(lastActiveB)
              ? 1
              : -1;
          }
        }
        return payload.order_direction === 'ASC' ? -comparison : comparison;
      })
      .slice(
        (payload.cursor - 1) * payload.limit,
        payload.cursor * payload.limit,
      );

    const profilesWithAddresses = paginatedResults.map((profile) => {
      return {
        id: profile.id,
        user_id: profile.user_id,
        profile_name: profile.profile_name,
        avatar_url: profile.avatar_url,
        addresses: profile.address_ids.map((_, i) => {
          const address: any = {
            id: profile.address_ids[i],
            community_id: profile.community_ids[i],
            address: profile.addresses[i],
          };
          if (profile.stake_balances) {
            address.stake_balance = profile.stake_balances?.[i] || '0';
          }
          return address;
        }),
        roles: [] as string[],
        group_ids: [] as number[],
        last_active: profile.last_active,
      };
    });

    if (payload.include_roles) {
      const profileAddressIds = uniq(
        profilesWithAddresses
          .map((p) => p.addresses.map((address) => address.id))
          .flat(),
      );

      const addressesWithRoles = await models.Address.findAll({
        where: {
          id: {
            [Op.in]: profileAddressIds,
          },
          community_id: payload.community_id,
        },
      });

      const addressIdRoles: Record<number, string> = addressesWithRoles.reduce(
        (acc, address) => {
          return {
            ...acc,
            [`${address.id!}`]: address.role,
          };
        },
        {},
      );

      // add roles to associated profiles in response
      for (const profile of profilesWithAddresses) {
        for (const address of profile.addresses) {
          profile.roles ||= [];
          profile.roles.push(addressIdRoles[address.id]);
        }
      }
    }

    if (payload.include_group_ids) {
      const profileAddressIds = uniq(
        profilesWithAddresses
          .map((p) => p.addresses.map((address) => address.id))
          .flat(),
      );

      const existingMemberships = await models.Membership.findAll({
        where: {
          address_id: {
            [Op.in]: profileAddressIds,
          },
          reject_reason: null,
        },
      });
      // add group IDs to profiles
      for (const profile of profilesWithAddresses) {
        profile.group_ids = uniq(
          existingMemberships
            .filter((m) => {
              return !!profile.addresses.find((a) => a.id === m.address_id);
            })
            .map((m) => m.group_id),
        );
      }
    }
    return schemas.queries.buildPaginatedResponse(
      profilesWithAddresses,
      totalResults,
      {
        limit: payload.limit,
        offset: payload.limit * (payload.cursor - 1),
      },
    );
  },
});
