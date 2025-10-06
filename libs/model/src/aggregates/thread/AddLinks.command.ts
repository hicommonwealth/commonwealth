import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authThread, mustExist } from '../../middleware';

export function AddLinks(): Command<typeof schemas.AddLinks> {
  return {
    ...schemas.AddLinks,
    auth: [authThread({ roles: ['admin'], author: true })],
    secure: true,
    body: async ({ payload }) => {
      const { thread_id, links } = payload;

      const thread = await models.Thread.findOne({
        where: { id: thread_id },
      });
      mustExist('Thread', thread);

      const new_links =
        links.length > 0
          ? thread.links
            ? links.filter((link) => {
                return !thread.links!.some(
                  (l) =>
                    l.source === link.source &&
                    l.identifier === link.identifier,
                );
              })
            : links
          : [];

      if (new_links.length > 0) {
        thread.links = thread.links
          ? thread.links.concat(new_links)
          : new_links;
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

      return {
        ...updated!.toJSON(),
        new_links,
      };
    },
  };
}
