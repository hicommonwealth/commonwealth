import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { UserObject } from './users';

type DiscourseWebsiteBio = {
  discourse_user_id: number;
  website: string;
  bio_raw: string;
};
const getUserWebsiteBioFromDiscourse = async (
  discourseSession: Sequelize,
): Promise<DiscourseWebsiteBio[]> => {
  return discourseSession.query<DiscourseWebsiteBio>(
    `
    SELECT user_id as discourse_user_id, website, bio_raw
    FROM "user_profiles";
  `,
    { type: QueryTypes.SELECT },
  );
};

export type ProfileObject = { user_id: number; profile_id: number };
const createProfiles = async (
  session: Sequelize,
  data: {
    userId: number;
    profileName: string;
    email: string | null;
    website: string | null;
    bio: string | null;
  }[],
  { transaction }: { transaction: Transaction },
): Promise<ProfileObject[]> => {
  const values: [
    number,
    string,
    string,
    string,
    string | null,
    string | null,
    string | null,
  ][] = [];
  for (const userData of data) {
    values.push([
      userData.userId,
      new Date().toISOString(),
      new Date().toISOString(),
      userData.profileName.replace(/'/g, "''"),
      userData.email,
      userData.website,
      userData.bio,
    ]);
  }

  const result = await session.query(
    `
    INSERT INTO "Profiles"(user_id, created_at, updated_at, profile_name, email, website, bio) VALUES :values
    RETURNING user_id, id as profile_id;
  `,
    {
      type: QueryTypes.INSERT,
      transaction,
      replacements: {
        values,
      },
    },
  );
  return result[0] as unknown as ProfileObject[];
};

export const createAllProfilesInCW = async (
  cwConnection: Sequelize,
  discourseConnection: Sequelize,
  { newUsers }: { newUsers: UserObject[] },
  { transaction }: { transaction: Transaction },
): Promise<ProfileObject[]> => {
  const websiteBios = await getUserWebsiteBioFromDiscourse(discourseConnection);
  const profileData = newUsers.map((u) => {
    const websiteBio = websiteBios.find(
      (w) => w.discourse_user_id === u.discourseUserId,
    );
    return {
      userId: u.id,
      profileName: u.name || u.username,
      email: u.email || null,
      website: websiteBio?.website || null,
      bio: websiteBio?.bio_raw || null,
    };
  });
  return await createProfiles(cwConnection, profileData, { transaction });
};
