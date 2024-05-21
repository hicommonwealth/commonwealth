import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { GroupPermissionType } from '@hicommonwealth/schemas';

export async function assertGroupPermission(
  type: GroupPermissionType,
  addressId: number,
  communityId: string,
  models: DB,
) {
  const isInGroup = await models.sequelize.query(
    `
    SELECT reject_reason FROM "Groups" as g JOIN "GroupPermissions" gp ON g.id = gp.group_id 
    JOIN "Memberships" as m ON m.group_id = g.id
    WHERE g.community_id = :communityId AND gp.type = :type AND m.address_id = :addressId;
  `,
    {
      replacements: { type, communityId, addressId },
    },
  );

  if (isInGroup[0][0].reject_reason) {
    throw new AppError(
      `User does not have sufficient permissions to perform action "${type}"`,
    );
  }
}
