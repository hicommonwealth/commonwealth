import gql from 'graphql-tag';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be admin',
  NeedParams: 'Must provide object_name, chain, unique_identifier, completion_field, query_type, description, query_url, has_pagination, and query_data',
  InvalidQuery: 'Invalid query type, must be INIT, ADD, or UPDATE',
  ChainDNE: 'Chain does not exist',
  QueryExists: 'Query already exists',
};

const addChainObjectQuery = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.MustBeAdmin));
  }
  if (!req.body.object_name
      || !req.body.chain
      || !req.body.unique_identifier
      || !req.body.completion_field
      || !req.body.query_type
      || !req.body.description
      || !req.body.query_url
      || !req.body.has_pagination
      || !req.body.query_data) {
    return next(new Error(Errors.NeedParams));
  }
  if (req.body.query_type in ['INIT', 'ADD', 'UPDATE'] === false) {
    return next(new Error(Errors.InvalidQuery));
  }

  const chain = await models.Chain.findOne({ where: {
    chain: req.body.chain,
  } });
  if (!chain) {
    return next(new Error(Errors.ChainDNE));
  }

  const objectVersion = await models.ChainObjectVersion.findOrCreate({
    where: {
      id: req.body.object_name,
      chain: req.body.chain,
      unique_identifier: req.body.unique_identifier,
      completion_field: req.body.completion_field,
    },
  });

  const [query, created] = await models.ChainObjectQuery.findOrCreate({
    where: {
      object_type: objectVersion.id,
      query_type: req.body.query_type,
      description: req.body.description,
      query_url: req.body.query_url,
      has_pagination: req.body.has_pagination,
      query: req.body.query,
    },
    defaults: {
      active: true,
    }
  });
  if (!created) {
    return next(new Error(Errors.QueryExists));
  }

  return res.json({ status: 'Success', result: query.toJSON() });
};

export default addChainObjectQuery;
