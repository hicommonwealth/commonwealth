import { sequelize, DB } from '../database';

export enum name {
  Admin = 'admin',
  Moderator = 'moderator',
  Member = 'member',
}

export async function createDefaultCommunityRoles(
  models: DB,
  chain_id: string
): Promise<void> {
  // Create default roles
  const community_roles = [
    { name: name.Admin, permissions: BigInt(0) },
    { name: name.Moderator, permissions: BigInt(0) },
    { name: name.Member, permissions: BigInt(0) },
  ];
  community_roles.map((crole) =>
    models.CommunityRole.create({
      chain_id,
      name: crole.name,
      permissions: crole.permissions,
    })
  );
}
