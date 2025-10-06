/* eslint-disable no-warning-comments, no-case-declarations, n/no-process-exit, max-len */

import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { UserTierMap } from '@hicommonwealth/shared';
import * as fs from 'fs';
import * as path from 'path';
import { QueryTypes } from 'sequelize';
import { config } from '../server/config';

// Get configuration from centralized config
const {
  userTierWeights,
  historic: { supply: SUPPLY, decay: DECAY },
} = config.TOKEN_ALLOCATION;

const UserTierWeightsMap: Record<UserTierMap, number> =
  userTierWeights as Record<UserTierMap, number>;

interface ScoringConfig {
  supply: number;
  historicalEndDate: string;
  threadWeight: number;
  commentWeight: number;
  reactionWeight: number;
  historicalOutputPath: string;
  auraOutputPath: string;
  noVietnamese: boolean;
  minLength?: number;
  historicalOrder?: string;
  auraOrder?: string;
  auraEndDate?: string;
  setClaimAddresses?: boolean;
  topN?: number;
}

function parseArguments(): ScoringConfig {
  const args = process.argv.slice(2);

  // Default values
  let historicalEndDate = '2025-05-01T12:00:00.000Z'; // May 1st at noon
  let threadWeight = 10;
  let commentWeight = 5;
  let reactionWeight = 1;
  const timestamp = new Date()
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+/, '');
  let historicalOutputPath = `results/historic-allocation-${timestamp}.csv`;
  let auraOutputPath = `results/aura-allocation-${timestamp}.csv`;
  let noVietnamese = true;
  let minLength: number | undefined = 30;
  let historicalOrder: string = 'token_allocation DESC';
  let auraOrder: string = 'token_allocation DESC';
  let auraEndDate: string = new Date().toISOString();
  let setClaimAddresses = false;
  let topN: number | undefined = undefined;
  let supply = SUPPLY.total;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-he':
      case '--historical-end-date':
        if (i + 1 >= args.length) {
          throw new Error(
            'Historical end date value is required after -he or --historical-end-date flag',
          );
        }
        const dateValue = args[i + 1];
        if (!isValidISODate(dateValue)) {
          throw new Error('Historical end date must be a valid ISO string');
        }
        historicalEndDate = dateValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-t':
      case '--thread-weight':
        if (i + 1 >= args.length) {
          throw new Error(
            'Thread weight value is required after -t or --thread-weight flag',
          );
        }
        const threadValue = parseInt(args[i + 1], 10);
        if (isNaN(threadValue) || threadValue < 0) {
          throw new Error('Thread weight must be a non-negative integer');
        }
        threadWeight = threadValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-c':
      case '--comment-weight':
        if (i + 1 >= args.length) {
          throw new Error(
            'Comment weight value is required after -c or --comment-weight flag',
          );
        }
        const commentValue = parseInt(args[i + 1], 10);
        if (isNaN(commentValue) || commentValue < 0) {
          throw new Error('Comment weight must be a non-negative integer');
        }
        commentWeight = commentValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-r':
      case '--reaction-weight':
        if (i + 1 >= args.length) {
          throw new Error(
            'Reaction weight value is required after -r or --reaction-weight flag',
          );
        }
        const reactionValue = parseInt(args[i + 1], 10);
        if (isNaN(reactionValue) || reactionValue < 0) {
          throw new Error('Reaction weight must be a non-negative integer');
        }
        reactionWeight = reactionValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-o':
      case '--output-path':
        if (i + 1 >= args.length) {
          throw new Error(
            'Output path value is required after -o or --output-path flag',
          );
        }
        if (!args[i + 1].endsWith('.csv')) {
          throw new Error('Output path must end with .csv');
        }
        historicalOutputPath = args[i + 1];
        i++; // Skip the next argument since we consumed it
        break;
      case '--aura-output-path':
      case '-aoo':
        if (i + 1 >= args.length) {
          throw new Error(
            'Aura output path value is required after --aura-output-path or -aoo flag',
          );
        }
        if (!args[i + 1].endsWith('.csv')) {
          throw new Error('Aura output path must end with .csv');
        }
        auraOutputPath = args[i + 1];
        i++;
        break;

      case '-nv':
      case '--no-vietnamese':
        noVietnamese = true;
        break;

      case '-ml':
      case '--minLength':
        if (i + 1 >= args.length) {
          throw new Error(
            'Min length value is required after -ml or --minLength flag',
          );
        }
        const minLengthValue = parseInt(args[i + 1], 10);
        if (isNaN(minLengthValue) || minLengthValue < 0) {
          throw new Error('Min length must be a non-negative integer');
        }
        minLength = minLengthValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-ho':
      case '--historical-order':
        if (i + 1 >= args.length) {
          throw new Error(
            'Historical order value is required after -ho or --historical-order flag',
          );
        }
        const historicalOrderValue = args[i + 1];
        if (!isValidHistoricalOrder(historicalOrderValue)) {
          throw new Error(
            'Historical order must be a valid column name followed by ASC or DESC (e.g., "adjusted_score DESC")',
          );
        }
        historicalOrder = historicalOrderValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-ao':
      case '--aura-order':
        if (i + 1 >= args.length) {
          throw new Error(
            'Aura order value is required after -ao or --aura-order flag',
          );
        }
        const auraOrderValue = args[i + 1];
        if (!isValidAuraOrder(auraOrderValue)) {
          throw new Error(
            'Aura order must be a valid column name followed by ASC or DESC (e.g., "total_xp DESC")',
          );
        }
        auraOrder = auraOrderValue;
        i++; // Skip the next argument since we consumed it
        break;

      case '-aed':
      case '--aura-end-date':
        if (i + 1 >= args.length) {
          throw new Error(
            'Aura end date value is required after -aed or --aura-end-date flag',
          );
        }
        const auraEndDateValue = args[i + 1];
        if (!isValidISODate(auraEndDateValue)) {
          throw new Error('Aura end date must be a valid ISO string');
        }
        auraEndDate = auraEndDateValue;
        i++;
        break;

      case '--set-claim-addresses':
      case '-sca':
        setClaimAddresses = true;
        break;

      case '--top-n':
      case '-n':
        if (i + 1 >= args.length) {
          throw new Error('Top N value is required after -n or --top-n flag');
        }
        const topNValue = parseInt(args[i + 1], 10);
        if (isNaN(topNValue) || topNValue <= 0) {
          throw new Error('Top N value must be a positive integer');
        }
        topN = topNValue;
        i++;
        break;

      case '--supply':
      case '-s':
        if (i + 1 >= args.length) {
          throw new Error('Supply value is required after -s or --supply flag');
        }
        const supplyValue = parseInt(args[i + 1], 10);
        if (isNaN(supplyValue) || supplyValue < 0) {
          throw new Error('Supply value must be a non-negative number');
        }
        supply = supplyValue;
        i++;
        break;

      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
    }
  }

  return {
    supply,
    historicalEndDate,
    threadWeight,
    commentWeight,
    reactionWeight,
    historicalOutputPath,
    auraOutputPath,
    noVietnamese,
    minLength,
    historicalOrder,
    auraOrder,
    auraEndDate,
    setClaimAddresses,
    topN,
  };
}

