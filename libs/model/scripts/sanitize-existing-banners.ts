/*
  Sanitizes all existing community banners to remove potentially dangerous HTML.
  This is a one-time migration script to apply banner sanitization to existing data.

  Usage:
    pnpm sanitize-banners           # Run the sanitization
    pnpm sanitize-banners --dry-run # Preview changes without applying them
*/
import { config, logger } from '@hicommonwealth/core';
import { exit } from 'process';
import { Op } from 'sequelize';
import { models } from '../src/database';
import { sanitizeBannerText } from '../src/utils';

const log = logger(import.meta);

async function sanitizeExistingBanners() {
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    log.info('Running in DRY RUN mode - no changes will be made');
  }

  if (config.APP_ENV === 'production' && !isDryRun) {
    log.warn(
      'Running in production - please ensure you have tested this script in a non-production environment first.',
    );
  }

  // Find all communities with non-empty banner text
  const communitiesWithBanners = await models.Community.findAll({
    where: {
      banner_text: {
        [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
      },
    },
    attributes: ['id', 'banner_text'],
  });

  log.info(
    `Found ${communitiesWithBanners.length} communities with banner text`,
  );

  let updatedCount = 0;
  let skippedCount = 0;

  for (const community of communitiesWithBanners) {
    const originalBanner = community.banner_text || '';
    const sanitizedBanner = sanitizeBannerText(originalBanner);

    // Only update if the sanitization changed something
    if (originalBanner !== sanitizedBanner) {
      if (!isDryRun) {
        await community.update({ banner_text: sanitizedBanner });
      }
      log.info(
        `${isDryRun ? '[DRY RUN] Would update' : 'Updated'} community "${community.id}":`,
      );
      log.info(`  Original: ${originalBanner.substring(0, 100)}...`);
      log.info(`  Sanitized: ${sanitizedBanner.substring(0, 100)}...`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  log.info(`\nSanitization complete:`);
  log.info(
    `  - ${isDryRun ? 'Would update' : 'Updated'}: ${updatedCount} communities`,
  );
  log.info(`  - Skipped (no changes needed): ${skippedCount} communities`);

  exit(0);
}

sanitizeExistingBanners().catch((err) => {
  console.error('Error sanitizing banners:', err);
  exit(1);
});
