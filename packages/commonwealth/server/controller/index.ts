import { QueryTypes } from 'sequelize';
import { Request, Response } from 'express';
import { DB } from '../models';

export async function getRoles(models: DB, req: Request, res: Response) {
  if (!req.query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }
  const result = await models.sequelize.query(
    `SELECT DISTINCT "RoleAssignments".*, "CommunityRoles".* FROM "Profiles"
    JOIN "Addresses" ON "Addresses"."user_id" = "Profiles"."user_id"
    JOIN "RoleAssignments" ON "RoleAssignments"."address_id" = "Profiles"."user_id"
    JOIN "CommunityRoles" ON "RoleAssignments"."community_role_id" = "CommunityRoles"."id"
    WHERE "Addresses"."address" = :address
    `,
    {
      replacements: { address },
      type: QueryTypes.SELECT,
    }
  );

  return res.json(result);
}
