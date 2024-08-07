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

const log = logger(import.meta);

const Errors = {
  CommunityNotFound: 'community not found',
};

// Since the import will create a new temp DB and
// add a new DB role, we need a way to reverse
// those operations, which is the purpose of
// the cleanup logic

type CleanupFn = {
  description: string;
  fn: () => Promise<void>;
};

const runCleanup = async (cleanupStack: CleanupFn[]) => {
  while (cleanupStack.length > 0) {
    const { description, fn } = cleanupStack.pop()!;
    try {
      log.debug(`RUNNING CLEANUP: ${description}`);
      await fn();
    } catch (err) {
      log.error('cleanup failed: ', err as Error);
    }
  }
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
          log.error('import stage failed: ', err as Error);
          await runCleanup(cleanupStack);
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
          log.debug(`Users: ${users.length}`);
          cleanupStack.push({
            description: 'Cleanup created users',
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
          log.debug(`Addresses: ${addresses.length}`);
          cleanupStack.push({
            description: 'Cleanup created addresses',
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
          log.debug(`Topics: ${topics.length}`);
          cleanupStack.push({
            description: 'Cleanup created topics',
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
              topics,
              communityId: communityId!,
            },
            { transaction: null },
          );
          log.debug(`Threads: ${threads.length}`);
          cleanupStack.push({
            description: 'Cleanup created threads',
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
          log.debug(`Comments: ${comments.length}`);
          cleanupStack.push({
            description: 'Cleanup created comments',
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
          log.debug(`Reactions: ${reactions.length}`);
          cleanupStack.push({
            description: 'Cleanup created reactions',
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
          log.debug(`Subscriptions: ${subscriptions.length}`);
          cleanupStack.push({
            description: 'Cleanup created subscriptions',
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

          throw new Error('BOOM');

          log.debug(`DISCOURSE IMPORT SUCCESSFUL ON ${communityId}`);
        } finally {
          // always cleanup
          await runCleanup(cleanupStack);
        }
      },
    },
  };
}
