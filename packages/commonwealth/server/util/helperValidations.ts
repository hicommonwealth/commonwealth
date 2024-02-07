import { body, oneOf, query } from 'express-validator';
import { needParamErrMsg } from '../api/extApiTypes';

const optionalAddress = (base) => {
  return [
    oneOf(
      [
        query(`${base}.*.address`).exists().toArray(),
        query(`${base}.*.address_id`).exists().toArray(),
      ],
      `${needParamErrMsg} (address, address_id)`,
    ),
  ];
};

export const onlyIds = [
  body('ids').exists().isArray(),
  body('ids.*').exists().toInt(),
];

export const paginationValidation = [
  query('limit').optional().isNumeric(),
  query('page').optional().isNumeric(),
];

export const putCommentsValidation = [
  body('comments').exists().isArray(),
  body('comments.*.community_id').exists().isString().trim(),
  ...optionalAddress('comments'),
  body('comments.*.text').exists().isString(),
  body('comments.*.created_at').not().exists(),
  body('comments.*.updated_at').not().exists(),
  body('comments.*.deleted_at').not().exists(),
];

export const postReactionsValidation = [
  body('reactions').exists().isArray(),
  body('reactions.*.community_id').exists().isString().trim(),
  ...optionalAddress('reactions'),
  body('reactions.*.reaction').exists().isString().trim(),
  body('reactions.*.created_at').not().exists(),
  body('reactions.*.updated_at').not().exists(),
  body('reactions.*.deleted_at').not().exists(),
];

export const postProfilesValidation = [
  body('profiles').exists().isArray(),
  body('profiles.*.community_id').exists().isString().trim(),
  body('profiles.*.created_at').not().exists(),
  body('profiles.*.updated_at').not().exists(),
  body('profiles.*.deleted_at').not().exists(),
];

export const postTopicsValidation = [
  body('topics').exists().isArray(),
  body('topics.*.community_id').exists().isString().trim(),
  body('topics.*.name').exists().isString().trim(),
  body('comments.*.created_at').not().exists(),
  body('comments.*.updated_at').not().exists(),
  body('comments.*.deleted_at').not().exists(),
];
