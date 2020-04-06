export default async (models, fetcher, req, res, next) => {
  if (!req.query.chain_object_id) {
    return next(new Error('Must provide chain object id'));
  }
  const fetchQuery = await models.ChainObjectQuery.findOne({
    where: {
      object_type: req.query.chain_object_id
    }
  });
  if (!fetchQuery) {
    return next(new Error('No fetch queries found'));
  }

  // TODO: should we permit fetching all types?
  if (!req.query.fetch_type) {
    return next(new Error('Must provide fetch type'));
  }
  const fetchType = req.query.fetch_type;
  // TODO: enumify this
  if (fetchType !== 'ADD' && fetchType !== 'UPDATE' && fetchType !== 'INIT') {
    return next(new Error('invalid fetch type, must be ADD, UPDATE, or INIT'));
  }

  // force refresh of chain objects and return all new rows
  const rows = await fetcher.fetch(req.query.chain_object_id, fetchType);
  return res.json({ status: 'Success', result: rows.map((r) => r.toJSON()) });
};
