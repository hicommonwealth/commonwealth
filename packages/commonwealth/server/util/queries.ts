import { Sequelize } from 'sequelize';


/*
These methods are for generating the sequelize formatting for
different types of query options. Enumerated methods here
for ORDERING, GROUPING, LIMIT, OFFSET


*/

enum orderByOptions {
  DESC = 'DESC',
  ASC = 'ASC'
}

export const orderBy = (property: string, order: orderByOptions) => {
  return { order: [property, order]};
}

export const orderByMax = (property: string, order: orderByOptions) => {
  return { order: [Sequelize.fn('max', Sequelize.col(property)), order]};
}

export const groupBy = (property: string) => {
  return { group: property };
}

export const limitBy = (limit: number) => {
  return { limit };
}

export const offsetBy = (offset: number) => {
  return { offset };
}

export const paginate = (limit: number, offset: number) => {
  return { limit, offset };
}