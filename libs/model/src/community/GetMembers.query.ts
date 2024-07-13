import { InvalidState, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

// const Errors = {
//   StakeNotFound: 'Stake not found',
//   StakeholderGroup: 'Stakeholder group not found',
//   ChainNodeNotFound: 'Chain node not found',
// };

const buildMembershipFilter = (memberships: string, addresses: string[]) => {
  const groupIds = parseInt(
    ((memberships || '').match(/in-group:(\d+)/) || [`0`, `0`])[1],
  );
  const groupFilter = `
    SELECT 1 
    FROM "Memberships" M2 JOIN "Groups" G ON G.id = M2.group_id
    WHERE M2.address_id = A.id AND G.community_id = :community_id
    ${groupIds ? `AND G.id = ${groupIds}` : ''}
    `;

  switch (memberships) {
    case 'in-group':
    case `in-group:${groupIds}`:
      return `AND EXISTS (${groupFilter} AND M2.reject_reason IS NULL)`;

    case 'not-in-group':
      return `AND NOT EXISTS (${groupFilter} AND M2.reject_reason IS NULL)`;

    case 'allow-specified-addresses':
      return addresses.length > 0 ? `AND A.address IN(:addressBinding)` : '';

    case 'not-allow-specified-addresses':
      return addresses.length > 0
        ? `AND A.address NOT IN(:addressBinding)`
        : '';

    default:
      throw new InvalidState(`unsupported memberships param: ${memberships}`);
  }
};

export function GetMembers(): Query<typeof schemas.GetCommunityMembers> {
  return {
    ...schemas.GetCommunityMembers,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        community_id,
        search,
        allowedAddresses,
        memberships,
        cursor,
        limit,
        order_by,
        order_direction,
      } = payload;
      const addresses = allowedAddresses?.split(',').map((a) => a.trim());

      const replacements = {
        community_id,
        search: search ? `%${search}%` : '',
        addressBinding: addresses,
      };

      const membershipsWhere = memberships
        ? buildMembershipFilter(memberships, addresses ?? [])
        : '';

      const queryBody = `
      SELECT
        A.profile_id AS id,
        U.id AS user_id,
        U.profile->>'name' AS profile_name,
        U.profile->>'avatar_url' AS avatar_url,
        U.created_at,
        MAX(COALESCE(A.last_active, U.created_at)) AS last_active,
        JSONB_AGG(JSON_BUILD_OBJECT(
          'id', A.id,
          'address', A.address,
          'community_id', A.community_id,
          'stake_balance', 0 -- TODO: project stake balance here
        )) AS addresses,q
        ARRAY_AGG(A.role) AS roles,
        COALESCE(ARRAY_AGG(M.group_id) FILTER (WHERE M.group_id IS NOT NULL), '{}') AS group_ids
      FROM 
        "Users" U
        JOIN "Addresses" A ON U.id = A.user_id
        LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL
      WHERE 
        A.community_id = :community_id ${membershipsWhere}`;

      // UNION instead of OR when combining search terms uses trigram indexes in profile->>name and Addresses.address
      const sqlWithoutPagination = search
        ? `
          ${queryBody} AND U.profile->>'name' ILIKE :search
          GROUP BY A.profile_id, U.id
          UNION
          ${queryBody} AND A.address ILIKE :search
          GROUP BY A.profile_id, U.id;
          `
        : `
          ${queryBody}
          GROUP BY A.profile_id, U.id
        `;

      const allCommunityProfiles = await models.sequelize.query<
        z.infer<typeof schemas.CommunityMember>
      >(sqlWithoutPagination, {
        replacements,
        type: QueryTypes.SELECT,
        // logging: true,
      });

      // TODO: do this async from the client or project stake balances to addresses table
      // if (payload.include_stake_balances) {
      //   const stake = await models.CommunityStake.findOne({
      //     where: { community_id },
      //   });
      //   if (!stake) {
      //     throw new InvalidState(Errors.StakeNotFound);
      //   }
      //   const stakeholderGroup = await models.Group.findOne({
      //     where: {
      //       community_id,
      //       is_system_managed: true,
      //     },
      //   });
      //   if (!stakeholderGroup) {
      //     throw new InvalidState(Errors.StakeholderGroup);
      //   }
      //   const node = await models.ChainNode.findByPk(community.chain_node_id);
      //   if (!node || !node.eth_chain_id) {
      //     throw new InvalidState(Errors.ChainNodeNotFound);
      //   }
      //   const addresses = allCommunityProfiles.map((p) => p.addresses).flat();
      //   const balances = await contractHelpers.getNamespaceBalance(
      //     community.namespace_address!,
      //     stake.stake_id,
      //     node.eth_chain_id,
      //     addresses,
      //   );
      //   // add balances to profiles
      //   for (const profile of allCommunityProfiles) {
      //     for (const address of profile.addresses) {
      //       profile.stake_balances ||= [];
      //       profile.stake_balances.push(balances[address] || '0');
      //     }
      //   }
      // }

      // TODO: paginate in sql
      const paginatedResults = allCommunityProfiles
        .slice()
        .sort((a, b) => {
          let comparison = 0;
          switch (order_by) {
            case 'name':
              {
                const nameA = a.profile_name || '';
                const nameB = b.profile_name || '';
                comparison = nameA.localeCompare(nameB);
              }
              break;
            // case 'stakeBalance':
            //   {
            //     const balanceA = a.stake_balances?.[0] || 0;
            //     const balanceB = b.stake_balances?.[0] || 0;
            //     comparison =
            //       balanceA === balanceB ? 0 : balanceA < balanceB ? 1 : -1;
            //   }
            //   break;
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
          return order_direction === 'ASC' ? -comparison : comparison;
        })
        .slice((cursor - 1) * limit, cursor * limit);

      // console.log(paginatedResults);
      return schemas.buildPaginatedResponse(
        paginatedResults,
        allCommunityProfiles.length,
        {
          limit,
          offset: limit * (cursor - 1),
        },
      );
    },
  };
}
