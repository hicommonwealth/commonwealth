import type { DB } from '@hicommonwealth/model';
import { TopicAttributes, TopicInstance } from '@hicommonwealth/model';
import { query, validationResult } from 'express-validator';
import { WhereOptions } from 'sequelize';
import type { GetTopicsReq, GetTopicsResp } from '../../api/extApiTypes';
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
  res: TypedResponse<GetTopicsResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, count_only } = req.query;

  const where: WhereOptions<TopicAttributes> = { community_id: community_id };

  let topics: TopicInstance[], count: number;
  if (!count_only) {
    ({ rows: topics, count } = await models.Topic.findAndCountAll({
      where,
      ...formatPagination(req.query),
    }));
  } else {
    count = await models.Topic.count({
      where,
      ...formatPagination(req.query),
    });
  }

  return success(res, { topics, count });
};
