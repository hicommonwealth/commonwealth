import { QueryTypes } from 'sequelize';
import { Request, Response } from 'express';
import { DB } from '../models';
import { PermissionManager, Action } from '../util/permissions';

export async function getRoles(models: DB, req: Request, res: Response) {
  if (!req.query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  const result = await models.sequelize.query(
    `SELECT "RoleAssignments".*, "CommunityRoles".* FROM "Profiles"
    JOIN "Addresses" ON "Addresses"."user_id" = "Profiles"."user_id"
    JOIN "RoleAssignments" ON "RoleAssignments"."address_id" = "Profiles"."user_id"
    JOIN "CommunityRoles" ON "RoleAssignments"."community_role_id" = "CommunityRoles"."id"
    WHERE "Addresses"."address" = :address`,
    {
      replacements: { address },
      type: QueryTypes.SELECT,
    }
  );

  return res.json(result);
}


export async function createRole(models: DB, req: Request, res: Response) {
  if (!req.body) {
    return res.status(400).json({ error: 'No body provided' });
  }

  const { address, role_id } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  if (!role_id) {
    return res.status(400).json({ error: 'No role_id provided' });
  }

  const permissionManager = new PermissionManager(models);

  // only users with the CREATE_ROLE permission can create roles
  if (!permissionManager.isPermitted(Action.CREATE_ROLE)) {
    return res.status(403).json({ error: 'Not authorized to create role' });
  }

  const result = await models.sequelize.query(
    `INSERT INTO "RoleAssignments" (
      "address_id", 
      "community_role_id", 
      "created_at", 
      "updated_at"
    )
    SELECT "Addresses"."user_id", :role_id, NOW(), NOW()
    FROM "Addresses"
    WHERE "Addresses"."address" = :address
    RETURNING "address_id", "community_role_id"
    `,
    {
      replacements: { address, role_id },
      type: QueryTypes.INSERT,
    }
  );

  return res.json(result);
}

export async function updateRole(models: DB, req: Request, res: Response) {
  if (!req.body) {
    return res.status(400).json({ error: 'No body provided' });
  }

  const { address, role_id } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  if (!role_id) {
    return res.status(400).json({ error: 'No role_id provided' });
  }

  const result = await models.sequelize.query(
    `UPDATE "RoleAssignments"
    SET "community_role_id" = :role_id, "updated_at" = NOW()
    FROM "Addresses" a
    JOIN (SELECT "user_id", "address" FROM "Addresses") b ON a."address" = b."address"
    WHERE "address_id" = a."user_id" AND a."address" = :address
    RETURNING "address_id", "community_role_id"
    `,
    {
      replacements: { address, role_id },
      type: QueryTypes.UPDATE,
    }
  );

  return res.json(result);
}
