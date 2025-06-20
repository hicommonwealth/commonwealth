import { config, logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod/v4';
import { models } from '../database';
import { mustExist } from '../middleware';

const log = logger(import.meta);

const inputs = {
  NominatorSettled: events.NominatorSettled,
  NominatorNominated: events.NominatorNominated,
  JudgeNominated: events.JudgeNominated,
};

export function NominationsWorker(): Policy<typeof inputs, ZodUndefined> {
  return {
    inputs,
    body: {
      NominatorSettled: async ({ payload }) => {
        // on configure verification (ID 3 created), update community verification status

        const community = await models.Community.findOne({
          where: {
            namespace: payload.parsedArgs.namespace,
            environment: config.APP_ENV,
          },
        });
        if (!community) {
          log.warn(
            `Community not found for namespace ${payload.parsedArgs.namespace}`,
          );
          return;
        }

        community.namespace_verification_configured = true;
        await community.save();
      },
      NominatorNominated: async ({ payload }) => {
        // on mint verification (ID 3 minted), append address to community nominations

        const community = await models.Community.findOne({
          where: {
            namespace: payload.parsedArgs.namespace,
            environment: config.APP_ENV,
          },
        });
        if (!community) {
          log.warn(
            `Community not found for namespace ${payload.parsedArgs.namespace}`,
          );
          return;
        }

        // append address to community nominations
        await models.sequelize.transaction(async (transaction) => {
          await models.sequelize.query(
            `UPDATE "Communities"
            SET "namespace_nominations" = CASE
              WHEN :nominator = ANY(COALESCE("namespace_nominations", ARRAY[]::text[])) THEN "namespace_nominations"
              ELSE array_append(COALESCE("namespace_nominations", ARRAY[]::text[]), :nominator)
            END
            WHERE "id" = :community_id`,
            {
              replacements: {
                nominator: payload.parsedArgs.nominator,
                community_id: community.id,
              },
              transaction,
            },
          );
          await models.Community.update(
            { namespace_verified: true },
            { where: { id: community.id }, transaction },
          );
        });
      },
      JudgeNominated: async ({ payload }) => {
        // on contest judge nomination, append judge address to contest manager

        const community = await models.Community.findOne({
          where: {
            namespace: payload.parsedArgs.namespace,
            environment: config.APP_ENV,
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
            environment: config.APP_ENV,
          },
        });
        mustExist('Contest Manager', contestManager);

        // append new nomination
        await models.sequelize.query(
          `UPDATE "ContestManagers"
          SET "namespace_judges" = CASE
            WHEN :judge_address = ANY(COALESCE("namespace_judges", ARRAY[]::text[])) THEN "namespace_judges"
            ELSE array_append(COALESCE("namespace_judges", ARRAY[]::text[]), :judge_address)
          END
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
