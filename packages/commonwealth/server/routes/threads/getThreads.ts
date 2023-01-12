import type {
  GetThreadsReq,
  GetThreadsResp,
} from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import Sequelize from 'sequelize';
import type { DB } from '../../models';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getThreadsValidation = [
  query('community_id').isString().trim(),
  query('topic_id').optional().isNumeric(),
  query('count_only').optional().isBoolean().toBoolean(),
  query('address_ids').optional().toArray(),
  query('addresses').optional().toArray(),
  query('no_body').optional().isBoolean().toBoolean(),
  query('include_comments').optional().isBoolean().toBoolean(),
  query('count_only').optional().isBoolean().toBoolean(),
];

export const getThreads = async (
  models: DB,
  req: TypedRequestQuery<GetThreadsReq>,
  res: TypedResponse<GetThreadsResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const {
    community_id,
    topic_id,
    address_ids,
    no_body,
    include_comments,
    addresses,
    count_only,
  } = req.query;

  const pagination = formatPagination(req.query);

  const where = { chain: community_id };

  const include = [];
  if (addresses) {
    include.push({
      model: models.Address,
      where: { address: { [Op.in]: addresses } },
      as: 'Address',
    });
  }

  let attributes;

  if (no_body)
    attributes = { exclude: ['body', 'plaintext', 'version_history'] };
  if (topic_id) where['topic_id'] = topic_id;
  if (address_ids) where['address_id'] = { [Op.in]: address_ids };
  if (include_comments)
    include.push({ model: models.Comment, required: false });

  let threads, count;
  if (!count_only) {
    ({ rows: threads, count } = await models.Thread.findAndCountAll({
      logging: console.log,
      where,
      include,
      attributes,
      ...pagination,
    }));
  } else {
    count = <any>await models.Thread.count({
      logging: console.log,
      where,
      include,
      attributes,
      ...pagination,
    });
  }

  return success(res, { threads, count });
};
