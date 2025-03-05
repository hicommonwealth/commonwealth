import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';

export function UpdateResourceTimestamps(): Command<
  typeof schemas.UpdateResourceTimestamps
> {
  return {
    ...schemas.UpdateResourceTimestamps,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      const { date_field_name, date_field_value, resource_id, resource_name } =
        payload;

      const sql = `UPDATE "${resource_name}" SET ${date_field_name} = :date_field_value WHERE id = :resource_id`;

      const result = await models.sequelize.query(sql, {
        replacements: {
          date_field_name,
          date_field_value,
          resource_id,
        },
        type: QueryTypes.UPDATE,
      });

      return {
        success: result[1] > 0,
      };
    },
  };
}
