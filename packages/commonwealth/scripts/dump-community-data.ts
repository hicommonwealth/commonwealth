/* eslint-disable no-warning-comments, no-case-declarations, n/no-process-exit, max-len */

import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { exec } from 'child_process';
import * as csvWriter from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { Op } from 'sequelize';
import { promisify } from 'util';

interface DumpConfig {
  communityId: string;
  outputDir: string;
  zipFile: string;
}

function parseArguments(): DumpConfig {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (args.length !== 1) {
    throw new Error('Community ID is required as the only argument');
  }

  const communityId = args[0];
  const timestamp = new Date()
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+/, '');
  const outputDir = `${communityId}-dump`;
  const zipFile = `${communityId}-dump-${timestamp}.tar.gz`;

  return {
    communityId,
    outputDir,
    zipFile,
  };
}

function printUsage(): void {
  console.log(`
Usage: pnpm ts-exec dump-community-data.ts <community_id>

Arguments:
  community_id              The ID of the community to dump data for

Examples:
  pnpm ts-exec scripts/dump-community-data.ts ethereum
  pnpm ts-exec scripts/dump-community-data.ts my-community

This script will:
1. Validate the community_id exists in the Communities table
2. Export data from Threads, Comments, Polls, Votes, Reactions, Users, Topics, and Addresses tables
3. Create CSV files for each table in a folder named "[community_id]-dump"
4. Compress the folder into a tar.gz archive for easy download
`);
}

async function validateCommunity(communityId: string): Promise<void> {
  const community = await models.Community.findByPk(communityId);
  if (!community) {
    throw new Error(`Community with ID '${communityId}' not found`);
  }
  console.log(`✓ Community found: ${community.name}`);
}

