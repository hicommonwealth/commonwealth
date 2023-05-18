import { Op, QueryTypes } from 'sequelize';
import { ALL_CHAINS } from '../middleware/databaseValidationService';
import { AppError } from '../../../common-common/src/errors';
import type { DB } from '../models';
import { TypedRequestQuery, TypedResponse } from 'server/types';
import { buildPaginationSql } from '../../server/util/queries';
import {
  RoleInstanceWithPermission,
  findAllRoles,
} from '../../server/util/roles';
import { uniq } from 'lodash';

export const Errors = {
  InvalidChain: 'Invalid chain',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoChains: 'No chains resolved to execute search',
};

type SearchProfilesQuery = {
  search?: string;
  chain?: string;
  page_size?: string;
  page?: string;
  include_roles?: string;
};
type SearchProfilesResponse = {
  totalCount: number;
  profiles: {
    id: number;
    user_id: string;
    profile_name: string;
    addresses: {
      id: number;
      chain: string;
      address: string;
    }[];
  }[];
};

const searchProfiles = async (
  models: DB,
  req: TypedRequestQuery<SearchProfilesQuery>,
  res: TypedResponse<SearchProfilesResponse> & { totalCount: number }
) => {
  const options = req.query;

  if (!options.chain) {
    throw new AppError(Errors.NoChains);
  }
  if (!req.chain && options.chain !== ALL_CHAINS) {
    // if no chain resolved, ensure that client explicitly requested all chains
    throw new AppError(Errors.NoChains);
  }
  const includeRoles = options.include_roles === 'true';

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
    limit: Math.min(parseInt(options.page_size, 10) || 100, 100),
    page: parseInt(options.page, 10) || 1,
    orderBy: 'last_active',
    orderDirection: 'DESC',
    nullsLast: true,
  });

  const bind: any = {
    searchTerm: `%${options.search}%`,
    ...paginationBind,
  };
  if (req.chain) {
    bind.chain = req.chain.id;
  }

  const chainWhere = bind.chain ? `"Addresses".chain = $chain AND` : '';

  const sqlWithoutPagination = `
    SELECT
      "Profiles".id,
      "Profiles".user_id,
      "Profiles".profile_name,
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
      "Profiles".profile_name ILIKE $searchTerm
    GROUP BY
      "Profiles".id
  `;

  const totalCountResult = await models.sequelize.query(
    `
      SELECT COUNT(*) FROM (
        ${sqlWithoutPagination}
      ) as c
    `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );
  const totalCount: number =
    parseInt((totalCountResult?.[0] as any)?.count, 10) || 0;

  // get profiles and aggregate all addresses for each profile
  const profiles = await models.sequelize.query(
    `
    ${sqlWithoutPagination}
    ${paginationSort}
  `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  if (!profiles?.length) {
    throw new AppError('no results');
  }

  const profilesWithAddresses = profiles.map((profile: any) => {
    return {
      id: profile.id,
      user_id: profile.user_id,
      profile_name: profile.profile_name,
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
      models,
      {
        where: {
          address_id: {
            [Op.in]: uniq(profileAddressIds),
          },
        },
      },
      req.chain?.id
    );

    const addressIdRoles: Record<number, RoleInstanceWithPermission[]> = {};
    for (const role of roles) {
      const attributes = role.toJSON();
      addressIdRoles[attributes.address_id] ||= [];
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

  return res.json({
    status: 'Success',
    result: {
      totalCount,
      profiles: profilesWithAddresses,
    },
  });
};

export default searchProfiles;
