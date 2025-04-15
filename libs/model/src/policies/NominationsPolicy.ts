import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware';

const log = logger(import.meta);

const inputs = {
  NominatorSettled: events.NominatorSettled,
  NominatorNominated: events.NominatorNominated,
  JudgeNominated: events.JudgeNominated,
};

export function NominationsPolicy(): Policy<typeof inputs, ZodUndefined> {
  return {
    inputs,
    body: {
      NominatorSettled: async ({ payload }) => {
        // on configure verification, update community verification status

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

        community.namespace_verified = true;
        await community.save();
      },
      NominatorNominated: async ({ payload }) => {
        // on mint verification (ID 3 minted), append address to community nominations

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

        // append address to community nominations
        await models.sequelize.query(
          `UPDATE "Communities" SET "namespace_nominations" = array_append(COALESCE("namespace_nominations", ARRAY[]::integer[]), :nomination_id)
          WHERE "id" = :community_id`,
          {
            replacements: {
              nomination_id: payload.parsedArgs.nominator,
              community_id: community.id,
            },
          },
        );
      },
      JudgeNominated: async ({ payload }) => {
        // on contest judge nomination, append judge address to contest manager

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
        const contestManager = await models.ContestManager.findOne({
          where: {
            community_id: community.id,
            namespace_judge_token_id: Number(payload.parsedArgs.judgeId),
          },
        });
        mustExist('Contest Manager', contestManager);

        // append new nomination
        await models.sequelize.query(
          `UPDATE "ContestManagers"
          SET "namespace_judges" = array_append(COALESCE("namespace_judges", ARRAY[]::text[]), :judge_address)
          WHERE "contest_address" = :contest_address`,
          {
            replacements: {
              judge_address: payload.parsedArgs.judge,
              contest_address: contestManager.contest_address,
            },
          },
        );
      },
    },
  };
}
