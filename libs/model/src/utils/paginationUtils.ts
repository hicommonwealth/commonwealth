export function formatSequelizePagination(params: {
  limit?: number;
  cursor?: number;
  order_by: string;
  order_direction: 'ASC' | 'DESC';
}) {
  const { limit, cursor, order_by, order_direction } = params;
  return {
    limit,
    offset: limit * (cursor - 1),
    order:
      order_by && order_direction ? [[order_by, order_direction]] : undefined,
  };
}
