import { AppError, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Mutex } from 'async-mutex';
import { Sequelize } from 'sequelize';
import { URL, fileURLToPath } from 'url';
import { z } from 'zod';
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
} from '../services/discourseImport';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const Errors = {
  CommunityNotFound: 'community not found',
};

const mutex = new Mutex();

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

export function ImportDiscourseCommunity(): Command<
  typeof schemas.ImportDiscourseCommunity
> {
  return {
    ...schemas.ImportDiscourseCommunity,
    secure: false, // TODO: remove this
    auth: [], // TODO: add super admin middleware
    body: async ({ id: communityId, payload }) => {
      // prevent concurrent imports
      if (mutex.isLocked()) {
        throw new AppError(`import in progress, try again later`);
      }
      const unlock = await mutex.acquire();
      try {
        await performImport(communityId!, payload);
      } finally {
        unlock();
      }
    },
  };
}

const performImport = async (
  communityId: string,
  payload: z.infer<typeof schemas.ImportDiscourseCommunity['input']>,
) => {
  // TODO: implement accountsClaimable

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
        await models.sequelize.query(`DROP ROLE ${restrictedDiscourseDbUser};`);
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
    // grant privileges to restricted user
    const superUserDiscourseDbUri = (() => {
      const parsedUrl = new URL(config.DB.URI);
      parsedUrl.pathname = discourseDbName;
      if (config.DB.NO_SSL) {
        parsedUrl.searchParams.set('sslmode', 'disable');
      }
      return parsedUrl.toString();
    })();
    const superUserDiscourseConnection = await createDiscourseDBConnection(
      superUserDiscourseDbUri,
    );
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

  const transaction = await models.sequelize.transaction();
  try {
    // TODO: use accountsClaimable flag

    // insert users
    const { users, admins, moderators } = await createAllUsersInCW(
      restrictedDiscourseConnection,
      { transaction },
    );
    log.debug(`Users: ${users.length}`);

    // insert addresses
    const addresses = await createAllAddressesInCW(
      {
        users,
        admins,
        moderators,
        communityId: communityId!,
        base,
      },
      { transaction },
    );
    log.debug(`Addresses: ${addresses.length}`);

    // insert topics (discourse categories)
    const topics = await createAllTopicsInCW(
      restrictedDiscourseConnection,
      { communityId: communityId! },
      { transaction },
    );
    log.debug(`Topics: ${topics.length}`);

    // insert threads (discourse topics)
    const threads = await createAllThreadsInCW(
      restrictedDiscourseConnection,
      {
        users,
        topics,
        communityId: communityId!,
      },
      { transaction },
    );
    log.debug(`Threads: ${threads.length}`);

    // insert comments (discourse posts)
    const comments = await createAllCommentsInCW(
      restrictedDiscourseConnection,
      {
        communityId: communityId!,
        addresses,
        threads,
      },
      { transaction },
    );
    log.debug(`Comments: ${comments.length}`);

    // insert reactions
    const reactions = await createAllReactionsInCW(
      restrictedDiscourseConnection,
      {
        addresses,
        communityId: communityId!,
        threads,
        comments,
      },
      { transaction },
    );
    log.debug(`Reactions: ${reactions.length}`);

    // // insert subscriptions
    const subscriptions = await createAllSubscriptionsInCW(
      restrictedDiscourseConnection,
      {
        communityId: communityId!,
        users,
        threads,
      },
      { transaction },
    );
    log.debug(`Subscriptions: ${subscriptions.length}`);

    await transaction.commit();

    log.debug(`DISCOURSE IMPORT SUCCESSFUL ON ${communityId}`);
  } catch (err) {
    await transaction.rollback();
    throw err;
  } finally {
    // always cleanup
    await runCleanup(cleanupStack);
  }
};
