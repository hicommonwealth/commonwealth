import { Op, QueryTypes } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';
import { PaginationSqlBind, buildPaginationSql } from '../../util/queries';
import { ChainInstance } from '../../models/chain';
import { ThreadAttributes } from '../../models/thread';

export type SearchThreadsOptions = {
  chain: ChainInstance;
  searchTerm: string;
  threadTitleOnly: boolean;
  sort: string;
  page: number;
  pageSize: number;
};

export type SearchThreadsResult = ThreadAttributes[];

export async function __searchThreads(
  this: ServerThreadsController,
  {
    chain,
    searchTerm,
    threadTitleOnly,
    sort,
    page,
    pageSize,
  }: SearchThreadsOptions
): Promise<SearchThreadsResult> {
  if (threadTitleOnly) {
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
      limit: pageSize || 20,
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
  let sortOptions: {
    column: string;
    direction: 'ASC' | 'DESC';
  } = {
    column: 'rank',
    direction: 'DESC',
  };
  switch ((sort || '').toLowerCase()) {
    case 'newest':
      sortOptions = { column: '"Threads".created_at', direction: 'DESC' };
      break;
    case 'oldest':
      sortOptions = { column: '"Threads".created_at', direction: 'ASC' };
      break;
  }

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
    limit: pageSize || 10,
    page: page || 1,
    orderBy: sortOptions.column,
    orderDirection: sortOptions.direction,
  });

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

  const threads = await this.models.sequelize.query(
    `
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
  `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  return threads as SearchThreadsResult;
}
