import { models } from '@hicommonwealth/model';
import { Address, User } from '@hicommonwealth/schemas';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';

type DiscourseUser = {
  id: number;
  username: string;
  name: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  admin: any;
  approved: boolean;
  moderator: boolean;
  uploaded_avatar_id: any;
  email: string;
};

class DiscourseQueries {
  static fetchUsers = async (session: Sequelize): Promise<DiscourseUser[]> => {
    return session.query<DiscourseUser>(
      `
        SELECT users.id, username, name, users.created_at, users.updated_at,
        name, active, admin, approved, moderator, uploaded_avatar_id, ue.email
        FROM public.users
        inner join user_emails ue on users.id = ue.user_id
        and email != 'no_email'
        and email != 'discobot_email'
        and ue.primary = true
      `,
      { type: QueryTypes.SELECT },
    );
  };
}

type UserIdEmail = Required<Pick<z.infer<typeof User>, 'id' | 'email'>>;

class CWQueries {
  static fetchImportedUserIdsByCommunity = async ({
    communityId,
  }: {
    communityId: string;
  }): Promise<Array<UserIdEmail>> => {
    return models.sequelize.query<UserIdEmail>(
      `
      SELECT users.id, email
      FROM "Addresses"
      INNER JOIN "Users" users on users.id = user_id
      where ghost_address = true and community_id = '${communityId}';
    `,
      { type: QueryTypes.SELECT },
    );
  };

  static fetchAddressesByUsers = async ({
    userIds,
    communityId,
  }: {
    userIds: number[];
    communityId: string;
  }): Promise<Array<z.infer<typeof Address>>> => {
    return models.Address.findAll({
      where: {
        community_id: communityId,
        user_id: {
          [Op.in]: userIds,
        },
      },
    });
  };

  static fetchUsersByEmail = async (
    emails: string[],
  ): Promise<Array<z.infer<typeof User>>> => {
    return models.User.findAll({
      where: {
        email: {
          [Op.in]: emails,
        },
      },
    });
  };

  static createUser = async (
    {
      email,
      isAdmin,
      isModerator,
      username,
      name,
    }: {
      email: string;
      isAdmin: boolean;
      isModerator: boolean;
      username: string;
      name: string;
    },
    { transaction }: { transaction: Transaction },
  ) => {
    const [user] = await models.sequelize.query<{ id: number; email: string }>(
      `
       INSERT INTO "Users"(
       id, email, created_at, updated_at, "selected_community_id", "isAdmin", "disableRichText",
       "emailVerified", "emailNotificationInterval")
       VALUES (default, '${email}', NOW(), NOW(), null, false, false, false, 'never')
       RETURNING id, email;
    `,
      {
        type: QueryTypes.SELECT,
        transaction,
      },
    );
    return { user, isAdmin, isModerator, username, name };
  };
}

export const createAllUsersInCW = async (
  discourseConnection: Sequelize,
  { communityId }: { communityId: string },
  { transaction }: { transaction: Transaction },
): Promise<{
  newUsers: Array<z.infer<typeof User>>;
  existingUsers: Array<z.infer<typeof User>>;
}> => {
  // fetch users in discourse
  const discourseUsers = await DiscourseQueries.fetchUsers(discourseConnection);
  const emails = discourseUsers.map(({ email }) => `'${email}'`);

  // fetch users that already have an address
  const userWithAddresses = await CWQueries.fetchAddressesByUsers({
    userIds: discourseUsers.map(({ id }) => id),
    communityId,
  });

  //  fetch users in cw
  const cwUsers = await CWQueries.fetchUsersByEmail(emails);
  const usersAlreadyExistingInCW = cwUsers
    .map(({ id, email, emailVerified }) => {
      const discourseUser = discourseUsers.find(
        (discourseUser) => email === discourseUser.email,
      );
      if (!discourseUser) {
        throw new Error(`Failed to find discourse user by email: ${email}`);
      }
      const {
        id: discourseUserId,
        admin,
        username,
        name,
        moderator,
      } = discourseUser;
      return {
        discourseUserId,
        id,
        email,
        isAdmin: admin,
        isModerator: moderator,
        username,
        name,
        emailVerified,
      };
    })
    .filter((user) => {
      // this filters out any users that already have addresses in the community (already members)
      for (const userWithAddress of userWithAddresses) {
        if (userWithAddress.user_id === user.id) {
          return false;
        }
      }
      return true;
    });

  // insert users
  const usersToCreate = discourseUsers.filter(
    (user) =>
      !usersAlreadyExistingInCW.some(({ email }) => user.email === email),
  );

  // create all new users
  const userIds = await Promise.all(
    usersToCreate.map(({ email, admin, username, name, moderator }) =>
      CWQueries.createUser(
        { email, isAdmin: admin, isModerator: moderator, username, name },
        { transaction },
      ),
    ),
  );
  const result = userIds.map(
    ({ user, isAdmin, isModerator, username, name }): z.infer<typeof User> => {
      const discourseUser = discourseUsers.find(
        ({ email }) => email === user.email,
      );
      if (!discourseUser) {
        throw new Error(
          `Failed to find discourse user by email: ${user.email}`,
        );
      }
      return {
        // discourseUserId: discourseUser.id,
        id: user.id,
        email: user.email,
        isAdmin,
        // isModerator,
        // username,
        // name,
        // alreadyHasAccountInCW: false,
        emailVerified: false,
      };
    },
  );

  // new users are users that we created as part of the import
  // existing users are users that have already user their email to
  // sign in to commonwealth so they already have profiles but they don't
  // have addresses that puts them in the community
  return {
    newUsers: result,
    existingUsers: usersAlreadyExistingInCW,
  };
};
