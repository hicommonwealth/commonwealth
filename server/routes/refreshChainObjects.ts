import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoChainId: 'Must provide chain object id',
  NoQuery: 'No fetch queries found',
  NoFetchType: 'Must provide fetch type',
  InvalidType: 'Invalid fetch type, must be ADD, UPDATE, or INIT', 
};

export default async (models, fetcher, req, res, next) => {
  if (!req.query.chain_object_id) {
    return next(new Error(Errors.NoChainId));
  }
  const fetchQuery = await models.ChainObjectQuery.findOne({
    where: {
      object_type: req.query.chain_object_id
    }
  });
  if (!fetchQuery) {
    return next(new Error(Errors.NoQuery));
  }

  // TODO: should we permit fetching all types?
  if (!req.query.fetch_type) {
    return next(new Error(Errors.NoFetchType));
  }
  const fetchType = req.query.fetch_type;
  // TODO: enumify this
  if (fetchType !== 'ADD' && fetchType !== 'UPDATE' && fetchType !== 'INIT') {
    return next(new Error(Errors.InvalidType));
  }

  // force refresh of chain objects and return all new rows
  const rows = await fetcher.fetch(req.query.chain_object_id, fetchType);
  return res.json({ status: 'Success', result: rows.map((r) => r.toJSON()) });
};
