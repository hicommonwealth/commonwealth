import { Sequelize } from 'sequelize';
import { Models } from '../models';

/*
These methods are for generating the sequelize formatting for
different types of query options. Enumerated methods here
for ORDERING, GROUPING, LIMIT, OFFSET
*/

export enum orderByOptions {
  DESC = 'DESC',
  ASC = 'ASC'
}

export type IPagination = {
  limit?: number;
  page?: number;
  sort?: orderByOptions;
}

export const orderBy = (property: string, order: orderByOptions) => {
  return { order: [property, order] };
};

// Will order by max(property)
export const orderByMax = (property: string, order: orderByOptions) => {
  return { order: [Sequelize.fn('max', Sequelize.col(property)), order] };
};

// Will order through an associated model's 'property' using the model names as the associations' names.
export const orderByAssociations = (associations: Models[], property: string, order: orderByOptions) => {
  return { order: [...associations, property, order] };
};

// Yields `GROUP BY property`
export const groupBy = (property: string) => {
  return { group: property };
};

// Yields `LIMIT count`
export const limitBy = (count: number) => {
  return { limit: count };
};

// Yields `OFFSET page`
export const offsetBy = (page: number) => {
  return { offset: page };
};

// Yields `LIMIT count OFFSET page`
export const paginate = (count: number, page: number) => {
  return { limit: count, offset: page };
};

// helper methods
export const formatPagination = (query) => {
  const { limit, page } = query;
  let pagination;
  if (limit && page) pagination = paginate(limit, page);
  else if (limit) pagination = limitBy(limit);
  return pagination;
};