async function createOutputDirectory(outputDir: string): Promise<void> {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✓ Created output directory: ${outputDir}`);
}

async function writeDataToCSV<T extends Record<string, unknown>>(
  data: Array<T>,
  filePath: string,
  tableName: string,
): Promise<void> {
  if (!data.length) {
    console.warn(`⚠ No data found for ${tableName}`);
    // Create empty CSV with just headers
    fs.writeFileSync(filePath, '', 'utf8');
    return;
  }

  // Get headers from the first object, excluding Sequelize metadata
  const firstItem = data[0];
  const headers = Object.keys(firstItem).filter(
    (key) =>
      !key.startsWith('_') &&
      typeof firstItem[key] !== 'function' &&
      key !== 'dataValues',
  );

  // Create CSV writer configuration
  const writer = csvWriter.createObjectCsvWriter({
    path: filePath,
    header: headers.map((header) => ({
      id: header,
      title: header,
    })),
  });

  // Process data to handle JSON objects and ensure proper serialization
  const processedData = data.map((item) => {
    const processedItem: Record<string, any> = {};
    headers.forEach((header) => {
      const value = item[header];
      if (value === null || value === undefined) {
        processedItem[header] = '';
      } else if (typeof value === 'object') {
        // Convert objects to JSON strings
        processedItem[header] = JSON.stringify(value);
      } else {
        processedItem[header] = value;
      }
    });
    return processedItem;
  });

  await writer.writeRecords(processedData);
  console.log(
    `✓ Exported ${data.length} records to ${path.basename(filePath)}`,
  );
}

async function exportThreads(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting threads...');
  const threads = await models.Thread.findAll({
    attributes: [
      'id',
      'address_id',
      'title',
      'body',
      'created_at',
      'updated_at',
      'deleted_at',
      'pinned',
      'url',
      'read_only',
      'topic_id',
      'stage',
      'has_poll',
      'last_commented_on',
      'links',
      'last_edited',
      'locked_at',
      'created_by',
      'marked_as_spam_at',
      'archived_at',
      'comment_count',
      'reaction_count',
      'view_count',
      'content_url',
    ],
    where: { community_id: communityId },
    raw: true,
    paranoid: false,
  });

  const filePath = path.join(outputDir, 'Threads.csv');
  await writeDataToCSV(threads as any[], filePath, 'Threads');
}

async function exportComments(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting comments...');

  // First get all thread IDs in the community
  const threadIds = await models.Thread.findAll({
    where: { community_id: communityId },
    attributes: ['id'],
    raw: true,
  });

  const threadIdArray = threadIds
    .map((t) => t.id)
    .filter((id): id is number => id !== undefined);

  if (threadIdArray.length === 0) {
    console.warn('⚠ No threads found, skipping comments export');
    await writeDataToCSV([], path.join(outputDir, 'Comments.csv'), 'Comments');
    return;
  }

  const comments = await models.Comment.findAll({
    attributes: [
      'id',
      'parent_id',
      'address_id',
      'body',
      'created_at',
      'updated_at',
      'deleted_at',
      'thread_id',
      'created_by',
      'marked_as_spam_at',
      'reaction_count',
      'content_url',
      'comment_level',
      'reply_count',
    ],
    where: {
      thread_id: {
        [Op.in]: threadIdArray,
      },
    },
    raw: true,
    paranoid: false,
  });

  const filePath = path.join(outputDir, 'Comments.csv');
  await writeDataToCSV(comments as any[], filePath, 'Comments');
}

async function exportPolls(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting polls...');
  const polls = await models.Poll.findAll({
    attributes: [
      'id',
      'thread_id',
      'prompt',
      'ends_at',
      'created_at',
      'updated_at',
      'options',
      'allow_revotes',
    ],
    where: { community_id: communityId },
    raw: true,
  });

  const filePath = path.join(outputDir, 'Polls.csv');
  await writeDataToCSV(polls as any[], filePath, 'Polls');
}

async function exportVotes(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting votes...');
  const votes = await models.Vote.findAll({
    attributes: [
      'id',
      'option',
      'address',
      'created_at',
      'updated_at',
      'poll_id',
      'user_id',
    ],
    where: { community_id: communityId },
    raw: true,
  });

  const filePath = path.join(outputDir, 'Votes.csv');
  await writeDataToCSV(votes as any[], filePath, 'Poll Votes');
}

async function exportReactions(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting reactions...');

  // Get thread IDs in the community
  const threadIds = await models.Thread.findAll({
    attributes: ['id'],
    where: { community_id: communityId },
    raw: true,
  });

  const threadIdArray = threadIds
    .map((t) => t.id)
    .filter((id): id is number => id !== undefined);

  // Get comment IDs for threads in the community
  const commentIds =
    threadIdArray.length > 0
      ? await models.Comment.findAll({
          where: {
            thread_id: {
              [Op.in]: threadIdArray,
            },
          },
          attributes: ['id'],
          raw: true,
        })
      : [];

  const commentIdArray = commentIds
    .map((c) => c.id)
    .filter((id): id is number => id !== undefined);

  // Get reactions for threads and comments in the community
  const whereConditions: any[] = [];
  if (threadIdArray.length > 0) {
    whereConditions.push({ thread_id: { [Op.in]: threadIdArray } });
  }
  if (commentIdArray.length > 0) {
    whereConditions.push({ comment_id: { [Op.in]: commentIdArray } });
  }

  if (whereConditions.length === 0) {
    console.warn('⚠ No threads or comments found, skipping reactions export');
    await writeDataToCSV(
      [],
      path.join(outputDir, 'Reactions.csv'),
      'Reactions',
    );
    return;
  }

  const reactions = await models.Reaction.findAll({
    attributes: [
      'id',
      'address_id',
      'reaction',
      'created_at',
      'updated_at',
      'thread_id',
      'comment_id',
      'proposal_id',
    ],
    where: {
      [Op.or]: whereConditions,
    },
    raw: true,
  });

  const filePath = path.join(outputDir, 'Reactions.csv');
  await writeDataToCSV(reactions as any[], filePath, 'Reactions');
}

async function exportUsers(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting users...');

  // Get user IDs through addresses in the community
  const addresses = await models.Address.findAll({
    where: { community_id: communityId },
    attributes: ['user_id'],
    raw: true,
  });

  const userIds = [
    ...new Set(
      addresses
        .map((a) => a.user_id)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];

  if (userIds.length === 0) {
    console.warn('⚠ No users found in community, skipping users export');
    await writeDataToCSV([], path.join(outputDir, 'Users.csv'), 'Users');
    return;
  }

  const users = await models.User.findAll({
    attributes: [
      'id',
      'email',
      'created_at',
      'updated_at',
      'isAdmin',
      'emailVerified',
      'profile',
    ],
    where: {
      id: {
        [Op.in]: userIds,
      },
    },
    raw: true,
  });

  const filePath = path.join(outputDir, 'Users.csv');
  await writeDataToCSV(users as any[], filePath, 'Users');
}

async function exportTopics(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting topics...');
  const topics = await models.Topic.findAll({
    attributes: [
      'id',
      'name',
      'created_at',
      'updated_at',
      'deleted_at',
      'description',
      'archived_at',
    ],
    where: { community_id: communityId },
    raw: true,
    paranoid: false,
  });

  const filePath = path.join(outputDir, 'Topics.csv');
  await writeDataToCSV(topics as any[], filePath, 'Topics');
}

async function exportAddresses(
  communityId: string,
  outputDir: string,
): Promise<void> {
  console.log('Exporting addresses...');
  const addresses = await models.Address.findAll({
    attributes: [
      'id',
      'address',
      'created_at',
      'updated_at',
      'user_id',
      'verified',
      'last_active',
      'wallet_id',
      'role',
      'is_banned',
      'oauth_provider',
      'oauth_email',
      'oauth_email_verified',
      'oauth_username',
      'oauth_phone_number',
      'oauth_user_id',
    ],
    where: { community_id: communityId },
    raw: true,
  });

  const filePath = path.join(outputDir, 'Addresses.csv');
  await writeDataToCSV(addresses as any[], filePath, 'Addresses');
}

async function createZipFile(
  outputDir: string,
  zipFile: string,
): Promise<void> {
  console.log(`Creating archive: ${zipFile}`);

  try {
    const execAsync = promisify(exec);

    // Create a tar.gz file for better cross-platform support
    const tarFile = zipFile.replace('.zip', '.tar.gz');
    const command = `tar -czf "${tarFile}" -C "${path.dirname(outputDir)}" "${path.basename(outputDir)}"`;

    await execAsync(command);

    const stats = fs.statSync(tarFile);
    console.log(`✓ Archive created: ${tarFile} (${stats.size} bytes)`);
  } catch (error) {
    console.warn(
      'Failed to create compressed archive with tar command. Files are available in directory:',
      outputDir,
    );
    console.log(`✓ Files exported to directory: ${outputDir}`);
    console.log('Note: You can manually compress the directory if needed.');
  }
}

async function cleanupDirectory(outputDir: string): Promise<void> {
  fs.rmSync(outputDir, { recursive: true, force: true });
  console.log(`✓ Cleaned up directory: ${outputDir}`);
}

async function main() {
  try {
    const config = parseArguments();

    console.log(`Community Data Dump Configuration:`);
    console.log(`  Community ID: ${config.communityId}`);
    console.log(`  Output Directory: ${config.outputDir}`);
    console.log(`  ZIP File: ${config.zipFile}`);
    console.log('');

    // Validate community exists
    await validateCommunity(config.communityId);

    // Create output directory
    await createOutputDirectory(config.outputDir);

    // Export all tables
    await exportThreads(config.communityId, config.outputDir);
    await exportComments(config.communityId, config.outputDir);
    await exportPolls(config.communityId, config.outputDir);
    await exportVotes(config.communityId, config.outputDir);
    await exportReactions(config.communityId, config.outputDir);
    await exportUsers(config.communityId, config.outputDir);
    await exportTopics(config.communityId, config.outputDir);
    await exportAddresses(config.communityId, config.outputDir);

    // Create archive file
    await createZipFile(config.outputDir, config.zipFile);

    // Clean up directory only if archive was created successfully
    const archiveFile = config.zipFile.replace('.zip', '.tar.gz');
    // if (fs.existsSync(archiveFile)) {
    //   await cleanupDirectory(config.outputDir);
    // } else {
    //   console.log(`Directory preserved: ${config.outputDir}`);
    // }

    console.log('');
    console.log(`✓ Community data dump completed successfully!`);
    if (fs.existsSync(archiveFile)) {
      console.log(`✓ Archive file ready: ${archiveFile}`);
    } else {
      console.log(`✓ Files available in directory: ${config.outputDir}`);
    }

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
