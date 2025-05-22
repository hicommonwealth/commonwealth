import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authThread, mustExist } from '../../middleware';

export function DeleteLinks(): Command<typeof schemas.DeleteLinks> {
  return {
    ...schemas.DeleteLinks,
    auth: [authThread({ roles: ['admin'], author: true })],
    secure: true,
    body: async ({ payload }) => {
      const { thread_id, links } = payload;

      const thread = await models.Thread.findOne({
        where: { id: thread_id },
      });
      mustExist('Thread', thread);

      const keep =
        thread.links?.length || 0 > 0
          ? thread.links!.filter((link) => {
              return !links.some(
                (l) =>
                  l.source === link.source && l.identifier === link.identifier,
              );
            })
          : [];

      if (keep.length !== thread.links?.length || 0) {
        thread.links = keep;
        await thread.save();
      }

      const updated = await models.Thread.findOne({
        where: { id: thread_id },
        include: [
          { model: models.Address, as: 'Address' },
          { model: models.Address, as: 'collaborators' },
          { model: models.Topic, as: 'topic' },
        ],
      });
      return updated!.toJSON();
    },
  };
}
