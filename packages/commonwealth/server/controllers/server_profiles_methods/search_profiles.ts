import { Op, QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';

import {
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '../../util/queries';
import { RoleInstanceWithPermission, findAllRoles } from '../../util/roles';
import { uniq } from 'lodash';
import { ServerProfilesController } from '../server_profiles_controller';
import { ChainInstance } from 'server/models/chain';

export const Errors = {};

export type SearchProfilesOptions = {
  chain: ChainInstance;
  search: string;
  includeRoles?: boolean;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};
export type SearchProfilesResult = TypedPaginatedResult<{
  id: number;
  user_id: string;
  profile_name: string;
  addresses: {
    id: number;
    chain: string;
    address: string;
  }[];
  roles?: string;
}>;

export async function __searchProfiles(
  this: ServerProfilesController,
  {
    chain,
    search,
    includeRoles,
    limit,
    page,
    orderBy,
    orderDirection,
  }: SearchProfilesOptions
): Promise<SearchProfilesResult> {
  // sort by rank by default
  let sortOptions: PaginationSqlOptions = {
    limit: Math.min(limit, 100) || 10,
    page: page || 1,
    orderDirection,
    nullsLast: true,
  };
  switch (orderBy) {
    case 'created_at':
      sortOptions = {
        ...sortOptions,
        orderBy: `"Profiles".created_at`,
      };
      break;
    case 'last_active':
      sortOptions = {
        ...sortOptions,
        orderBy: `last_active`,
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
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? `"Addresses".chain = $chain AND` : '';

  const sqlWithoutPagination = `
    SELECT
      "Profiles".id,
      "Profiles".user_id,
      "Profiles".profile_name,
      "Profiles".avatar_url,
      "Profiles".created_at,
      array_agg("Addresses".id) as address_ids,
      array_agg("Addresses".chain) as chains,
      array_agg("Addresses".address) as addresses,
      MAX("Addresses".last_active) as last_active
    FROM
      "Profiles"
    JOIN
      "Addresses" on "Profiles".user_id = "Addresses".user_id
    WHERE
      ${chainWhere}
      (
        "Profiles".profile_name ILIKE $searchTerm
        OR
        "Addresses".address ILIKE $searchTerm
      )
    GROUP BY
      "Profiles".id
  `;

  const [results, [{ count }]]: [any[], any[]] = await Promise.all([
    // get profiles and aggregate all addresses for each profile
    this.models.sequelize.query(`${sqlWithoutPagination} ${paginationSort}`, {
      bind,
      type: QueryTypes.SELECT,
    }),
    this.models.sequelize.query(
      `SELECT COUNT(*) FROM ( ${sqlWithoutPagination} ) as count`,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    ),
  ]);

  const totalResults = parseInt(count, 10);

  const profilesWithAddresses = results.map((profile: any) => {
    return {
      id: profile.id,
      user_id: profile.user_id,
      profile_name: profile.profile_name,
      avatar_url: profile.avatar_url,
      addresses: profile.address_ids.map((_, i) => ({
        id: profile.address_ids[i],
        chain: profile.chains[i],
        address: profile.addresses[i],
      })),
      roles: [],
    };
  });

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
      chain?.id,
      ['member', 'moderator', 'admin']
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
          profile.roles.push(role);
        }
      }
    }
  }

  return buildPaginatedResponse(results, totalResults, bind);
}
