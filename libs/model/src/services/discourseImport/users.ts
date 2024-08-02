import { models } from '@hicommonwealth/model';
import { User } from '@hicommonwealth/schemas';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';

export type CWUserWithDiscourseId = z.infer<typeof User> & {
  discourseUserId: number;
};

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

  static fetchBios = async (
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

class CWQueries {
  static fetchImportedUsersByCommunity = async ({
    communityId,
  }: {
    communityId: string;
  }): Promise<Array<z.infer<typeof User>>> => {
    return models.User.findAll({
      include: [
        {
          model: models.Address,
          where: {
            community_id: communityId,
            ghost_address: true,
          },
          required: true,
        },
      ],
    });
  };

  static fetchUsersByEmail = async (
    communityId: string,
    emails: string[],
  ): Promise<Array<z.infer<typeof User>>> => {
    const users = await models.User.findAll({
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
          required: false,
        },
      ],
    });
    return users.map((user) => user.get({ plain: true }));
  };

  static createOrFindUser = async (
    discourseUser: DiscourseUser,
    discourseBio: DiscourseWebsiteBio | null,
    { transaction }: { transaction: Transaction },
  ): Promise<CWUserWithDiscourseId> => {
    const [user] = await models.User.findOrCreate({
      where: {
        email: discourseUser.email,
      },
      defaults: {
        email: discourseUser.email,
        profile: {
          name: discourseUser.username || discourseUser.name,
          bio: discourseBio?.bio_raw || null,
          website: discourseBio?.website || null,
        },
        selected_community_id: null,
        isAdmin: false,
        disableRichText: false,
        emailVerified: false,
        emailNotificationInterval: 'never',
      },
      transaction,
    });
    return {
      ...user.get({ plain: true }),
      discourseUserId: discourseUser.id,
    };
  };
}

export const createAllUsersInCW = async (
  discourseConnection: Sequelize,
  { transaction }: { transaction: Transaction },
): Promise<{
  users: Array<CWUserWithDiscourseId>;
  admins: Record<number, boolean>;
  moderators: Record<number, boolean>;
}> => {
  // fetch users in discourse
  const allDiscourseUsers = await DiscourseQueries.fetchUsers(
    discourseConnection,
  );

  const allBios = await DiscourseQueries.fetchBios(discourseConnection);

  // create or find new users
  const cwUsers = await Promise.all(
    allDiscourseUsers.map((userToCreate) =>
      CWQueries.createOrFindUser(
        userToCreate,
        allBios.find((b) => b.discourse_user_id === userToCreate.id) || null,
        { transaction },
      ),
    ),
  );

  return {
    users: cwUsers,
    admins: allDiscourseUsers
      .filter((d) => d.admin)
      .map((d) => cwUsers.find((c) => c.email === d.email)!)
      .reduce((acc, u) => ({
        ...acc,
        [u.id!]: true,
      })),
    moderators: allDiscourseUsers
      .filter((d) => d.moderator)
      .map((d) => cwUsers.find((c) => c.email === d.email)!)
      .reduce((acc, u) => ({
        ...acc,
        [u.id!]: true,
      })),
  };
};
