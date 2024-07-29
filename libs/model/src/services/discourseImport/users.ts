import { models } from '@hicommonwealth/model';
import { User } from '@hicommonwealth/schemas';
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

type DiscourseWebsiteBio = {
  discourse_user_id: number;
  website: string;
  bio_raw: string;
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

  static fetchBiosFromDiscourse = async (
    session: Sequelize,
  ): Promise<DiscourseWebsiteBio[]> => {
    return session.query<DiscourseWebsiteBio>(
      `
        SELECT
          user_id as discourse_user_id,
          website,
          bio_raw
        FROM "user_profiles";
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

  static fetchUsersByEmail = async (
    communityId: string,
    emails: string[],
  ): Promise<Array<z.infer<typeof User>>> => {
    return models.User.findAll({
      where: {
        email: {
          [Op.in]: emails,
        },
      },
      include: [
        {
          model: models.Address,
          where: {
            community_id: communityId,
          },
        },
      ],
    });
  };

  static createCWUserFromDiscourseUser = async (
    discourseUser: DiscourseUser,
    discourseBio: DiscourseWebsiteBio | null,
    { transaction }: { transaction: Transaction },
  ) => {
    const [user] = await models.sequelize.query<UserIdEmail>(
      `
      INSERT INTO "Users"(
          id,
          email,
          created_at,
          updated_at,
          "selected_community_id",
          "isAdmin",
          "disableRichText",
          "emailVerified",
          "emailNotificationInterval",
          profile
      )
      VALUES (
          default,
          :email,
          NOW(),
          NOW(),
          null,
          false,
          false,
          false,
          'never',
          jsonb_build_object(
            'username', :username,
            'bio', :bio,
            'website', :website
          )
      )
      RETURNING id, email;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          email: discourseUser.email,
          username: discourseUser.username || discourseUser.name,
          bio: discourseBio?.bio_raw || null,
          website: discourseBio?.website || null,
        },
        transaction,
      },
    );
    return user;
  };
}

export const createAllUsersInCW = async (
  discourseConnection: Sequelize,
  communityId: string,
  { transaction }: { transaction: Transaction },
): Promise<{
  users: Array<z.infer<typeof User>>;
  admins: Record<number, boolean>;
  moderators: Record<number, boolean>;
}> => {
  // fetch users in discourse
  const discourseUsers = await DiscourseQueries.fetchUsers(discourseConnection);
  const emails = discourseUsers.map(({ email }) => `'${email}'`);

  // fetch users in cw
  const cwUsers = await CWQueries.fetchUsersByEmail(communityId, emails);

  // separate existing users from new
  const existingUsers = cwUsers.filter(
    (c) =>
      c.email && discourseUsers.find((d) => d.email && d.email === c.email),
  );
  const usersToCreate = discourseUsers.filter(
    (d) => d.email && !cwUsers.find((c) => c.email && c.email === d.email),
  );

  const allBios = await DiscourseQueries.fetchBiosFromDiscourse(
    discourseConnection,
  );

  // create all new users
  const createdUsersIdAndEmail = await Promise.all(
    usersToCreate.map((userToCreate) =>
      CWQueries.createCWUserFromDiscourseUser(
        userToCreate,
        allBios.find((b) => b.discourse_user_id === userToCreate.id) || null,
        { transaction },
      ),
    ),
  );

  const createdUsers = createdUsersIdAndEmail.map(
    (u) => cwUsers.find((c) => c.email === u.email)!,
  )!;

  const users = [...existingUsers, ...createdUsers];

  return {
    users,
    admins: discourseUsers
      .filter((d) => d.admin)
      .map((d) => cwUsers.find((c) => c.email === d.email)!)
      .reduce((acc, c) => ({
        ...acc,
        [c.id!]: true,
      })),
    moderators: discourseUsers
      .filter((d) => d.moderator)
      .map((d) => cwUsers.find((c) => c.email === d.email)!)
      .reduce((acc, c) => ({
        ...acc,
        [c.id!]: true,
      })),
  };
};
