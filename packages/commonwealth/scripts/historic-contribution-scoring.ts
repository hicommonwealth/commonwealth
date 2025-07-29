/* eslint-disable no-warning-comments, no-case-declarations, n/no-process-exit, max-len */

import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import * as fs from 'fs';
import * as path from 'path';
import { QueryTypes } from 'sequelize';

const totalSupply = 10_000_000_000;

interface ScoringConfig {
  historicalEndDate: string;
  threadWeight: number;
  commentWeight: number;
  reactionWeight: number;
  historicalOutputPath: string;
  auraOutputPath: string;
  noVietnamese: boolean;
  minLength?: number;
  supplyPercent: number;
  historicalOrder?: string;
  auraOrder?: string;
  auraEndDate?: string;
  setClaimAddresses?: boolean;
}

function parseArguments(): ScoringConfig {
  const args = process.argv.slice(2);

  // Default values
  let historicalEndDate = '2025-05-01T12:00:00.000Z'; // May 1st at noon
  let threadWeight = 5;
  let commentWeight = 2;
  let reactionWeight = 1;
  let historicalOutputPath = 'historic-allocation.csv';
  let auraOutputPath = 'aura-allocation.csv';
  let noVietnamese = false;
  let minLength: number | undefined = undefined;
  let supplyPercent = 0.025; // Default to 2.5%
  let historicalOrder: string = 'token_allocation DESC';
  let auraOrder: string = 'token_allocation DESC';
  let auraEndDate: string = new Date().toISOString();
  let setClaimAddresses = false;

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

      case '-sp':
      case '--supply-percent':
        if (i + 1 >= args.length) {
          throw new Error(
            'Supply percent value is required after -sp or --supply-percent flag',
          );
        }
        const supplyPercentValue = parseFloat(args[i + 1]);
        if (
          isNaN(supplyPercentValue) ||
          supplyPercentValue < 0 ||
          supplyPercentValue > 100
        ) {
          throw new Error('Supply percent must be a number between 0 and 100');
        }
        supplyPercent = supplyPercentValue / 100;
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

      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
        break;

      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return {
    historicalEndDate,
    threadWeight,
    commentWeight,
    reactionWeight,
    historicalOutputPath,
    auraOutputPath,
    noVietnamese,
    minLength,
    supplyPercent,
    historicalOrder,
    auraOrder,
    auraEndDate,
    setClaimAddresses,
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
Usage: ts-node historic-contribution-scoring.ts [options]

Options:
  -he, --historical-end-date <ISO_DATE>  Historical end datetime (ISO string, default: 2025-05-01T12:00:00.000Z)
  -t, --thread-weight <NUMBER>      Thread weight (integer, default: 5)
  -c, --comment-weight <NUMBER>     Comment weight (integer, default: 2)
  -r, --reaction-weight <NUMBER>    Reaction weight (integer, default: 1)
  -o, --output-path <PATH>          Historical output file path (default: historic-allocation.csv)
  -aoo, --aura-output-path <PATH>   Aura output file path (default: aura-allocation.csv)
  -nv, --no-vietnamese              Exclude Vietnamese content (default: false)
  -ml, --minLength <NUMBER>         Minimum content length (integer, default: undefined)
  -sp, --supply-percent <NUMBER>    Supply percent for token allocation (0-100, default: 2.5)
  -ho, --historical-order <ORDER>  Historical allocation ordering (default: "token_allocation DESC")
  -ao, --aura-order <ORDER>        Aura allocation ordering (default: "token_allocation DESC")
  -aed, --aura-end-date <ISO_DATE> Aura allocation end date (default: NOW())
  -sca, --set-claim-addresses       Truncate and set claim addresses table (optional)
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
  pnpm ts-exec scripts/historic-contribution-scoring.ts -sp 10
  pnpm ts-exec scripts/historic-contribution-scoring.ts --supply-percent 5 -t 5 -c 2
  pnpm ts-exec scripts/historic-contribution-scoring.ts -sp 20 --no-vietnamese -ml 100
  pnpm ts-exec scripts/historic-contribution-scoring.ts -ho "adjusted_score DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts --historical-order "adjusted_score DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts -ao "total_xp DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts --aura-order "total_xp DESC"
  pnpm ts-exec scripts/historic-contribution-scoring.ts -aed 2025-08-01T12:00:00.000Z
  pnpm ts-exec scripts/historic-contribution-scoring.ts --aura-end-date 2025-08-01T12:00:00.000Z
  pnpm ts-exec scripts/historic-contribution-scoring.ts -sca
  pnpm ts-exec scripts/historic-contribution-scoring.ts --set-claim-addresses
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

async function getHistoricalTokenAllocations(
  config: ScoringConfig,
): Promise<Array<HistoricalAllocation>> {
  return await models.sequelize.query<HistoricalAllocation>(
    `
      INSERT INTO "HistoricalAllocations"
      WITH users AS (SELECT U.id as user_id, U.created_at
                     FROM "Users" U),
           addresses AS (SELECT U.user_id as user_id, A.id as address_id, A.address
                         FROM users U
                                JOIN "Addresses" A on U.user_id = A.user_id),
           threads AS (SELECT T.id as thread_id, T.created_at as thread_created_at, A.user_id as user_id
                       FROM "Threads" T
                              JOIN addresses A ON T.address_id = A.address_id
                       WHERE T.created_at < :historicalEndDate ${
                         config.noVietnamese
                           ? `AND NOT (T.body ~ '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]')`
                           : ''
                       } ${config.minLength ? `AND LENGTH(T.body) >= ${config.minLength}` : ''}),
           comments AS (SELECT C.id as comment_id, C.created_at as comment_created_at, A.user_id as user_id
                        FROM "Comments" C
                               JOIN addresses A ON C.address_id = A.address_id
                        WHERE C.created_at < :historicalEndDate ${
                          config.noVietnamese
                            ? `AND NOT (C.body ~ '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]')`
                            : ''
                        } ${config.minLength ? `AND LENGTH(C.body) >= ${config.minLength}` : ''}),
           reactions AS (SELECT R.id                           as reaction_id,
                                R.created_at                   as reaction_created_at,
                                COALESCE(T.user_id, C.user_id) as user_id
                         FROM "Reactions" R
                                LEFT JOIN threads T ON T.thread_id = R.thread_id
                                LEFT JOIN comments C ON C.comment_id = R.comment_id
                         WHERE R.created_at < :historicalEndDate
                           AND (T.user_id IS NOT NULL OR C.user_id IS NOT NULL)),
           thread_scores AS (SELECT T.user_id,
                                    SUM(exp(
                                          (ln(2) / 365) *
                                          EXTRACT(EPOCH FROM (:historicalEndDate::timestamptz - T.thread_created_at)) /
                                          86400
                                        ) * ${config.threadWeight}) as score,
                                    COUNT(*)                        as num_threads
                             FROM threads T
                             GROUP BY T.user_id),
           comment_scores AS (SELECT C.user_id,
                                     SUM(exp(
                                           (ln(2) / 365) *
                                           EXTRACT(EPOCH FROM
                                                   (:historicalEndDate::timestamptz - C.comment_created_at)) / 86400
                                         ) * ${config.commentWeight}) as score,
                                     COUNT(*)                         as num_comments
                              FROM comments C
                              GROUP BY C.user_id),
           reaction_scores AS (SELECT R.user_id,
                                      SUM(exp(
                                            (ln(2) / 365) *
                                            EXTRACT(EPOCH FROM
                                                    (:historicalEndDate::timestamptz - R.reaction_created_at)) / 86400
                                          ) * ${config.reactionWeight}) as score,
                                      COUNT(*)                          as num_reactions
                               FROM reactions R
                               GROUP BY R.user_id),
           final_scores as (SELECT U.user_id                              as user_id,
                                   COALESCE(TS.num_threads, 0)            as num_threads,
                                   COALESCE(TS.score, 0)                  as thread_score,
                                   COALESCE(CS.num_comments, 0)           as num_comments,
                                   COALESCE(CS.score, 0)                  as comment_score,
                                   COALESCE(RS.num_reactions, 0)          as num_reactions,
                                   COALESCE(RS.score, 0)                  as reaction_score,
                                   COALESCE(TS.score, 0) + COALESCE(CS.score, 0) +
                                   COALESCE(RS.score, 0)                  as unadjusted_score,
                                   sqrt((COALESCE(TS.score, 0) + COALESCE(CS.score, 0) +
                                         COALESCE(RS.score, 0))::NUMERIC) as adjusted_score
                            FROM users U
                                   LEFT JOIN thread_scores TS ON TS.user_id = U.user_id
                                   LEFT JOIN comment_scores CS ON CS.user_id = U.user_id
                                   LEFT JOIN reaction_scores RS ON RS.user_id = U.user_id)
      SELECT *,
             (adjusted_score::NUMERIC / (SELECT SUM(adjusted_score::NUMERIC) FROM final_scores)) *
             100                                                  as percent_allocation,
             (adjusted_score::NUMERIC / (SELECT SUM(adjusted_score::NUMERIC) FROM final_scores)) *
             ${(config.supplyPercent / 2) * totalSupply}::NUMERIC as token_allocation
      FROM final_scores
      ORDER BY ${config.historicalOrder} NULLS LAST;
    `,
    {
      replacements: {
        historicalEndDate: config.historicalEndDate,
      },
      type: QueryTypes.SELECT,
    },
  );
}

async function getAuraTokenAllocations(
  config: ScoringConfig,
): Promise<Array<AuraAllocation>> {
  return await models.sequelize.query<AuraAllocation>(
    `
      INSERT INTO "AuraAllocations"
      WITH xp_sum AS (SELECT SUM(xp_points) + SUM(creator_xp_points) as total_xp_awarded
                      FROM "XpLogs"
                      WHERE :historicalEndDate < created_at
                        AND created_at < :auraEndDate),
           user_xp AS (SELECT user_id,
                              SUM(xp_points) as xp_points
                       FROM "XpLogs"
                       WHERE :historicalEndDate < created_at
                         AND created_at < :auraEndDate
                       GROUP BY user_id),
           creator_xp AS (SELECT creator_user_id,
                                 SUM(creator_xp_points) as creator_xp_points
                          FROM "XpLogs"
                          WHERE :historicalEndDate < created_at
                            AND created_at < :auraEndDate
                          GROUP BY creator_user_id)
      SELECT U.id                                                          as user_id,
             COALESCE(UX.xp_points, 0) + COALESCE(CX.creator_xp_points, 0) as total_xp,
             (COALESCE(UX.xp_points, 0) + COALESCE(CX.creator_xp_points, 0))::NUMERIC /
             (SELECT total_xp_awarded FROM xp_sum) *
             100                                                           as percent_allocation,
             (COALESCE(UX.xp_points, 0) + COALESCE(CX.creator_xp_points, 0))::NUMERIC /
             (SELECT total_xp_awarded FROM xp_sum) *
             ${(config.supplyPercent / 2) * totalSupply}::NUMERIC          as token_allocation
      FROM "Users" U
             LEFT JOIN user_xp UX ON UX.user_id = U.id
             LEFT JOIN creator_xp CX ON CX.creator_user_id = U.id
      ORDER BY ${config.auraOrder} NULLS LAST;
    `,
    {
      replacements: {
        historicalEndDate: config.historicalEndDate,
        auraEndDate: config.auraEndDate,
      },
      type: QueryTypes.SELECT,
    },
  );
}

async function setClaimableAddresses() {
  await models.sequelize.query(`
    WITH max_last_active AS (SELECT A.user_id,
                                    MAX(A.last_active) as max_last_active
                             FROM "Addresses" A
                                    JOIN "Communities" C ON C.id = A.community_id
                             WHERE C.network = 'ethereum'
                               AND C.base = 'ethereum'
                               AND A.address LIKE '0x%'
                               AND LENGTH(A.address) = 42
                             GROUP BY A.user_id),
         max_addresses AS (SELECT A.address,
                                  A.user_id
                           FROM "Addresses" A
                                  JOIN max_last_active MLA ON A.user_id = MLA.user_id
                           WHERE A.last_active = MLA.max_last_active)

    INSERT
    INTO "ClaimAddresses" (user_id, address, created_at, updated_at)
    SELECT user_id, address, NOW() as created_at, NOW() as updated_at
    FROM max_addresses;
  `);
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

    console.log('Scoring Configuration:');

    console.log(`\n\tHistorical Configuration:`);
    console.log(`\t\tHistorical End Date: ${config.historicalEndDate}`);
    console.log(`\t\tThread Weight: ${config.threadWeight}`);
    console.log(`\t\tComment Weight: ${config.commentWeight}`);
    console.log(`\t\tReaction Weight: ${config.reactionWeight}`);
    console.log(`\t\tNo Vietnamese: ${config.noVietnamese}`);
    console.log(
      `\t\tMin Length: ${config.minLength ?? 'no minimum content length'}`,
    );
    console.log(`\t\tHistorical Order: ${config.historicalOrder}`);
    console.log(`\t\tHistorical Output Path: ${config.historicalOutputPath}`);

    console.log(`\n\tAura Configuration:`);
    console.log(`\t\tAura End Date: ${config.auraEndDate}`);
    console.log(`\t\tAura Order: ${config.auraOrder}`);
    console.log(`\t\tAura Output Path: ${config.auraOutputPath}`);

    console.log(`\n\tShared Configuration:`);
    console.log(`\t\tSupply Percent: ${config.supplyPercent}`);

    console.log(`\n`);

    console.log('Truncating tables if they exist');
    await models.sequelize.query(`TRUNCATE "HistoricalAllocations";`);
    await models.sequelize.query(`TRUNCATE "AuraAllocations"`);
    if (config.setClaimAddresses) {
      await models.sequelize.query(`TRUNCATE "ClaimAddresses";`);
      console.log('ClaimAddresses table truncated');
      console.log('Setting claim addresses...');
      await setClaimableAddresses();
      console.log('Claim addresses set');
    }

    console.log('Generating historical token allocations...');
    await getHistoricalTokenAllocations(config);
    console.log('Generating aura token allocations...');
    await getAuraTokenAllocations(config);

    // // Write both CSV files
    // writeScoresToCSV(scores, config.historicalOutputPath);
    // writeScoresToCSV(auraScores, config.auraOutputPath);
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
