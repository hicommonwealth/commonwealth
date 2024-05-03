import { QueryTypes, Sequelize, Transaction } from 'sequelize';

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

export const fetchUsersFromDiscourse = async (
  session: Sequelize,
): Promise<DiscourseUser[]> => {
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

export const fetchImportedUserIdsByChain = async (
  session: Sequelize,
  { communityId }: { communityId: string },
): Promise<{ id: string; email: string }[]> => {
  return session.query<{ id: string; email: string }>(
    `
    SELECT users.id, email
    FROM "Addresses"
    INNER JOIN "Users" users on users.id = user_id
    where ghost_address = true and community_id = '${communityId}';
  `,
    { type: QueryTypes.SELECT },
  );
};

export const fetchUsersWithAddress = async (
  session: Sequelize,
  { userIds, communityId }: { userIds: number[]; communityId: string },
): Promise<{ user_id: number; ghost_address: string | null }[]> => {
  return session.query<{ user_id: number; ghost_address: string }>(
    `
        SELECT user_id, ghost_address FROM "Addresses"
        WHERE community_id = '${communityId}'
        AND user_id in (${userIds})
    `,
    { type: QueryTypes.SELECT },
  );
};

export type ExistingUser = {
  id: number;
  email: string;
  emailVerified: boolean;
  profile_id: number;
};
export const fetchUsersAlreadyInCW = async (
  session: Sequelize,
  emails: string[],
): Promise<ExistingUser[]> => {
  return session.query<ExistingUser>(
    `
        select U.id, U.email, U."emailVerified", P.id as profile_id
        FROM "Users" U
        JOIN "Profiles" P ON P.user_id = U.id
        WHERE U.email in (${emails});
    `,
    { raw: true, type: QueryTypes.SELECT },
  );
};

const createUser = async (
  session: Sequelize,
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
  const [user] = await session.query<{ id: number; email: string }>(
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

export type UserObject = {
  discourseUserId: number;
  id: number;
  email: string;
  isAdmin: boolean;
  isModerator: boolean;
  username: string;
  name: string;
  emailVerified: boolean;
  profile_id?: number;
};

export const createAllUsersInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  { communityId }: { communityId: string },
  { transaction }: { transaction: Transaction },
): Promise<{ newUsers: UserObject[]; existingUsers: UserObject[] }> => {
  // fetch users in discourse
  const discourseUsers = await fetchUsersFromDiscourse(discourseConnection);
  const emails = discourseUsers.map(({ email }) => `'${email}'`);

  // fetch users that already have an address
  const userWithAddresses = await fetchUsersWithAddress(cwConnection, {
    userIds: discourseUsers.map(({ id }) => id),
    communityId,
  });

  //  fetch users in cw
  const cwUsers = await fetchUsersAlreadyInCW(cwConnection, emails);
  const usersAlreadyExistingInCW = cwUsers
    .map(({ id, email, emailVerified, profile_id }): UserObject => {
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
        profile_id,
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

  const userPromises = usersToCreate.map(
    ({ email, admin, username, name, moderator }) =>
      createUser(
        cwConnection,
        { email, isAdmin: admin, isModerator: moderator, username, name },
        { transaction },
      ),
  );
  const userIds = await Promise.all(userPromises);
  const result = userIds.map(
    ({ user, isAdmin, isModerator, username, name }) => {
      const discourseUser = discourseUsers.find(
        ({ email }) => email === user.email,
      );
      if (!discourseUser) {
        throw new Error(
          `Failed to find discourse user by email: ${user.email}`,
        );
      }
      return {
        discourseUserId: discourseUser.id,
        id: user.id,
        email: user.email,
        isAdmin,
        isModerator,
        username,
        name,
        alreadyHasAccountInCW: false,
        emailVerified: false,
      };
    },
  );

  // new users are users that we created as part of the import
  // existing users are users that have already user their email to
  // sign in to commonwealth so they already have profiles but they don't
  // have addresses that puts them in the community
  return {
    newUsers: result as UserObject[],
    existingUsers: usersAlreadyExistingInCW,
  };
};