function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}

function isValidHistoricalOrder(orderClause: string): boolean {
  const validColumns = [
    'user_id',
    'num_threads',
    'thread_score',
    'num_comments',
    'comment_score',
    'num_reactions',
    'reaction_score',
    'unadjusted_score',
    'adjusted_score',
    'percent_allocation',
    'token_allocation',
  ];

  const parts = orderClause.trim().split(/\s+/);
  if (parts.length !== 2) return false;

  const column = parts[0].toLowerCase();
  const direction = parts[1].toUpperCase();

  return (
    validColumns.includes(column) &&
    (direction === 'ASC' || direction === 'DESC')
  );
}

function isValidAuraOrder(orderClause: string): boolean {
  const validColumns = [
    'user_id',
    'total_xp',
    'percent_allocation',
    'token_allocation',
  ];

  const parts = orderClause.trim().split(/\s+/);
  if (parts.length !== 2) return false;

  const column = parts[0].toLowerCase();
  const direction = parts[1].toUpperCase();

  return (
    validColumns.includes(column) &&
    (direction === 'ASC' || direction === 'DESC')
  );
}

function printUsage(): void {
  console.log(`
Usage: pnpm ts-exec historic-contribution-scoring.ts [options] 

Options:
  -he, --historical-end-date <ISO_DATE>  Historical end datetime (ISO string, default: 2025-05-01T12:00:00.000Z)
  -t, --thread-weight <NUMBER>      Thread weight (integer, default: 5)
  -c, --comment-weight <NUMBER>     Comment weight (integer, default: 2)
  -r, --reaction-weight <NUMBER>    Reaction weight (integer, default: 1)
  -o, --output-path <PATH>          Historical output file path (default: historic-allocation.csv)
  -aoo, --aura-output-path <PATH>   Aura output file path (default: aura-allocation.csv)
  -nv, --no-vietnamese              Exclude Vietnamese content (default: false)
  -ml, --minLength <NUMBER>         Minimum content length (integer, default: undefined)
  -ho, --historical-order <ORDER>   Historical allocation ordering (default: "token_allocation DESC")
  -ao, --aura-order <ORDER>         Aura allocation ordering (default: "token_allocation DESC")
  -aed, --aura-end-date <ISO_DATE>  Aura allocation end date (default: NOW())
  -sca, --set-claim-addresses       Assigns last used EVM address to users in ClaimAddresses table (optional)
  -n, --top-n <NUMBER>              Only allocates top N users (integer, optional, used for testing)
  -s, --supply <NUMBER>             Supply for token allocation (default: ${SUPPLY.total})
  -h, --help                        Show this help message

Examples:
  pnpm ts-exec scripts/historic-contribution-scoring.ts
  pnpm ts-exec scripts/historic-contribution-scoring.ts -he 2025-06-01T00:00:00.000Z -t 10 -c 3 -r 1
  pnpm ts-exec scripts/historic-contribution-scoring.ts --thread-weight 8 --comment-weight 4
  pnpm ts-exec scripts/historic-contribution-scoring.ts -o custom-scores.csv
  pnpm ts-exec scripts/historic-contribution-scoring.ts --output-path /path/to/scores.csv
  pnpm ts-exec scripts/historic-contribution-scoring.ts -nv
  pnpm ts-exec scripts/historic-contribution-scoring.ts --no-vietnamese -t 10
  pnpm ts-exec scripts/historic-contribution-scoring.ts -ml 50
  pnpm ts-exec scripts/historic-contribution-scoring.ts --minLength 100 -nv
  pnpm ts-exec scripts/historic-contribution-scoring.ts -ho "adjusted_score DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts --historical-order "adjusted_score DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts -ao "total_xp DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts --aura-order "total_xp DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts -aed 2025-08-01T12:00:00.000Z
  pnpm ts-exec scripts/historic-contribution-scoring.ts --aura-end-date 2025-08-01T12:00:00.000Z
  pnpm ts-exec scripts/historic-contribution-scoring.ts -sca
  pnpm ts-exec scripts/historic-contribution-scoring.ts --set-claim-addresses
  pnpm ts-exec scripts/historic-contribution-scoring.ts -n 100 -sca -s 10000
`);
}

