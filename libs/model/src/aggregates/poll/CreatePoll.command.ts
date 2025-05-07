import { Command, InvalidActor } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import dayjs from 'dayjs';
import { models } from '../../database';
import {
  authThread,
  mustBeAuthorizedThread,
  mustExist,
} from '../../middleware';

export function CreatePoll(): Command<typeof schemas.CreatePoll> {
  return {
    ...schemas.CreatePoll,
    auth: [authThread({ author: true })],
    body: async ({ actor, payload, context }) => {
      const { community_id, thread, address } = await mustBeAuthorizedThread(
        actor,
        context,
      );
      const { prompt, options, custom_duration } = payload;

      const ends_at = custom_duration
        ? dayjs().add(custom_duration, 'days').toDate()
        : null;

      const community = await models.Community.findByPk(community_id);
      mustExist('Community', community);

      // check if admin_only flag is set
      if (community.admin_only_polling && address.role !== 'admin')
        throw new InvalidActor(actor, 'Must be admin to create poll');

      return await models.sequelize.transaction(async (transaction) => {
        thread.has_poll = true;
        await thread.save({ transaction });
        return models.Poll.create(
          {
            community_id,
            thread_id: thread.id!,
            prompt,
            options: JSON.stringify(options),
            ends_at,
          },
          { transaction },
        );
      });
    },
  };
}
