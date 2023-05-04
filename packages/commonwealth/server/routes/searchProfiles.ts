import { QueryTypes } from 'sequelize';
import { ALL_CHAINS } from '../middleware/databaseValidationService';
import { AppError } from '../../../common-common/src/errors';
import type { DB } from '../models';

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

const searchProfiles = async (models: DB, req, res) => {
  const options = req.query as SearchProfilesQuery;
  console.log('OPTIONS: ', options);
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
      array_agg(DISTINCT "Addresses".chain) as chains,
      array_agg(DISTINCT "Addresses".address) as addresses
    FROM
      "Profiles"
    JOIN
      "Addresses" on "Profiles".user_id = "Addresses".user_id
    WHERE
      ${chainWhere}
      "Profiles".profile_name LIKE $searchTerm
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
    result: profiles,
  });
};

export default searchProfiles;
