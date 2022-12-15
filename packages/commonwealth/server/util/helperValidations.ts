import { body } from "express-validator";

export const onlyIds = [
  body('ids').exists().isArray(),
  body('ids.*').exists().toInt()
];

export const putCommentsValidation = [
  body('comments').exists().isArray(),
  body('comments.*.community_id').exists().isString().trim(),
  body('comments.*.address_id').exists().toInt(),
  body('comments.*.text').exists().isString(),
  body('comments.*.created_at').not().exists(),
  body('comments.*.updated_at').not().exists(),
  body('comments.*.deleted_at').not().exists(),
];

export const postReactionsValidation = [
  body('reactions').exists().isArray(),
  body('reactions.*.community_id').exists().isString().trim(),
  body('reactions.*.reaction').exists().isString().trim(),
  body('reactions.*.created_at').not().exists(),
  body('reactions.*.updated_at').not().exists(),
  body('reactions.*.deleted_at').not().exists(),
];

export const putCommunitiesValidation = [
  body('communities').exists().isArray(),
  body('communities.*.id').exists().isString().trim(),
  body('communities.*.name').exists().isString().trim(),
  body('communities.*.created_at').not().exists(),
  body('communities.*.updated_at').not().exists(),
  body('communities.*.deleted_at').not().exists(),
];

export const postProfilesValidation = [
  body('profiles').exists().isArray(),
  body('profiles.*.community_id').exists().isString().trim(),
  body('profiles.*.created_at').not().exists(),
  body('profiles.*.updated_at').not().exists(),
  body('profiles.*.deleted_at').not().exists(),
];

export const postRolesValidation = [
  body('roles').exists().isArray(),
  body('roles.*.id').exists().toInt(),
  body('roles.*.address_id').exists().toInt(),
  body('roles.*.created_at').not().exists(),
  body('roles.*.updated_at').not().exists(),
  body('roles.*.deleted_at').not().exists(),
];

export const postTopicsValidation = [
  body('topics').exists().isArray(),
  body('topics.*.community_id').exists().isString().trim(),
  body('topics.*.name').exists().isString().trim(),
  body('comments.*.created_at').not().exists(),
  body('comments.*.updated_at').not().exists(),
  body('comments.*.deleted_at').not().exists(),
];