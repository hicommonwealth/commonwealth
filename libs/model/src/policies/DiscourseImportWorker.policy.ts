import { AppError, events, logger, Policy } from '@hicommonwealth/core';
import { Op, Sequelize } from 'sequelize';
import { config } from '../config';
import { createDiscourseDBConnection, models } from '../database';
import {
  createAllAddressesInCW,
  createAllCommentsInCW,
  createAllReactionsInCW,
  createAllSubscriptionsInCW,
  createAllThreadsInCW,
  createAllTopicsInCW,
  createAllUsersInCW,
  importDump,
} from '../services';
import { CleanupFn, runCleanup } from '../utils';

const log = logger(import.meta);

const Errors = {
  CommunityNotFound: 'community not found',
};

const inputs = {
  DiscourseImportSubmitted: events.DiscourseImportSubmitted,
};

export function DiscourseImportWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      DiscourseImportSubmitted: async ({ payload }) => {
        const { id: communityId } = payload;

        const community = await models.Community.findByPk(communityId);
        if (!community) {
          throw new AppError(Errors.CommunityNotFound);
        }
        const { base, dumpUrl } = payload;

        // cleanup functions are pushed to this array, then popped off
        // and invoked after everything is done
        const cleanupStack: CleanupFn[] = [];

        let restrictedDiscourseConnection: Sequelize | null = null;

        try {
          const now = Date.now();

          const discourseDbName = `temp_discourse_dump_${now}`;
          const restrictedDiscourseDbUser = `temp_discourse_importer_${now}`;
          const restrictedDiscourseDbPass = `temp_discourse_importer_pass_${now}`;

          // create discourse DB user
          await models.sequelize.query(
            `CREATE ROLE ${restrictedDiscourseDbUser} WITH LOGIN PASSWORD '${restrictedDiscourseDbPass}';`,
          );
          cleanupStack.push({
            description: 'Drop discourse DB user',
            fn: async () => {
              await models.sequelize.query(
                `DROP ROLE ${restrictedDiscourseDbUser};`,
              );
            },
          });

          // create discourse DB
          await models.sequelize.query(`CREATE DATABASE ${discourseDbName};`);
          cleanupStack.push({
            description: 'Drop discourse DB',
            fn: async () => {
              await models.sequelize.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${discourseDbName}' AND pid <> pg_backend_pid();
          `);
              await models.sequelize.query(`DROP DATABASE ${discourseDbName};`);
            },
          });

          // connect to discourse DB as superuser to
          // grant privileges to restricted discourse user
          const superUserDiscourseDbUri = (() => {
            const parsedUrl = new URL(config.DB.URI);
            parsedUrl.pathname = discourseDbName;
            if (config.DB.NO_SSL) {
              parsedUrl.searchParams.set('sslmode', 'disable');
            }
            return parsedUrl.toString();
          })();
          const superUserDiscourseConnection =
            await createDiscourseDBConnection(superUserDiscourseDbUri);
          await superUserDiscourseConnection.query(
            `GRANT ALL ON SCHEMA public TO ${restrictedDiscourseDbUser};`,
          );
          cleanupStack.push({
            description:
              'Disconnect super user from temp discourse DB so it can be dropped',
            fn: async () => {
              await superUserDiscourseConnection.close();
            },
          });

          // create restricted discourse DB URI
          const restrictedDiscourseDbUri = (() => {
            const parsedUrl = new URL(config.DB.URI);
            const host = parsedUrl.host;
            const port = parsedUrl.port || 5432;
            let uri = `postgresql://${restrictedDiscourseDbUser}:${restrictedDiscourseDbPass}@${host}:${port}/${discourseDbName}`;
            if (config.DB.NO_SSL) {
              uri += '?sslmode=disable';
            }
            return uri;
          })();

          // connect to discourse DB
          restrictedDiscourseConnection = await createDiscourseDBConnection(
            restrictedDiscourseDbUri,
          );
          cleanupStack.push({
            description:
              'Disconnect restricted user from temporary discourse DB so it can be dropped',
            fn: async () => {
              await restrictedDiscourseConnection?.close();
            },
          });

          // import dump
          await importDump(dumpUrl, restrictedDiscourseDbUri);
        } catch (err) {
          // on error, cleanup and throw
          log.error('INITIAL IMPORT PHASE FAILED: ', err as Error);
          await runCleanup(err, cleanupStack);
          throw err;
        }

        // sanity check
        if (!restrictedDiscourseConnection) {
          throw new Error('failed to connect to discourse DB');
        }

        try {
          // TODO: use accountsClaimable flag

          // insert users
          const { users, admins, moderators } = await createAllUsersInCW(
            restrictedDiscourseConnection,
            { transaction: null },
          );
          const numUsersCreated = users.filter((u) => u.created).length;
          const numUsersFound = users.filter((u) => !u.created).length;
          log.debug(
            `Users: ${numUsersCreated} created, ${numUsersFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created users (${numUsersCreated})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.User.destroy({
                where: {
                  id: {
                    [Op.in]: users
                      .filter((u) => u.id && u.created)
                      .map((u) => u.id!),
                  },
                },
              });
            },
          });

          // insert addresses
          const addresses = await createAllAddressesInCW(
            {
              users,
              admins,
              moderators,
              communityId: communityId!,
              base,
            },
            { transaction: null },
          );
          const numAddressesCreated = addresses.filter((a) => a.created).length;
          const numAddressesFound = addresses.filter((a) => !a.created).length;
          log.debug(
            `Addresses: ${numAddressesCreated} created, ${numAddressesFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created addresses (${numAddressesCreated})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.Address.destroy({
                where: {
                  id: {
                    [Op.in]: addresses
                      .filter((a) => a.id && a.created)
                      .map((a) => a.id!),
                  },
                },
              });
            },
          });

          // insert topics (discourse categories)
          const topics = await createAllTopicsInCW(
            restrictedDiscourseConnection,
            { communityId: communityId! },
            { transaction: null },
          );
          const numTopicsCreated = topics.filter((t) => t.created).length;
          const numTopicsFound = topics.filter((t) => !t.created).length;
          log.debug(
            `Topics: ${numTopicsCreated} created, ${numTopicsFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created topics (${numTopicsCreated})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.Topic.destroy({
                where: {
                  id: {
                    [Op.in]: topics
                      .filter((t) => t.id && t.created)
                      .map((t) => t.id!),
                  },
                },
              });
            },
          });

          // insert threads (discourse topics)
          const threads = await createAllThreadsInCW(
            restrictedDiscourseConnection,
            {
              users,
              addresses,
              topics,
              communityId: communityId!,
            },
            { transaction: null },
          );
          const numThreadsCreated = threads.filter((t) => t.created).length;
          const numThreadsFound = threads.filter((t) => !t.created).length;
          log.debug(
            `Threads: ${numThreadsCreated} created, ${numThreadsFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created threads (${numThreadsCreated})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.Thread.destroy({
                where: {
                  id: {
                    [Op.in]: threads
                      .filter((t) => t.id && t.created)
                      .map((t) => t.id!),
                  },
                },
              });
            },
          });

          // insert comments (discourse posts)
          const comments = await createAllCommentsInCW(
            restrictedDiscourseConnection,
            {
              communityId: communityId!,
              addresses,
              threads,
            },
            { transaction: null },
          );
          const numCommentsCreated = comments.filter((c) => c.created).length;
          const numCommentsFound = comments.filter((c) => !c.created).length;
          log.debug(
            `Comments: ${numCommentsCreated} created, ${numCommentsFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created comments (${numCommentsCreated})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.Comment.destroy({
                where: {
                  id: {
                    [Op.in]: comments
                      .filter((c) => c.id && c.created)
                      .map((c) => c.id!),
                  },
                },
              });
            },
          });

          // insert reactions
          const reactions = await createAllReactionsInCW(
            restrictedDiscourseConnection,
            {
              addresses,
              communityId: communityId!,
              threads,
              comments,
            },
            { transaction: null },
          );
          const numReactionsCreated = reactions.filter((r) => r.created).length;
          const numReactionsFound = reactions.filter((r) => !r.created).length;
          log.debug(
            `Reactions: ${numReactionsCreated} created, ${numReactionsFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created reactions (${numReactionsCreated})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.Reaction.destroy({
                where: {
                  id: {
                    [Op.in]: reactions
                      .filter((r) => r.id && r.created)
                      .map((r) => r.id!),
                  },
                },
              });
            },
          });

          // insert subscriptions
          const subscriptions = await createAllSubscriptionsInCW(
            restrictedDiscourseConnection,
            {
              communityId: communityId!,
              users,
              threads,
            },
            { transaction: null },
          );
          const numSubscriptionsCreated = reactions.filter(
            (r) => r.created,
          ).length;
          const numSubscriptionsFound = reactions.filter(
            (r) => !r.created,
          ).length;
          log.debug(
            `Subscriptions: ${numSubscriptionsCreated} created, ${numSubscriptionsFound} found`,
          );
          cleanupStack.push({
            description: `Cleanup created subscriptions (${subscriptions.length})`,
            runOnErrorOnly: true,
            fn: async () => {
              await models.Subscription.destroy({
                where: {
                  id: {
                    [Op.in]: subscriptions
                      .filter((s) => s.id && s.created)
                      .map((s) => s.id!),
                  },
                },
              });
            },
          });

          // throw new Error('BOOM');

          log.debug(`DISCOURSE IMPORT SUCCESSFUL ON ${communityId}`);
        } catch (err) {
          log.error('DISCOURSE IMPORT FAILED: ', err as Error);
          // run cleanup with error and throw
          await runCleanup(err, cleanupStack);
          throw err;
        }
        // on success, run cleanup without error
        await runCleanup(null, cleanupStack);
      },
    },
  };
}
