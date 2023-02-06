import type {
  GetTopicsReq,
  GetTopicsResp,
} from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import Sequelize, { Op } from 'sequelize';
import type { DB } from '../../models';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { paginationValidation } from '../../util/helperValidations';
import { formatPagination } from '../../util/queries';

export const getTopicsValidation = [
  query('community_id').isString().trim(),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

export const getTopics = async (
  models: DB,
  req: TypedRequestQuery<GetTopicsReq>,
  res: TypedResponse<GetTopicsResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, count_only } = req.query;

  const where = { chain_id: community_id };

  // Join in last_commented_on of thread that is most recently commented on
  const include = [
    {
      model: models.Thread,
      as: 'threads',
      where: {
        [Op.and]: [
          Sequelize.literal(` "threads"."last_commented_on" = (
      Select MAX(last_commented_on)
      FROM "Threads"
      WHERE
      "Threads"."topic_id" = "Topic"."id")`),
        ],
      },
      attributes: ['last_commented_on'],
    },
  ];

  let topics, count;
  if (!count_only) {
    ({ rows: topics, count } = await models.Topic.findAndCountAll({
      where,
      ...formatPagination(req.query),
      include,
      raw: true,
    }));
  } else {
    count = await models.Topic.count({
      where,
      ...formatPagination(req.query),
      include,
    });
  }

  // rename the threads.last_commented_on field
  topics.forEach((t) => {
    if (t['threads.last_commented_on']) {
      t['latest_activity'] = t['threads.last_commented_on'];
      delete t['threads.last_commented_on'];
    }
  });

  return success(res, { topics, count });
};
