import { needParamErrMsg } from 'common-common/src/api/extApiTypes';
import { body, oneOf, query } from 'express-validator';

const optionalAddress = (base) => {
  return [
    oneOf(
      [
        query(`${base}.*.address`).exists().toArray(),
        query(`${base}.*.address_id`).exists().toArray(),
      ],
      `${needParamErrMsg} (address, address_id)`
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

export const postRolesValidation = [
  body('roles').exists().isArray(),
  body('roles.*.id').exists().toInt(),
  ...optionalAddress('roles'),
  body('roles.*.permission').not().exists(),
  body('roles.*.created_at').not().exists(),
  body('roles.*.updated_at').not().exists(),
  body('roles.*.deleted_at').not().exists(),
];

export const postRulesValidation = [
  body('rules').exists().isArray(),
  body('rules.*.community_id').exists().isString().trim(),
  body('rules.*.rule').exists().isString().trim(),
  body('rules.*.created_at').not().exists(),
  body('rules.*.updated_at').not().exists(),
  body('rules.*.deleted_at').not().exists(),
];

export const getThreadsValidation = [
  query('ids')
    .toArray()
    .custom((value) => {
      // make sure the value is either a string or a number
      let hasInvalidValue = false;
      for (let i = 0; i < value.length; i++) {
        if (!['number', 'string'].includes(typeof value[i])) {
          hasInvalidValue = true;
          break;
        }
      }

      if (hasInvalidValue) {
        throw new Error('ids must be integers');
      }

      return true;
    }),
];
