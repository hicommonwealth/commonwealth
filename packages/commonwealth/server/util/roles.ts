import { sequelize, DB } from '../database';

export async function createDefaultRoles(models: DB, chain_id: string): Promise<void> {
  // Create default roles
  const community_roles = [
    { name: 'admin', permissions: BigInt(0) },
    { name: 'moderator', permissions: BigInt(0) },
    { name: 'member', permissions: BigInt(0) },
  ];
  Promise.all(
    community_roles.map((crole) =>
      models.CommunityRole.create({
        chain_id,
        name: crole.name,
        permissions: crole.permissions,
      })
    )
  )
    .then(() => resolve())
    .catch((err) => reject(err));
}
