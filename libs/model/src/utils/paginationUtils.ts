type PaginationReturnType = {
  offset: number;
  limit: number | undefined;
  order: [(string | 'ASC' | 'DESC')[]] | undefined;
};

export function formatSequelizePagination(params: {
  limit?: number;
  cursor?: number;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
}): PaginationReturnType {
  const { limit, cursor, order_by, order_direction } = params;
  return {
    limit,
    offset: (limit ?? 20) * ((cursor ?? 1) - 1),
    order:
      order_by && order_direction ? [[order_by, order_direction]] : undefined,
  };
}