type HistoricalAllocation = {
  user_id: string;
  num_threads: number;
  thread_score: number;
  num_comments: number;
  comment_score: number;
  num_reactions: number;
  reaction_score: number;
  unadjusted_score: number;
  adjusted_score: number;
  percent_allocation: number;
  token_allocation: number;
};

type AuraAllocation = {
  user_id: string;
  total_xp: number;
  percent_allocation: number;
  token_allocation: number;
};

async function populateClaimAddresses(config: ScoringConfig): Promise<void> {
  const query = `
    INSERT INTO "ClaimAddresses" (user_id, address, created_at, updated_at)
    WITH users AS (SELECT user_id
                   FROM "HistoricalAllocations"
                   UNION ALL
                   SELECT user_id
                   FROM "AuraAllocations"),
         user_evm_address AS (SELECT a.user_id,
                                     a.address,
                                     ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.last_active DESC) as rn
                              FROM "Addresses" a
                                     JOIN users u ON a.user_id = u.user_id
                                     JOIN "Communities" c ON a.community_id = c.id
                              WHERE c.network = 'ethereum'
                                AND c.base = 'ethereum'
                                AND a.address LIKE '0x%'
                                AND LENGTH(a.address) = 42)
    SELECT u.user_id,
           CASE WHEN :setClaimAddresses THEN uea.address ELSE NULL END AS address,
           NOW()                                                       AS created_at,
           NOW()                                                       AS updated_at
    FROM users u
           LEFT JOIN user_evm_address uea ON u.user_id = uea.user_id AND uea.rn = 1
    ON CONFLICT (user_id) DO NOTHING;
  `;

  await models.sequelize.query(query, {
    replacements: {
      setClaimAddresses: config.setClaimAddresses,
    },
    type: QueryTypes.INSERT,
  });
}

