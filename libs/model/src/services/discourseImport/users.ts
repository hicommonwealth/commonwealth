import { models, UserAttributes } from '@hicommonwealth/model';
import { User } from '@hicommonwealth/schemas';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { z } from 'zod';

export type CWUserWithDiscourseId = z.infer<typeof User> & {
  discourseUserId: number;
  created: boolean;
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
  static bulkCreateUsers = async (
    entries: {
      discourseUser: DiscourseUser;
      discourseBio: DiscourseWebsiteBio | null;
    }[],
    { transaction }: { transaction: Transaction | null },
  ): Promise<Array<CWUserWithDiscourseId>> => {
    const usersToCreate: UserAttributes[] = entries.map(
      ({ discourseUser, discourseBio }) => ({
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
      }),
    );

    const existingUsers = await models.User.findAll({
      where: {
        [Op.or]: usersToCreate.map((u) => ({ email: u.email })),
      },
    });

    const filteredUsersToCreate = usersToCreate.filter(
      (r) => !existingUsers.find((er) => r.email === er.email),
    );

    const createdUsers = await models.User.bulkCreate(filteredUsersToCreate, {
      transaction,
    });

    return [
      ...existingUsers.map((u) => ({
        ...u.get({ plain: true }),
        created: false,
      })),
      ...createdUsers.map((u) => ({
        ...u.get({ plain: true }),
        created: true,
      })),
    ].map((user) => ({
      ...user,
      discourseUserId: entries.find(
        (e) => e.discourseUser.email === user.email,
      )!.discourseUser.id,
      created: !!createdUsers.find((u) => u.id === user.id),
    }));
  };
}

export const createAllUsersInCW = async (
  discourseConnection: Sequelize,
  { transaction }: { transaction: Transaction | null },
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

  const entries = allDiscourseUsers.map((discourseUser) => ({
    discourseUser,
    discourseBio:
      allBios.find((b) => b.discourse_user_id === discourseUser.id) || null,
  }));

  // create or find new users
  const cwUsers = await CWQueries.bulkCreateUsers(entries, { transaction });

  // return users along with maps of admins and mods
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
