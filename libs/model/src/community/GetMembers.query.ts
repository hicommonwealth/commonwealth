import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

type OrderBy = 'name' | 'last_active' | 'referrals' | 'earnings';
type OrderDirection = 'ASC' | 'DESC';

const buildOrderBy = (by: OrderBy, direction: OrderDirection) => {
  switch (by) {
    case 'name':
      return `profile_name ${direction}`;

    // - Add stake balance to address migration (stake_balance, updated_date)
    // - Project stake balances in separate process
    // case 'stakeBalance': // TODO: fix when stake balance is available
    //   return `addresses[0].stake_balance ${direction}`;

    case 'referrals':
      return `referral_count ${direction}`;

    case 'earnings':
      return `referral_eth_earnings ${direction}`;

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

function membersSqlWithoutSearch(
  by: OrderBy,
  direction: OrderDirection,
  limit: number,
  offset: number,
) {
  return `
      WITH T AS (SELECT profile_count as total FROM "Communities" WHERE id = :community_id)
      SELECT
        U.id AS user_id,
        U.profile->>'name' AS profile_name,
        U.profile->>'avatar_url' AS avatar_url,
        U.created_at,
        (
          SELECT JSON_BUILD_OBJECT(
            'user_id', RU.id,
            'profile_name', RU.profile->>'name',
            'avatar_url', RU.profile->>'avatar_url'
          )
          FROM "Addresses" RA JOIN "Users" RU ON RA.user_id = RU.id
          WHERE RA.address = U.referred_by_address LIMIT 1
        ) as referred_by,
        COALESCE(U.referral_count, 0) AS referral_count,
        COALESCE(U.referral_eth_earnings, 0) AS referral_eth_earnings,
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
      FROM "Addresses" A
        JOIN "Users" U ON A.user_id = U.id
        LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL
        JOIN T ON TRUE
      WHERE
        A.community_id = :community_id
        ${
          by === 'referrals' || by === 'earnings'
            ? 'AND COALESCE(U.referral_count, 0) + COALESCE(U.referral_eth_earnings, 0) > 0'
            : ''
        }
      GROUP BY U.id, T.total
      ORDER BY ${buildOrderBy(by, direction)}
      LIMIT ${limit} OFFSET ${offset};
     `;
}

function membersSqlWithSearch(
  cte: string,
  by: OrderBy,
  direction: OrderDirection,
  limit: number,
  offset: number,
) {
  return `
      WITH F AS (${cte}), T AS (SELECT COUNT(*)::INTEGER AS total FROM F)
      SELECT
        U.id AS user_id,
        U.profile->>'name' AS profile_name,
        U.profile->>'avatar_url' AS avatar_url,
        U.created_at,
        (
          SELECT JSON_BUILD_OBJECT(
            'user_id', RU.id,
            'profile_name', RU.profile->>'name',
            'avatar_url', RU.profile->>'avatar_url'
          )
          FROM "Addresses" RA JOIN "Users" RU ON RA.user_id = RU.id
          WHERE RA.address = U.referred_by_address LIMIT 1
        ) AS referred_by,
        COALESCE(U.referral_count, 0) AS referral_count,
        COALESCE(U.referral_eth_earnings, 0) AS referral_eth_earnings,
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
      FROM F 
        JOIN "Addresses" A ON F.id = A.id
        JOIN "Users" U ON A.user_id = U.id
        LEFT JOIN "Memberships" M ON A.id = M.address_id AND M.reject_reason IS NULL
        JOIN T ON TRUE
      ${
        by === 'referrals' || by === 'earnings'
          ? 'WHERE COALESCE(U.referral_count, 0) + COALESCE(U.referral_eth_earnings, 0) > 0'
          : ''
      }
      GROUP BY U.id, T.total
      ORDER BY ${buildOrderBy(by, direction)}
      LIMIT ${limit} OFFSET ${offset};
     `;
}

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

      const by = order_by ?? 'name';
      const direction = order_direction ?? 'DESC';

      const sql =
        search || memberships || addresses.length > 0
          ? membersSqlWithSearch(
              buildFilteredQuery(
                search ?? '',
                buildFilters(memberships ?? '', addresses),
              ),
              by,
              direction,
              limit,
              offset,
            )
          : membersSqlWithoutSearch(by, direction, limit, offset);

      const members = await models.sequelize.query<
        z.infer<typeof schemas.CommunityMember> & { total?: number }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });

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