async function getHistoricalTokenAllocations(
  config: ScoringConfig,
): Promise<Array<HistoricalAllocation>> {
  const historicalPoolTokens = config.supply * SUPPLY.splits.historical;
  const query = `
    INSERT INTO "HistoricalAllocations"
    WITH users AS (SELECT U.id AS user_id, U.created_at, U.tier
                   FROM "Users" U
                   WHERE tier > 1),
         addresses AS (SELECT U.user_id AS user_id,
                              A.id      AS address_id,
                              A.address
                       FROM users U
                              JOIN "Addresses" A ON U.user_id = A.user_id
                       WHERE A.is_banned = false),
         threads AS (SELECT T.id         AS thread_id,
                            T.created_at AS thread_created_at,
                            A.user_id    AS user_id
                     FROM "Threads" T
                            JOIN addresses A ON T.address_id = A.address_id
                     WHERE T.created_at < :historicalEndDate
                       ${
                         config.noVietnamese
                           ? `AND NOT (T.body ~ '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]')`
                           : ''
                       }
                       ${config.minLength ? `AND LENGTH(T.body) >= ${config.minLength}` : ''}),
         comments AS (SELECT C.id         AS comment_id,
                             C.created_at AS comment_created_at,
                             A.user_id    AS user_id
                      FROM "Comments" C
                             JOIN addresses A ON C.address_id = A.address_id
                      WHERE C.created_at < :historicalEndDate
                        ${
                          config.noVietnamese
                            ? `AND NOT (C.body ~ '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]')`
                            : ''
                        }
                        ${config.minLength ? `AND LENGTH(C.body) >= ${config.minLength}` : ''}),
         reactions AS (SELECT R.id                           AS reaction_id,
                              R.created_at                   AS reaction_created_at,
                              COALESCE(T.user_id, C.user_id) AS user_id
                       FROM "Reactions" R
                              LEFT JOIN threads T ON T.thread_id = R.thread_id
                              LEFT JOIN comments C ON C.comment_id = R.comment_id
                       WHERE R.created_at < :historicalEndDate
                         AND (T.user_id IS NOT NULL OR C.user_id IS NOT NULL)),
         thread_scores AS (SELECT T.user_id,
                                  SUM(
                                    exp(
                                      ${DECAY.factor} *
                                      EXTRACT(EPOCH FROM (:historicalEndDate::timestamptz - T.thread_created_at)) /
                                      86400
                                    ) * ${config.threadWeight}
                                  )        AS score,
                                  COUNT(*) AS num_threads
                           FROM threads T
                           GROUP BY T.user_id),
         comment_scores AS (SELECT C.user_id,
                                   SUM(
                                     exp(
                                       ${DECAY.factor} *
                                       EXTRACT(EPOCH FROM (:historicalEndDate::timestamptz - C.comment_created_at)) /
                                       86400
                                     ) * ${config.commentWeight}
                                   )        AS score,
                                   COUNT(*) AS num_comments
                            FROM comments C
                            GROUP BY C.user_id),
         reaction_scores AS (SELECT R.user_id,
                                    SUM(
                                      exp(
                                        ${DECAY.factor} *
                                        EXTRACT(EPOCH FROM (:historicalEndDate::timestamptz - R.reaction_created_at)) /
                                        86400
                                      ) * ${config.reactionWeight}
                                    )        AS score,
                                    COUNT(*) AS num_reactions
                             FROM reactions R
                             GROUP BY R.user_id),
         final_scores AS (SELECT U.user_id                     AS user_id,
                                 COALESCE(TS.num_threads, 0)   AS num_threads,
                                 COALESCE(TS.score, 0)         AS thread_score,
                                 COALESCE(CS.num_comments, 0)  AS num_comments,
                                 COALESCE(CS.score, 0)         AS comment_score,
                                 COALESCE(RS.num_reactions, 0) AS num_reactions,
                                 COALESCE(RS.score, 0)         AS reaction_score,
                                 (COALESCE(TS.score, 0) + COALESCE(CS.score, 0) + COALESCE(RS.score, 0)) *
                                 CASE U.tier
                                   WHEN 0 THEN ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                   WHEN 1 THEN ${UserTierWeightsMap[UserTierMap.BannedUser]}
                                   WHEN 2 THEN ${UserTierWeightsMap[UserTierMap.NewlyVerifiedWallet]}
                                   WHEN 3 THEN ${UserTierWeightsMap[UserTierMap.VerifiedWallet]}
                                   WHEN 4 THEN ${UserTierWeightsMap[UserTierMap.SocialVerified]}
                                   WHEN 5 THEN ${UserTierWeightsMap[UserTierMap.ChainVerified]}
                                   WHEN 6 THEN ${UserTierWeightsMap[UserTierMap.FullyVerified]}
                                   WHEN 7 THEN ${UserTierWeightsMap[UserTierMap.ManuallyVerified]}
                                   WHEN 8 THEN ${UserTierWeightsMap[UserTierMap.SystemUser]}
                                   ELSE ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                   END                         AS unadjusted_score,
                                 sqrt(((COALESCE(TS.score, 0) + COALESCE(CS.score, 0) + COALESCE(RS.score, 0)) *
                                       CASE U.tier
                                         WHEN 0 THEN ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                         WHEN 1 THEN ${UserTierWeightsMap[UserTierMap.BannedUser]}
                                         WHEN 2 THEN ${UserTierWeightsMap[UserTierMap.NewlyVerifiedWallet]}
                                         WHEN 3 THEN ${UserTierWeightsMap[UserTierMap.VerifiedWallet]}
                                         WHEN 4 THEN ${UserTierWeightsMap[UserTierMap.SocialVerified]}
                                         WHEN 5 THEN ${UserTierWeightsMap[UserTierMap.ChainVerified]}
                                         WHEN 6 THEN ${UserTierWeightsMap[UserTierMap.FullyVerified]}
                                         WHEN 7 THEN ${UserTierWeightsMap[UserTierMap.ManuallyVerified]}
                                         WHEN 8 THEN ${UserTierWeightsMap[UserTierMap.SystemUser]}
                                         ELSE ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                         END)::NUMERIC)        AS adjusted_score
                          FROM users U
                                 LEFT JOIN thread_scores TS ON TS.user_id = U.user_id
                                 LEFT JOIN comment_scores CS ON CS.user_id = U.user_id
                                 LEFT JOIN reaction_scores RS ON RS.user_id = U.user_id)
    SELECT *,
           (adjusted_score / (SELECT SUM(adjusted_score) FROM final_scores)) * 100                              AS percent_allocation,
           (adjusted_score / (SELECT SUM(adjusted_score) FROM final_scores)) *
           ${historicalPoolTokens}::NUMERIC                                                                     AS token_allocation
    FROM final_scores
    ORDER BY ${config.historicalOrder} NULLS LAST
      ${config.topN ? `LIMIT :topN` : ''}
  `;

  return await models.sequelize.query<HistoricalAllocation>(query, {
    replacements: {
      historicalEndDate: config.historicalEndDate,
      topN: config.topN,
    },
    type: QueryTypes.SELECT,
  });
}

