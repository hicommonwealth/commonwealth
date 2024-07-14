import { InvalidState, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
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

const buildOrderBy = (by: string, direction: 'ASC' | 'DESC') => {
  switch (by) {
    case 'name':
      return `ORDER BY profile_name ${direction}`;

    case 'stakeBalance':
      return `ORDER BY addresses[0].stake_balance ${direction}`;
  }
  return `ORDER BY last_active ${direction}`;
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
        "Users" U
        JOIN "Addresses" A ON U.id = A.user_id
        LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL
      WHERE 
        A.community_id = :community_id 
        AND A.profile_id IS NOT NULL
        ${membershipsWhere}`;

      const groupBy = `
        GROUP BY U.id
     `;
      console.log(payload);
      const orderBy = buildOrderBy(
        order_by ?? 'name',
        order_direction ?? 'DESC',
      );

      // UNION instead of OR when combining search terms uses trigram indexes in profile->>name and Addresses.address
      const sql = search
        ? `
          ${queryBody} AND U.profile->>'name' ILIKE :search
          ${groupBy}
          UNION
          ${queryBody} AND A.address ILIKE :search
          ${groupBy}
          ${orderBy};
          `
        : `
          ${queryBody}
          ${groupBy}
          ${orderBy};
        `;

      const profiles = await models.sequelize.query<
        z.infer<typeof schemas.CommunityMember>
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

      const offset = limit * (cursor - 1);
      const page = profiles.slice(offset, cursor * limit);
      console.log(page, offset, cursor * limit);
      return schemas.buildPaginatedResponse(page, profiles.length, {
        limit,
        offset,
      });
    },
  };
}

// TODO:
// - Fix page result ordering issue in table view
// - Create query plans
// - Remove comments and logging (logging:true, console.log)
// - Add stake balance to address migration (stake_balance, updated_date)
// - Project stake balances in separate process
