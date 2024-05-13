import Sequelize from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type { ModelInstance, ModelStatic } from './types';

import type { UserAttributes, UserInstance } from './user';

export type ImageAttributes = {
  url: string;
  imageBehavior: string;
};

export type ProfileAttributes = {
  id?: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
  profile_name?: string;
  email?: string;
  promotional_emails_enabled?: boolean | undefined;
  website?: string;
  bio?: string;
  avatar_url?: string;
  slug?: string;
  socials?: string[];
  background_image?: ImageAttributes;

  // associations
  User?: UserAttributes;
  Addresses?: AddressAttributes[];
};

export type ProfileInstance = ModelInstance<ProfileAttributes> & {
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  getAddresses: Sequelize.HasManyGetAssociationsMixin<AddressInstance>;
};

export type ProfileModelStatic = ModelStatic<ProfileInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <ProfileModelStatic>sequelize.define<ProfileInstance>(
    'Profile',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
      profile_name: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      promotional_emails_enabled: { type: Sequelize.BOOLEAN, allowNull: true },
      website: { type: Sequelize.STRING, allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      avatar_url: { type: Sequelize.STRING, allowNull: true },
      slug: { type: Sequelize.STRING, allowNull: true },
      socials: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      background_image: { type: Sequelize.JSONB, allowNull: true },
    },
    {
      tableName: 'Profiles',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['user_id'] }],
    },
  );
