import { schemas, type Command } from '@hicommonwealth/core';
import { URL } from 'url';
import { DATABASE_URI } from '../config';
import { createDiscourseDBConnection, models } from '../database';
import {
  createAllAddressesInCW,
  createAllCategoriesInCW,
  createAllCommentsInCW,
  createAllProfilesInCW,
  createAllReactionsInCW,
  createAllSubscriptionsInCW,
  createAllThreadsInCW,
  createAllUsersInCW,
} from '../services/discourseImport';

export const ImportDiscourseCommunity: Command<
  typeof schemas.commands.ImportDiscourseCommunity
> = () => ({
  ...schemas.commands.ImportDiscourseCommunity,
  auth: [
    /* TODO: isSuperAdmin() */
  ],
  body: async ({ id, payload }) => {
    const { communityId, base, accountsClaimable, dumpData } = payload;
    const cwConnection = models.sequelize;

    // TODO: sanitize dump data?

    // create temp discourse DB
    const discourseDbName = `temp_discourse_dump_${Date.now()}`;
    await cwConnection.query(`CREATE DATABASE ${discourseDbName}`);

    // TODO: create discourse DB user with restricted permissions for DB import?

    // copy and modify CW DB URI to create discourse DB URI
    const discourseDbUri = (() => {
      const parsedUrl = new URL(DATABASE_URI);
      parsedUrl.pathname = discourseDbName;
      return parsedUrl.toString();
    })();

    // connect to discourse DB
    const discourseConnection = await createDiscourseDBConnection(
      discourseDbUri,
    );

    // import dump into discourse DB
    await discourseConnection.query(dumpData);

    const tables: Record<string, any> = {};
    const transaction = await models.sequelize.transaction();
    try {
      // TODO: use accountsClaimable flag

      // insert users
      const { newUsers, existingUsers } = await createAllUsersInCW(
        discourseConnection,
        cwConnection,
        { communityId },
        { transaction },
      );
      tables['users'] = newUsers;
      console.log('Users:', newUsers.length);

      // insert profiles
      const profiles = await createAllProfilesInCW(
        cwConnection,
        discourseConnection,
        { newUsers },
        { transaction },
      );
      tables['profiles'] = profiles;
      console.log('Profiles:', profiles.length);

      // insert addresses
      const addresses = await createAllAddressesInCW(
        discourseConnection,
        cwConnection,
        {
          users: newUsers.concat(...existingUsers),
          profiles,
          communityId,
          base,
        },
        { transaction },
      );
      tables['addresses'] = addresses;
      console.log('Addresses:', addresses.length);

      // insert categories (topics)
      const categories = await createAllCategoriesInCW(
        discourseConnection,
        cwConnection,
        { communityId },
        { transaction },
      );
      tables['categories'] = categories;
      console.log('Categories:', categories.length);

      // insert topics (threads)
      const threads = await createAllThreadsInCW(
        discourseConnection,
        cwConnection,
        { users: newUsers.concat(existingUsers), categories, communityId },
        { transaction },
      );
      tables['threads'] = threads;
      console.log('Threads:', threads.length);

      // insert posts (comments)
      const comments = await createAllCommentsInCW(
        discourseConnection,
        cwConnection,
        { communityId, addresses, threads },
        { transaction },
      );
      tables['comments'] = comments;
      console.log('Comments:', comments.length);

      // insert reactions
      const reactions = await createAllReactionsInCW(
        discourseConnection,
        cwConnection,
        { addresses, communityId, threads, comments },
        { transaction },
      );
      tables['reactions'] = reactions;
      console.log('Reactions:', reactions.length);

      // insert subscriptions
      const subscriptions = await createAllSubscriptionsInCW(
        discourseConnection,
        cwConnection,
        { communityId, users: newUsers.concat(existingUsers), threads },
        { transaction },
      );
      tables['subscriptions'] = subscriptions;
      console.log('Subscriptions:', subscriptions.length);

      await transaction.commit();
      return {};
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
});
