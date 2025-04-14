import { EventHandler, logger } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

const log = logger(import.meta);

// TODO: update contest manager judge_token_id to array
// and append the array with new IDs
export const handleJudgeNominated: EventHandler<
  'JudgeNominated',
  ZodUndefined
> = async ({ payload }) => {
  // const community = await models.Community.findOne({
  //   where: {
  //     namespace: payload.parsedArgs.namespace,
  //   },
  // });
  // if (!community) {
  //   log.warn(
  //     `Community not found for namespace ${payload.parsedArgs.namespace}`,
  //   );
  //   return;
  // }
  // // append new nomination
  // await models.sequelize.query(
  //   `UPDATE "Communities" SET "namespace_nominations" = array_append(COALESCE("namespace_nominations", ARRAY[]::integer[]), :nomination_id)
  //   WHERE "namespace" = :namespace`,
  //   {
  //     replacements: {
  //       nomination_id: payload.parsedArgs.judgeId,
  //       namespace: payload.parsedArgs.namespace,
  //     },
  //   },
  // );
};