async function getAuraTokenAllocations(
  config: ScoringConfig,
): Promise<Array<AuraAllocation>> {
  const auraPoolTokens = config.supply * SUPPLY.splits.aura;
  const query = `
    INSERT INTO "AuraAllocations"
    WITH user_weighted_xp AS (SELECT user_id,
                                     SUM(XL.xp_points) *
                                     CASE U.tier
                                       WHEN 0 THEN ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                       WHEN 1 THEN ${UserTierWeightsMap[UserTierMap.BannedUser]}
                                       WHEN 2 THEN ${UserTierWeightsMap[UserTierMap.NewlyVerifiedWallet]}
                                       WHEN 3 THEN ${UserTierWeightsMap[UserTierMap.VerifiedWallet]}
                                       WHEN 4 THEN ${UserTierWeightsMap[UserTierMap.SocialVerified]}
                                       WHEN 5 THEN ${UserTierWeightsMap[UserTierMap.ChainVerified]}
                                       WHEN 6 THEN ${UserTierWeightsMap[UserTierMap.FullyVerified]}
                                       WHEN 7 THEN ${UserTierWeightsMap[UserTierMap.ManuallyVerified]}
                                       WHEN 8 THEN ${UserTierWeightsMap[UserTierMap.SystemUser]}
                                       ELSE ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                       END AS weighted_xp_points
                              FROM "XpLogs" XL
                                     LEFT JOIN "Users" U ON XL.user_id = U.id
                              WHERE :historicalEndDate < XL.created_at
                                AND XL.created_at < :auraEndDate
                              GROUP BY user_id, U.tier),
         creator_weighted_xp AS (SELECT creator_user_id,
                                        SUM(creator_xp_points) *
                                        CASE U.tier
                                          WHEN 0 THEN ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                          WHEN 1 THEN ${UserTierWeightsMap[UserTierMap.BannedUser]}
                                          WHEN 2 THEN ${UserTierWeightsMap[UserTierMap.NewlyVerifiedWallet]}
                                          WHEN 3 THEN ${UserTierWeightsMap[UserTierMap.VerifiedWallet]}
                                          WHEN 4 THEN ${UserTierWeightsMap[UserTierMap.SocialVerified]}
                                          WHEN 5 THEN ${UserTierWeightsMap[UserTierMap.ChainVerified]}
                                          WHEN 6 THEN ${UserTierWeightsMap[UserTierMap.FullyVerified]}
                                          WHEN 7 THEN ${UserTierWeightsMap[UserTierMap.ManuallyVerified]}
                                          WHEN 8 THEN ${UserTierWeightsMap[UserTierMap.SystemUser]}
                                          ELSE ${UserTierWeightsMap[UserTierMap.IncompleteUser]}
                                          END AS weighted_creator_xp_points
                                 FROM "XpLogs" XL
                                        LEFT JOIN "Users" U ON XL.creator_user_id = U.id
                                 WHERE :historicalEndDate < XL.created_at
                                   AND XL.created_at < :auraEndDate
                                 GROUP BY creator_user_id, U.tier),
         xp_sum AS (SELECT (SELECT SUM(weighted_xp_points) FROM user_weighted_xp) +
                           (SELECT SUM(weighted_creator_xp_points) FROM creator_weighted_xp) AS total_xp_awarded)
    SELECT U.id                                                                              AS user_id,
           COALESCE(UWX.weighted_xp_points, 0) + COALESCE(CWX.weighted_creator_xp_points, 0) AS total_xp,
           (COALESCE(UWX.weighted_xp_points, 0) + COALESCE(CWX.weighted_creator_xp_points, 0))::NUMERIC /
           (SELECT total_xp_awarded FROM xp_sum) * 100                                       AS percent_allocation,
           (COALESCE(UWX.weighted_xp_points, 0) + COALESCE(CWX.weighted_creator_xp_points, 0))::NUMERIC /
           (SELECT total_xp_awarded FROM xp_sum) * ${auraPoolTokens}::NUMERIC                AS token_allocation
    FROM "Users" U
           LEFT JOIN user_weighted_xp UWX ON UWX.user_id = U.id
           LEFT JOIN creator_weighted_xp CWX ON CWX.creator_user_id = U.id
    ORDER BY ${config.auraOrder} NULLS LAST
      ${config.topN ? `LIMIT :topN` : ''}
    ;
  `;

  return await models.sequelize.query<AuraAllocation>(query, {
    replacements: {
      historicalEndDate: config.historicalEndDate,
      auraEndDate: config.auraEndDate,
      topN: config.topN,
    },
    type: QueryTypes.SELECT,
  });
}

