import { QueryTypes } from 'sequelize';
import type { Request, Response } from 'express';
import type { DB } from '../models';
import { PermissionManager, Action } from 'commonwealth/shared/permissions';
import { isAddressPermitted } from '../util/roles';

export async function getRoles(models: DB, req: Request, res: Response) {
  if (!req.query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  const result = await models.sequelize.query(
    `SELECT "Memberships".*, "MemberClasses".* FROM "Profiles"
    JOIN "Addresses" ON "Addresses"."user_id" = "Profiles"."user_id"
    JOIN "Memberships" ON "Memberships"."address_id" = "Profiles"."user_id"
    JOIN "MemberClasses" ON "Memberships"."member_class_id" = "MemberClasses"."id"
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

  const { address, role_id, address_id, chain_id } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  if (!role_id) {
    return res.status(400).json({ error: 'No role_id provided' });
  }

  const permitted = await isAddressPermitted(
    models,
    address_id,
    chain_id,
    Action.CREATE_ROLE
  );
  if (!permitted) {
    return res.status(403).json({ error: 'Not permitted to create role' });
  }

  const result = await models.sequelize.query(
    `INSERT INTO "Memberships" (
      "address_id",
      "member_class_id",
      "created_at",
      "updated_at"
    )
    SELECT "Addresses"."user_id", :role_id, NOW(), NOW()
    FROM "Addresses"
    WHERE "Addresses"."address" = :address
    RETURNING "address_id", "member_class_id"
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

  const { address, role_id, address_id, chain_id } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  if (!role_id) {
    return res.status(400).json({ error: 'No role_id provided' });
  }

  const permitted = await isAddressPermitted(
    models,
    address_id,
    chain_id,
    Action.EDIT_ROLE
  );
  if (!permitted) {
    return res
      .status(403)
      .json({ error: 'Not permitted to create permission' });
  }

  const result = await models.sequelize.query(
    `UPDATE "Memberships"
    SET "member_class_id" = :role_id, "updated_at" = NOW()
    FROM "Addresses" a
    JOIN (SELECT "user_id", "address" FROM "Addresses") b ON a."address" = b."address"
    WHERE "address_id" = a."user_id" AND a."address" = :address
    RETURNING "address_id", "member_class_id"
    `,
    {
      replacements: { address, role_id },
      type: QueryTypes.UPDATE,
    }
  );

  return res.json(result);
}

export async function getPermissions(models: DB, req: Request, res: Response) {
  if (!req.query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  const result = await models.sequelize.query(
    `SELECT "Permissions".* FROM "Profiles"
    JOIN "Addresses" ON "Addresses"."user_id" = "Profiles"."user_id"
    JOIN "Memberships" ON "Memberships"."address_id" = "Profiles"."user_id"
    JOIN "MemberClasses" ON "Memberships"."member_class_id" = "MemberClasses"."id"
    JOIN "Permissions" ON "Permissions"."member_class_id" = "MemberClasses"."id"
    WHERE "Addresses"."address" = :address`,
    {
      replacements: { address },
      type: QueryTypes.SELECT,
    }
  );

  return res.json(result);
}

export async function createPermission(
  models: DB,
  req: Request,
  res: Response
) {
  if (!req.body) {
    return res.status(400).json({ error: 'No body provided' });
  }

  const { address, permission_id, address_id, chain_id } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  if (!permission_id) {
    return res.status(400).json({ error: 'No permission_id provided' });
  }

  const permitted = await isAddressPermitted(
    models,
    address_id,
    chain_id,
    Action.CREATE_PERMISSION
  );
  if (!permitted) {
    return res
      .status(403)
      .json({ error: 'Not permitted to create permission' });
  }

  const result = await models.sequelize.query(
    `INSERT INTO "Permissions" (
      "member_class_id",
      "action",
      "created_at",
      "updated_at"
    )
    SELECT "MemberClasses"."id", :permission_id, NOW(), NOW()
    FROM "Memberships"
    JOIN "MemberClasses" ON "Memberships"."member_class_id" = "MemberClasses"."id"
    JOIN "Addresses" ON "Addresses"."user_id" = "Memberships"."address_id"
    WHERE "Addresses"."address" = :address
    RETURNING "member_class_id", "action"
    `,
    {
      replacements: { address, permission_id },
      type: QueryTypes.INSERT,
    }
  );

  return res.json(result);
}

export async function updatePermission(
  models: DB,
  req: Request,
  res: Response
) {
  if (!req.body) {
    return res.status(400).json({ error: 'No body provided' });
  }

  const { address, address_id, chain_id, permission_id } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'No address provided' });
  }

  if (!permission_id) {
    return res.status(400).json({ error: 'No permission_id provided' });
  }

  const permitted = await isAddressPermitted(
    models,
    address_id,
    chain_id,
    Action.EDIT_PERMISSIONS
  );
  if (!permitted) {
    return res.status(403).json({ error: 'Not permitted to edit permission' });
  }

  const result = await models.sequelize.query(
    `UPDATE "Permissions"
    SET "action" = :permission
    FROM "Memberships"
    JOIN "MemberClasses" ON "Memberships"."member_class_id" = "MemberClasses"."id"
    JOIN "Addresses" ON "Addresses"."user_id" = "Memberships"."address_id"
    WHERE "Permissions"."member_class_id" = "MemberClasses"."id" AND "Addresses"."address" = :address
    RETURNING "member_class_id", "action"
    `,
    {
      replacements: { address, permission_id },
      type: QueryTypes.UPDATE,
    }
  );

  return res.json(result);
}
