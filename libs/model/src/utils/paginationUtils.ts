import { Order } from 'sequelize/types/model';

export function formatSequelizePagination(params: {
  limit?: number;
  cursor?: number;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
}): { offset: number; limit: number | undefined; order?: Order } {
  const { limit, cursor, order_by, order_direction } = params;
  return {
    limit,
    offset: (limit ?? 20) * ((cursor ?? 1) - 1),
    order:
      order_by && order_direction
        ? ([[order_by, order_direction]] as Order)
        : undefined,
  };
}