async function distributeHistoricalRemainder(
  config: ScoringConfig,
): Promise<void> {
  const historicalPoolTokens = Math.floor(
    config.supply * SUPPLY.splits.historical,
  );

  // Step 1: Update token_allocation to be the floor of its current value
  await models.sequelize.query(
    `
      UPDATE "HistoricalAllocations"
      SET token_allocation = FLOOR(token_allocation)
    `,
    { type: QueryTypes.UPDATE },
  );

  // Step 2: Calculate the total token_allocation
  const [{ total_allocated }] = await models.sequelize.query<{
    total_allocated: number;
  }>(
    `
      SELECT SUM(token_allocation) as total_allocated
      FROM "HistoricalAllocations"
    `,
    { type: QueryTypes.SELECT },
  );

  // Step 3: Calculate the remainder
  const remainder = historicalPoolTokens - total_allocated;

  console.log(
    `Historical pool tokens: ${historicalPoolTokens.toLocaleString()}`,
  );
  console.log(`Total allocated: ${total_allocated.toLocaleString()}`);
  console.log(`Remainder to distribute: ${remainder.toLocaleString()}`);

  if (remainder <= 0) {
    if (remainder < 0) {
      console.warn(
        `Warning: Negative historical remainder detected: ${remainder}. This may indicate an allocation error.`,
      );
    } else {
      console.log('No historical remainder to distribute.');
    }
    return;
  }

  // Step 4: Distribute the remainder to top users ranked by percent_allocation, then by user_id
  const topUsers = await models.sequelize.query<{ user_id: string }>(
    `
      SELECT user_id
      FROM "HistoricalAllocations"
      ORDER BY percent_allocation DESC, user_id DESC
      LIMIT :remainder
    `,
    {
      replacements: { remainder },
      type: QueryTypes.SELECT,
    },
  );

  await models.sequelize.query(
    `
    UPDATE "HistoricalAllocations"
    SET token_allocation = token_allocation + 1
    WHERE user_id IN (:userIds)
  `,
    {
      replacements: { userIds: topUsers.map((u) => u.user_id) },
      type: QueryTypes.UPDATE,
    },
  );

  console.log(
    `✅ Distributed ${remainder.toLocaleString()} remainder tokens to top ${topUsers.length} historical users.`,
  );
}

