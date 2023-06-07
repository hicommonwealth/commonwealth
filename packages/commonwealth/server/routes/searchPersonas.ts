import { Op, QueryTypes } from 'sequelize';
import { AppError } from '../../../common-common/src/errors';
import type { DB } from '../models';
import { TypedRequestQuery, TypedResponse } from 'server/types';

import { buildPaginationSql } from '../../server/util/queries';

export const Errors = {
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
};

type SearchPersonasQuery = {
  search?: string;
  page_size?: string;
  page?: string;
};
type SearchPersonasResponse = {
  totalCount: number;
  personas: {
    id: number;
    name: string;
  }[];
};

const searchPersonas = async (
  models: DB,
  req: TypedRequestQuery<SearchPersonasQuery>,
  res: TypedResponse<SearchPersonasResponse> & { totalCount: number }
) => {
  const options = req.query;

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
    limit: Math.min(parseInt(options.page_size, 10) || 100, 100),
    page: parseInt(options.page, 10) || 1,
    orderBy: 'last_visited',
    orderDirection: 'DESC',
    nullsLast: true,
  });

  const bind: any = {
    searchTerm: `%${options.search}%`,
    ...paginationBind,
  };

  const sqlWithoutPagination = `
    SELECT
      "Personas".id,
      "Personas".name
    FROM
      "Personas"
    WHERE
      "Personas".name ILIKE $searchTerm
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

  // get personas
  const personas = await models.sequelize.query(
    `
    ${sqlWithoutPagination}
    ${paginationSort}
  `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  if (!personas?.length) {
    throw new AppError('no results');
  }

  const personasResult = personas.map((persona: any) => {
    return {
      id: persona.id,
      name: persona.name,
    };
  });

  return res.json({
    status: 'Success',
    result: {
      totalCount,
      personas: personasResult,
    },
  });
};

export default searchPersonas;
