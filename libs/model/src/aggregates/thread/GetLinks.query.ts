import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function GetLinks(): Query<typeof schemas.GetLinks> {
  return {
    ...schemas.GetLinks,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { thread_id, link_source, link_identifier } = payload;

      if (thread_id) {
        const thread = await models.Thread.findOne({
          where: { id: thread_id },
        });
        mustExist('Thread', thread);
        return { links: thread.links || undefined };
      }

      if (link_source && link_identifier) {
        const threads = await models.Thread.findAll({
          where: {
            links: {
              [Op.contains]: [
                { source: link_source, identifier: link_identifier },
              ],
            },
          },
        });
        return { threads: threads.map((t) => ({ id: t.id!, title: t.title })) };
      }

      return {};
    },
  };
}