async function distributeAuraRemainder(config: ScoringConfig): Promise<void> {
  console.log('Distributing aura allocation remainder...');

  const auraPoolTokens = Math.floor(config.supply * SUPPLY.splits.aura);

  // Step 1: Update token_allocation to be the floor of its current value
  await models.sequelize.query(
    `
      UPDATE "AuraAllocations"
      SET token_allocation = FLOOR(token_allocation)
    `,
    { type: QueryTypes.UPDATE },
  );

  // Step 2: Calculate the total token_allocation
  const [{ total_allocated }] = await models.sequelize.query<{
    total_allocated: number;
  }>(
    `
      SELECT SUM(token_allocation) as total_allocated
      FROM "AuraAllocations"
    `,
    { type: QueryTypes.SELECT },
  );

  // Step 3: Calculate the remainder
  const remainder = auraPoolTokens - total_allocated;

  console.log(`Aura pool tokens: ${auraPoolTokens.toLocaleString()}`);
  console.log(`Total allocated: ${total_allocated.toLocaleString()}`);
  console.log(`Remainder to distribute: ${remainder.toLocaleString()}`);

  if (remainder <= 0) {
    if (remainder < 0) {
      console.warn(
        `Warning: Negative aura remainder detected: ${remainder}. This may indicate an allocation error.`,
      );
    } else {
      console.log('No aura remainder to distribute.');
    }
    return;
  }

  // Step 4: Distribute the remainder to top users ranked by percent_allocation, then by user_id
  const topUsers = await models.sequelize.query<{ user_id: string }>(
    `
      SELECT user_id
      FROM "AuraAllocations"
      ORDER BY percent_allocation DESC, user_id ASC
      LIMIT :remainder;
    `,
    {
      replacements: { remainder },
      type: QueryTypes.SELECT,
    },
  );

  await models.sequelize.query(
    `
        UPDATE "AuraAllocations"
        SET token_allocation = token_allocation + 1
        WHERE user_id IN (:userIds);
      `,
    {
      replacements: { userIds: topUsers.map((u) => u.user_id) },
      type: QueryTypes.UPDATE,
    },
  );

  console.log(
    `✅ Distributed ${remainder.toLocaleString()} remainder tokens to top ${topUsers.length} aura users.`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function writeScoresToCSV<T extends Record<string, unknown>>(
  scores: Array<T>,
  outputPath: string,
) {
  if (!scores.length) {
    console.warn(`No data to write to ${outputPath}`);
    return;
  }

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Dynamically get headers from the first object
  const headers = Object.keys(scores[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...scores.map((score) => headers.map((h) => score[h]).join(',')),
  ].join('\n');

  // Write to file
  fs.writeFileSync(outputPath, csvContent, 'utf8');
  console.log(`Scores written to: ${outputPath}`);
  console.log(`Total records processed: ${scores.length}`);
}

async function main() {
  try {
    const config = parseArguments();

    console.log(
      `Scoring Configuration:${config.topN ? ` TOP ${config.topN}` : ''}`,
    );

    console.log(`
	Historical Configuration:`);
    console.log(`		Historical End Date: ${config.historicalEndDate}`);
    console.log(`		Thread Weight: ${config.threadWeight}`);
    console.log(`		Comment Weight: ${config.commentWeight}`);
    console.log(`		Reaction Weight: ${config.reactionWeight}`);
    console.log(`		No Vietnamese: ${config.noVietnamese}`);
    console.log(
      `		Min Length: ${config.minLength ?? 'no minimum content length'}`,
    );
    console.log(`		Historical Order: ${config.historicalOrder}`);
    console.log(`		Historical Output Path: ${config.historicalOutputPath}`);

    console.log(`
	Aura Configuration:`);
    console.log(`		Aura End Date: ${config.auraEndDate}`);
    console.log(`		Aura Order: ${config.auraOrder}`);
    console.log(`		Aura Output Path: ${config.auraOutputPath}`);

    console.log(`
	Shared Configuration:`);
    console.log(`		Supply: ${config.supply}`);
    console.log(
      `		Set Claim Addresses: ${config.setClaimAddresses ? 'Yes' : 'No'}`,
    );

    console.log(`
`);

    console.log('Truncating tables...');
    await models.sequelize.query(
      `TRUNCATE "HistoricalAllocations", "AuraAllocations", "ClaimAddresses" RESTART IDENTITY;`,
    );
    console.log('Tables truncated.');

    console.log('Generating historical token allocations...');
    await getHistoricalTokenAllocations(config);
    console.log('Historical token allocations generated.');

    console.log('Distributing historical remainder...');
    await distributeHistoricalRemainder(config);
    console.log('Historical remainder distributed.');

    console.log('Generating aura token allocations...');
    await getAuraTokenAllocations(config);
    console.log('Aura token allocations generated.');

    console.log('Distributing aura remainder...');
    await distributeAuraRemainder(config);
    console.log('Aura remainder distributed.');

    console.log('Populating claim addresses...');
    await populateClaimAddresses(config);
    console.log('Claim addresses populated.');

    // Get the scores from the database
    const historicScores = await models.sequelize.query<HistoricalAllocation>(
      'SELECT * FROM "HistoricalAllocations" ORDER BY token_allocation DESC',
      { type: QueryTypes.SELECT },
    );
    const auraScores = await models.sequelize.query<AuraAllocation>(
      'SELECT * FROM "AuraAllocations" ORDER BY token_allocation DESC',
      { type: QueryTypes.SELECT },
    );

    // Write both CSV files
    writeScoresToCSV(historicScores, config.historicalOutputPath);
    writeScoresToCSV(auraScores, config.auraOutputPath);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log('\nUse -h or --help for usage information');
    process.exit(1);
  }
}

main()
  .then(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  })
  .catch((err) => {
    console.error(err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
