/* eslint-disable no-warning-comments, n/no-process-exit, max-len */

import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { config as envConfig } from '../server/config';

if (!envConfig.AURA_RETRO_DROP) {
  throw new Error('Aura retro drop configuration not set!');
}

// Get configuration from centralized config
const { userTierWeights, totalSupply: TOTAL_SUPPLY } =
  envConfig.AURA_RETRO_DROP;

const UserTierWeightsMap: Record<UserTierMap, number> =
  userTierWeights as Record<UserTierMap, number>;

interface ValidXpPerUser {
  user_id: number;
  tier: number;
  total_xp: number;
  percent_allocation: number;
  token_allocation: number;
}

/**
 * Calculate weighted token allocations for users in ValidXpPerUser table.
 * Allocations are based on each user's tier-weighted XP relative to the total.
 */
async function calculateTokenAllocations(): Promise<Array<ValidXpPerUser>> {
  const query = `
    WITH weighted_xp AS (
      SELECT 
        user_id,
        tier,
        total_xp,
        total_xp * 
        CASE tier
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
        END AS weighted_xp
      FROM "ValidXpPerUser"
    ),
    total_weighted AS (
      SELECT SUM(weighted_xp) AS total_weighted_xp
      FROM weighted_xp
    )
    SELECT 
      wx.user_id,
      wx.tier,
      wx.total_xp,
      (wx.weighted_xp / tw.total_weighted_xp * 100)::NUMERIC AS percent_allocation,
      (wx.weighted_xp / tw.total_weighted_xp * ${TOTAL_SUPPLY})::NUMERIC AS token_allocation
    FROM weighted_xp wx
    CROSS JOIN total_weighted tw
    ORDER BY percent_allocation DESC, user_id DESC
  `;

  return await models.sequelize.query<ValidXpPerUser>(query, {
    type: QueryTypes.SELECT,
  });
}

/**
 * Update the ValidXpPerUser table with calculated allocations
 * Only updates non-zero allocations, batched for efficiency
 */
async function updateAllocations(
  allocations: Array<ValidXpPerUser>,
): Promise<void> {
  console.log('Updating ValidXpPerUser table with allocations...');

  // Filter out zero allocations - no point updating these
  const nonZeroAllocations = allocations.filter((a) => a.token_allocation > 0);

  console.log(`   Total allocations: ${allocations.length.toLocaleString()}`);
  console.log(
    `   Non-zero allocations: ${nonZeroAllocations.length.toLocaleString()}`,
  );
  console.log(
    `   Skipped zero allocations: ${(allocations.length - nonZeroAllocations.length).toLocaleString()}`,
  );

  if (nonZeroAllocations.length === 0) {
    console.log('⚠️  No non-zero allocations to update');
    return;
  }

  // Batch size for updates
  const BATCH_SIZE = 100_000;
  const batches: Array<Array<ValidXpPerUser>> = [];

  for (let i = 0; i < nonZeroAllocations.length; i += BATCH_SIZE) {
    batches.push(nonZeroAllocations.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `   Processing ${batches.length.toLocaleString()} batch(es) of up to ${BATCH_SIZE.toLocaleString()} records...`,
  );

  // Use a transaction to ensure all updates succeed or fail together
  await models.sequelize.transaction(async (transaction) => {
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const recordsProcessed = Math.min(
        (i + 1) * BATCH_SIZE,
        nonZeroAllocations.length,
      );

      // Build VALUES clause for this batch
      const values = batch
        .map(
          (a) =>
            `(${a.user_id}, ${a.percent_allocation}, ${a.token_allocation})`,
        )
        .join(',\n        ');

      await models.sequelize.query(
        `
        UPDATE "ValidXpPerUser" AS v
        SET 
          percent_allocation = u.percent_allocation,
          token_allocation = u.token_allocation
        FROM (VALUES
          ${values}
        ) AS u(user_id, percent_allocation, token_allocation)
        WHERE v.user_id = u.user_id
      `,
        {
          type: QueryTypes.UPDATE,
          transaction,
        },
      );

      console.log(
        `   Batch ${i + 1}/${batches.length}: Processed ${recordsProcessed.toLocaleString()} / ${nonZeroAllocations.length.toLocaleString()} records (${batch.length.toLocaleString()} in this batch)`,
      );
    }
  });

  console.log('✅ Allocations updated successfully');
}

