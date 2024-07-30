import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

const buildOrderBy = (by: string, direction: 'ASC' | 'DESC') => {
  switch (by) {
    case 'name':
      return `profile_name ${direction}`;

    // - Add stake balance to address migration (stake_balance, updated_date)
    // - Project stake balances in separate process
    // case 'stakeBalance': // TODO: fix when stake balance is available
    //   return `addresses[0].stake_balance ${direction}`;

    default:
      return `last_active ${direction}`;
  }
};

type Filters = {
  joins: string;
  filters: string;
};

const buildFilters = (memberships: string, addresses: string[]): Filters => {
  const ids = parseInt((memberships.match(/in-group:(\d+)/) || [`0`, `0`])[1]);
  switch (memberships) {
    case 'in-group':
      return {
        joins: `JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL`,
        filters: '',
      };

    case `in-group:${ids}`:
      return {
        joins: `JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL AND M.group_id IN (${ids})`,
        filters: '',
      };

    case 'not-in-group':
      return {
        joins: `LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL`,
        filters: 'AND M.address_id IS NULL',
      };

    case 'allow-specified-addresses':
      return {
        joins: '',
        filters: addresses.length ? `AND A.address IN(:addresses)` : '',
      };

    case 'not-allow-specified-addresses':
      return {
        joins: '',
        filters: addresses.length ? `AND A.address NOT IN(:addresses)` : '',
      };

    default:
      return { joins: '', filters: '' };
  }
};

const buildFilteredQuery = (
  search: string,
  { joins: groupsJoin, filters: addressFilter }: Filters,
) => {
  // TODO: Temporarily removing option to search by address until product team decides what to do with it
  // Using UNION instead of OR when combining search terms to
  // force trigram indexes in profile->>name and Addresses.address
  // return search
  //   ? `
  //   SELECT
  //     A.id
  //   FROM
  //     "Users" U
  //     JOIN "Addresses" A ON U.id = A.user_id
  //     ${groupsJoin}
  //   WHERE
  //     A.community_id = :community_id
  //     AND U.profile->>'name' ILIKE :search
  //     ${addressFilter}

  //   UNION

  //   SELECT
  //     A.id
  //   FROM
  //     "Addresses" A
  //     ${groupsJoin}
  //   WHERE
  //     A.community_id = :community_id
  //     AND A.address ILIKE :search
  //     ${addressFilter}
  // `
  //   : `
  //   SELECT
  //     A.id
  //   FROM
  //     "Addresses" A
  //     ${groupsJoin}
  //   WHERE
  //     A.community_id = :community_id
  //     ${addressFilter}
  // `;
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
      AND U.profile->>'name' ILIKE :search
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
      WITH F AS (${cte}), T AS (SELECT COUNT(*)::INTEGER AS total FROM F)
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
          'role', A.role,
          'stake_balance', 0 -- TODO: project stake balance here
        )) AS addresses,
        COALESCE(ARRAY_AGG(M.group_id) FILTER (WHERE M.group_id IS NOT NULL), '{}') AS group_ids,
        T.total
      FROM 
        F 
        JOIN "Addresses" A ON F.id = A.id
        JOIN "Users" U ON A.user_id = U.id
        LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL
        JOIN T ON true
      GROUP BY U.id, T.total
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset};
      `;

      const members = await models.sequelize.query<
        z.infer<typeof schemas.CommunityMember> & { total: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });

      // console.log(members, payload);
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
