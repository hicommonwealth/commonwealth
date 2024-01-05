import { query, validationResult } from 'express-validator';
import Sequelize, { WhereOptions } from 'sequelize';
import type { GetThreadsReq, GetThreadsResp } from '../../api/extApiTypes';
import type { DB } from '../../models';
import { ThreadAttributes } from '../../models/thread';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { paginationValidation } from '../../util/helperValidations';
import { flattenIncludedAddresses, formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getThreadsValidation = [
  query('community_id').isString().trim(),
  query('topic_id').optional().isNumeric(),
  query('address_ids').optional().toArray(),
  query('addresses').optional().toArray(),
  query('no_body').optional().isBoolean().toBoolean(),
  query('include_comments').optional().isBoolean().toBoolean(),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

export const getThreads = async (
  models: DB,
  req: TypedRequestQuery<GetThreadsReq>,
  res: TypedResponse<GetThreadsResp>,
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

  // if address is included, find which thread_ids they correspond to.
  const where: WhereOptions<ThreadAttributes> = { community_id: community_id };
  if (addresses) {
    const addressIds = await models.Address.findAll({
      where: { address: { [Op.in]: addresses } },
      attributes: ['id'],
    });

    where.address_id = { [Op.in]: addressIds.map((p) => p.id) };
  }

  const include: any = [
    {
      model: models.Address,
      attributes: ['address'],
      as: 'Address',
      required: true,
    },
  ];

  const attributes = { exclude: ['address_id'] };
  if (no_body)
    attributes.exclude = [
      ...attributes.exclude,
      ...['body', 'plaintext', 'version_history'],
    ];
  if (topic_id) where.topic_id = topic_id;
  if (address_ids) where.address_id = { [Op.in]: address_ids };
  if (include_comments)
    include.push({ model: models.Comment, required: false });

  let threads, count;
  if (!count_only) {
    ({ rows: threads, count } = await models.Thread.findAndCountAll({
      where,
      include,
      attributes,
      ...pagination,
    }));
  } else {
    count = await models.Thread.count({
      where,
      include,
      attributes,
      ...pagination,
    });
  }

  flattenIncludedAddresses(threads);

  return success(res, { threads, count });
};
