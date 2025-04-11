import { EventHandler, logger } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';
import { models } from '../../database';

const log = logger(import.meta);

export const handleJudgeNominated: EventHandler<
  'JudgeNominated',
  ZodUndefined
> = async ({ payload }) => {
  const community = await models.Community.findOne({
    where: {
      namespace: payload.parsedArgs.namespace,
    },
  });
  if (!community) {
    log.warn(
      `Community not found for namespace ${payload.parsedArgs.namespace}`,
    );
    return;
  }

  // append new nomination
  await models.sequelize.query(
    `UPDATE "Communities" SET "namespace_nominations" = array_append(COALESCE("namespace_nominations", ARRAY[]::integer[]), :nomination_id)
    WHERE "namespace" = :namespace`,
    {
      replacements: {
        nomination_id: payload.parsedArgs.judgeId,
        namespace: payload.parsedArgs.namespace,
      },
    },
  );
};
