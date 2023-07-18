import { Op, QueryTypes } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';
import {
  PaginationSqlBind,
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '../../util/queries';
import { ChainInstance } from '../../models/chain';
import { ThreadAttributes } from '../../models/thread';
import { TypedPaginatedResult } from 'server/types';

export type SearchThreadsOptions = {
  chain: ChainInstance;
  searchTerm: string;
  threadTitleOnly: boolean;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

export type SearchThreadsResult =
  | TypedPaginatedResult<ThreadAttributes[]>
  | ThreadAttributes[];

export async function __searchThreads(
  this: ServerThreadsController,
  {
    chain,
    searchTerm,
    threadTitleOnly,
    limit,
    page,
    orderBy,
    orderDirection,
  }: SearchThreadsOptions
): Promise<SearchThreadsResult> {
  if (threadTitleOnly) {
    // TODO: move this into a different route/function?
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const params: any = {
      title: {
        [Op.or]: [
          { [Op.iLike]: `%${encodedSearchTerm}%` },
          { [Op.iLike]: `%${searchTerm}%` },
        ],
      },
    };
    if (chain) {
      params.chain = chain.id;
    }
    const threads = await this.models.Thread.findAll({
      where: params,
      limit: limit,
      attributes: {
        exclude: ['body', 'plaintext', 'version_history'],
      },
      include: [
        {
          model: this.models.Address,
          as: 'Address',
        },
      ],
    });
    return threads;
  }

  // sort by rank by default
  let sortOptions: PaginationSqlOptions = {
    limit: limit || 10,
    page: page || 1,
    orderDirection,
  };
  switch (orderBy) {
    case 'created_at':
      sortOptions = {
        ...sortOptions,
        orderBy: `"Comments".${orderBy}`,
      };
      break;
    default:
      sortOptions = {
        ...sortOptions,
        orderBy: `rank`,
      };
  }

  const { sql: paginationSort, bind: paginationBind } =
    buildPaginationSql(sortOptions);

  const bind: PaginationSqlBind & {
    chain?: string;
    searchTerm?: string;
  } = {
    searchTerm: searchTerm,
    ...paginationBind,
  };
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? '"Threads".chain = $chain AND' : '';

  const sqlBaseQuery = `
    SELECT
      "Threads".id,
      "Threads".title,
      "Threads".body,
      CAST("Threads".id as VARCHAR) as proposalId,
      'thread' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "Threads".created_at,
      "Threads".chain,
      ts_rank_cd("Threads"._search, query) as rank
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${chainWhere}
      "Threads".deleted_at IS NULL AND
      query @@ "Threads"._search
    ${paginationSort}
  `;

  const sqlCountQuery = `
    SELECT
      COUNT (*) as count
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${chainWhere}
      "Threads".deleted_at IS NULL AND
      query @@ "Threads"._search
  `;

  const [results, [{ count }]]: [any[], any[]] = await Promise.all([
    await this.models.sequelize.query(sqlBaseQuery, {
      bind,
      type: QueryTypes.SELECT,
    }),
    await this.models.sequelize.query(sqlCountQuery, {
      bind,
      type: QueryTypes.SELECT,
    }),
  ]);

  const totalResults = parseInt(count, 10);

  return buildPaginatedResponse(results, totalResults, bind);
}
