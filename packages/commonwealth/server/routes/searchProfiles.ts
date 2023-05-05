import { QueryTypes } from 'sequelize';
import { ALL_CHAINS } from '../middleware/databaseValidationService';
import { AppError } from '../../../common-common/src/errors';
import type { DB } from '../models';
import { TypedRequestQuery, TypedResponse } from 'server/types';

const MIN_SEARCH_QUERY_LENGTH = 3;

export const Errors = {
  InvalidChain: 'Invalid chain',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoChains: 'No chains resolved to execute search',
};

type SearchProfilesQuery = {
  search?: string;
  chain?: string;
};
type SearchProfilesResponse = {
  id: number;
  user_id: string;
  profile_name: string;
  addresses: {
    id: number;
    chain: string;
    address: string;
  }[];
}[];

const searchProfiles = async (
  models: DB,
  req: TypedRequestQuery<SearchProfilesQuery>,
  res: TypedResponse<SearchProfilesResponse>
) => {
  const options = req.query;
  if (!options.search) {
    throw new AppError(Errors.QueryMissing);
  }
  if (options.search.length < MIN_SEARCH_QUERY_LENGTH) {
    throw new AppError(Errors.QueryTooShort);
  }
  if (!options.chain) {
    throw new AppError(Errors.NoChains);
  }
  if (!req.chain && options.chain !== ALL_CHAINS) {
    // if no chain resolved, ensure that client explicitly requested all chains
    throw new AppError(Errors.NoChains);
  }

  const bind: any = {
    searchTerm: `%${options.search}%`,
  };
  if (req.chain) {
    bind.chain = req.chain.id;
  }

  const chainWhere = bind.chain ? `"Addresses".chain = $chain AND` : '';

  // get profiles and aggregate all addresses for each profile
  const profiles = await models.sequelize.query(
    `
    SELECT
      "Profiles".id,
      "Profiles".user_id,
      "Profiles".profile_name,
      array_agg("Addresses".id) as address_ids,
      array_agg("Addresses".chain) as chains,
      array_agg("Addresses".address) as addresses
    FROM
      "Profiles"
    JOIN
      "Addresses" on "Profiles".user_id = "Addresses".user_id
    WHERE
      ${chainWhere}
      "Profiles".profile_name ILIKE $searchTerm
    GROUP BY
      "Profiles".id
    LIMIT 100
  `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  return res.json({
    status: 'Success',
    result: profiles.map((profile: any) => {
      return {
        id: profile.id,
        user_id: profile.user_id,
        profile_name: profile.profile_name,
        addresses: profile.address_ids.map((_, i) => ({
          id: profile.address_ids[i],
          chain: profile.chains[i],
          address: profile.addresses[i],
        })),
      };
    }),
  });
};

export default searchProfiles;