/**
 * Floor all token allocations and redistribute the remainder to top users
 */
async function distributeRemainder(): Promise<void> {
  console.log('Distributing remainder tokens...');

  // Step 1: Floor all token allocations
  await models.sequelize.query(
    `
    UPDATE "ValidXpPerUser"
    SET token_allocation = FLOOR(token_allocation)
    `,
    { type: QueryTypes.UPDATE },
  );

  // Step 2: Calculate the total allocated
  const [{ total_allocated }] = await models.sequelize.query<{
    total_allocated: number;
  }>(
    `
    SELECT SUM(token_allocation) as total_allocated
    FROM "ValidXpPerUser"
    `,
    { type: QueryTypes.SELECT },
  );

  // Step 3: Calculate the remainder
  const remainder = TOTAL_SUPPLY - total_allocated;

  console.log(`Total supply: ${TOTAL_SUPPLY.toLocaleString()}`);
  console.log(`Total allocated: ${total_allocated.toLocaleString()}`);
  console.log(`Remainder to distribute: ${remainder.toLocaleString()}`);

  if (remainder <= 0) {
    if (remainder < 0) {
      console.warn(
        `Warning: Negative remainder detected: ${remainder}. This may indicate an allocation error.`,
      );
    } else {
      console.log('No remainder to distribute.');
    }
    return;
  }

  // Step 4: Distribute remainder to top users by percent_allocation, then by user_id
  const topUsers = await models.sequelize.query<{ user_id: number }>(
    `
    SELECT user_id
    FROM "ValidXpPerUser"
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
    UPDATE "ValidXpPerUser"
    SET token_allocation = token_allocation + 1
    WHERE user_id IN (:userIds)
    `,
    {
      replacements: { userIds: topUsers.map((u) => u.user_id) },
      type: QueryTypes.UPDATE,
    },
  );

  console.log(
    `✅ Distributed ${remainder.toLocaleString()} remainder tokens to top ${topUsers.length} users.`,
  );
}

/**
 * Verify the final allocations sum to the expected total
 */
async function verifyAllocations(): Promise<void> {
  const [result] = await models.sequelize.query<{
    total_allocated: number;
    user_count: number;
    min_allocation: number;
    max_allocation: number;
  }>(
    `
    SELECT 
      SUM(token_allocation) as total_allocated,
      COUNT(*) as user_count,
      MIN(token_allocation) as min_allocation,
      MAX(token_allocation) as max_allocation
    FROM "ValidXpPerUser"
    WHERE token_allocation > 0
    `,
    { type: QueryTypes.SELECT },
  );

  console.log('\n📊 Final Allocation Summary:');
  console.log(
    `   Total tokens allocated: ${result.total_allocated.toLocaleString()}`,
  );
  console.log(`   Expected total: ${TOTAL_SUPPLY.toLocaleString()}`);
  console.log(
    `   Users receiving tokens: ${result.user_count.toLocaleString()}`,
  );
  console.log(`   Min allocation: ${result.min_allocation.toLocaleString()}`);
  console.log(`   Max allocation: ${result.max_allocation.toLocaleString()}`);

  if (result.total_allocated !== TOTAL_SUPPLY) {
    throw new Error(
      `Total allocated (${result.total_allocated}) does not match expected supply (${TOTAL_SUPPLY})`,
    );
  }

  console.log('✅ Verification passed: Total allocation matches supply');
}

async function main() {
  try {
    console.log('Starting Aura Retro Drop Token Allocation...');
    console.log(`Total Supply: ${TOTAL_SUPPLY.toLocaleString()} tokens\n`);

    // Step 1: Calculate allocations
    console.log('Calculating token allocations based on weighted XP...');
    const allocations = await calculateTokenAllocations();
    console.log(`✅ Calculated allocations for ${allocations.length} users`);

    // Step 2: Update the table with calculated allocations
    await updateAllocations(allocations);

    // Step 3: Floor allocations and distribute remainder
    await distributeRemainder();

    // Step 4: Verify the final allocations
    await verifyAllocations();

    console.log('\n🎉 Aura Retro Drop allocation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
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
