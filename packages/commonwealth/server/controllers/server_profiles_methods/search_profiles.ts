import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';

import { CommunityInstance } from '@hicommonwealth/model';
import { buildPaginatedResponse } from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import { PaginationSqlOptions, buildPaginationSql } from '../../util/queries';
import { ServerProfilesController } from '../server_profiles_controller';

export const Errors = {};

export type SearchProfilesOptions = {
  community: CommunityInstance;
  search: string;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  includeGroupIds?: boolean;
  includeCount?: boolean;
};

type Profile = {
  id: number;
  user_id: string;
  profile_name: string;
  avatar_url: string;
  addresses: {
    id: number;
    community_id: string;
    address: string;
    role: Role;
  }[];
  group_ids: number[];
};
export type SearchProfilesResult = TypedPaginatedResult<Profile>;

// TODO: is this deprecated by /profiles/v2?
export async function __searchProfiles(
  this: ServerProfilesController,
  {
    community,
    search,
    limit,
    page,
    orderBy,
    orderDirection,
    includeCount,
  }: SearchProfilesOptions,
): Promise<SearchProfilesResult> {
  let sortOptions: PaginationSqlOptions = {
    // @ts-expect-error StrictNullChecks
    limit: Math.min(limit, 100) || 10,
    page: page || 1,
    orderDirection,
    nullsLast: true,
  };
  switch (orderBy) {
    case 'created_at':
      sortOptions = {
        ...sortOptions,
        orderBy: `"Users".created_at`,
      };
      break;
    case 'profile_name':
      sortOptions = {
        ...sortOptions,
        orderBy: `"Users".profile->>'name'`,
      };
      break;
    default:
      sortOptions = {
        ...sortOptions,
        orderBy: `last_active`,
      };
  }

  const { sql: paginationSort, bind: paginationBind } =
    buildPaginationSql(sortOptions);

  const bind: any = {
    searchTerm: `%${search}%`,
    ...paginationBind,
  };
  if (community) {
    bind.community_id = community.id;
  }

  const communityWhere = bind.community_id
    ? `"Addresses".community_id = $community_id AND`
    : '';

  const sqlWithoutPagination = `
    SELECT
      "Users".id AS user_id,
      "Users".profile->>'name' AS profile_name,
      "Users".profile->>'avatar_url' AS avatar_url,
      "Users".created_at,
      array_agg("Addresses".id) as address_ids,
      array_agg("Addresses".community_id) as community_ids,
      array_agg("Addresses".address) as addresses,
      array_agg("Addresses".role) as roles,
      MAX("Addresses".last_active) as last_active
    FROM
      "Users"
      JOIN "Addresses" ON "Users".id = "Addresses".user_id 
    WHERE
      ${communityWhere}
      (
        "Users".profile->>'name' ILIKE $searchTerm
        --OR
        --"Addresses".address ILIKE $searchTerm
      )
    GROUP BY
      "Users".id
  `;

  const [results, [{ count }]]: [any[], any[]] = await Promise.all([
    // get profiles and aggregate all addresses for each profile
    this.models.sequelize.query(`${sqlWithoutPagination} ${paginationSort}`, {
      bind,
      type: QueryTypes.SELECT,
    }),
    !includeCount
      ? [{ count: 0 }]
      : this.models.sequelize.query(
          `SELECT COUNT(*) FROM ( ${sqlWithoutPagination} ) as count`,
          {
            bind,
            type: QueryTypes.SELECT,
          },
        ),
  ]);

  const totalResults = parseInt(count, 10);

  // TODO: return addresses JSON instead
  const profilesWithAddresses: Profile[] = results.map((profile) => {
    return {
      id: profile.id,
      user_id: profile.user_id,
      profile_name: profile.profile_name,
      avatar_url: profile.avatar_url,
      addresses: profile.address_ids.map((__, i) => ({
        id: profile.address_ids[i],
        community_id: profile.community_ids[i],
        address: profile.addresses[i],
        role: profile.roles[i],
      })),
      group_ids: [],
    };
  });

  return buildPaginatedResponse(profilesWithAddresses, totalResults, bind);
}
