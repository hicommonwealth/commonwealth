import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

const buildOrderBy = (by: string, direction: 'ASC' | 'DESC') => {
  switch (by) {
    case 'name':
      return `profile_name ${direction}`;

    case 'stakeBalance': // TODO: fix when stake balance is available
      return `addresses[0].stake_balance ${direction}`;
  }
  return `last_active ${direction}`;
};

type Filters = {
  groupsJoin: string;
  addressFilter: string;
};

const buildFilters = (memberships: string, addresses: string[]): Filters => {
  const ids = parseInt((memberships.match(/in-group:(\d+)/) || [`0`, `0`])[1]);
  switch (memberships) {
    case 'in-group':
      return {
        groupsJoin: `JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL`,
        addressFilter: '',
      };

    case `in-group:${ids}`:
      return {
        groupsJoin: `JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL AND M.group_id IN (${ids})`,
        addressFilter: '',
      };

    case 'not-in-group':
      return { groupsJoin: '', addressFilter: '' }; // TODO: consider default group

    case 'allow-specified-addresses':
      return {
        groupsJoin: '',
        addressFilter: addresses.length ? `AND A.address IN(:addresses)` : '',
      };

    case 'not-allow-specified-addresses':
      return {
        groupsJoin: '',
        addressFilter: addresses.length
          ? `AND A.address NOT IN(:addresses)`
          : '',
      };

    default:
      return { groupsJoin: '', addressFilter: '' };
  }
};

const buildFilteredQuery = (
  search: string,
  { groupsJoin, addressFilter }: Filters,
) => {
  // Using UNION instead of OR when combining search terms to
  // force trigram indexes in profile->>name and Addresses.address
  return search
    ? `
    SELECT 
      A.id 
    FROM 
      "Users" U 
      JOIN "Addresses" A ON U.id = A.user_id 
      ${groupsJoin}
    WHERE
      A.community_id = :community_id
      AND A.profile_id IS NOT NULL -- TO BE REMOVED
      AND U.profile->>'name' ILIKE :search
      ${addressFilter}

    UNION

    SELECT 
      A.id 
    FROM
      "Addresses" A
      ${groupsJoin}
    WHERE
      A.community_id = :community_id
      AND A.profile_id IS NOT NULL -- TO BE REMOVED
      AND A.address ILIKE :search 
      ${addressFilter}
  `
    : `
    SELECT 
      A.id 
    FROM
      "Addresses" A 
      ${groupsJoin}
    WHERE 
      A.community_id = :community_id
      AND A.profile_id IS NOT NULL -- TO BE REMOVED
      ${addressFilter}
  `;
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

      const offset = limit * (cursor - 1);
      const addresses = allowedAddresses?.split(',').map((a) => a.trim()) ?? [];

      const replacements = {
        community_id,
        search: search ? `%${search}%` : '',
        addresses,
      };

      const cte = buildFilteredQuery(
        search ?? '',
        buildFilters(memberships ?? '', addresses),
      );

      const orderBy = buildOrderBy(
        order_by ?? 'name',
        order_direction ?? 'DESC',
      );

      const sql = `
      WITH F AS (${cte})
      SELECT
        (SELECT COUNT(*) FROM F)::INTEGER AS total,
        U.id AS user_id,
        U.profile->>'name' AS profile_name,
        U.profile->>'avatar_url' AS avatar_url,
        U.created_at,
        MAX(COALESCE(A.last_active, U.created_at)) AS last_active,
        JSONB_AGG(JSON_BUILD_OBJECT(
          'id', A.id,
          'address', A.address,
          'community_id', A.community_id,
          'stake_balance', 0, -- TODO: project stake balance here
          'profile_id', A.profile_id -- TO BE REMOVED
        )) AS addresses,
        ARRAY_AGG(A.role) AS roles,
        COALESCE(ARRAY_AGG(M.group_id) FILTER (WHERE M.group_id IS NOT NULL), '{}') AS group_ids
      FROM 
        F 
        JOIN "Addresses" A ON F.id = A.id
        JOIN "Users" U ON A.user_id = U.id
        LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL
      GROUP BY U.id
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset};
      `;

      const members = await models.sequelize.query<
        z.infer<typeof schemas.CommunityMember> & { total: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        logging: true,
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

      console.log(members, payload);
      return schemas.buildPaginatedResponse(
        members,
        members.at(0)?.total ?? 0,
        {
          limit,
          offset,
        },
      );
    },
  };
}

// TODO:
// - UI: Fix page result ordering issue in table view
// - UI: Fix not in group filters
// - Create query plans
// - Remove comments and logging (logging:true, console.log)
// - Add stake balance to address migration (stake_balance, updated_date)
// - Project stake balances in separate process
