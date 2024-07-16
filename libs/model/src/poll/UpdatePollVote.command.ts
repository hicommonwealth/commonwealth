import {
  AppError,
  InvalidActor,
  ServerError,
  type Query,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { PermissionEnum } from '@hicommonwealth/schemas';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

type QueryType = {
  ends_at: string;
  options: string;
};

export function UpdatePollVote(): Query<typeof schemas.UpdatePollVote> {
  return {
    ...schemas.UpdatePollVote,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { poll_id, address, option } = payload;

      const query: QueryType = (
        await models.sequelize.query(
          `
            SELECT p.ends_at FROM "Polls" p
            JOIN "Threads" t on t.id = p.thread_id
            JOIN "Addresses" a on a.id = t.address_id
            WHERE p.id = :poll_id AND a.address = :address AND a.user_id = :user_id
            LIMIT 1;
          `,
          {
            replacements: { poll_id, address, user_id: actor.user.id },
            raw: true,
            type: QueryTypes.SELECT,
          },
        )
      )?.[0];

      if (!query) {
        throw new InvalidActor(
          actor,
          `User does not own the address or Poll doesn't exist`,
        );
      }

      if (
        !query.ends_at &&
        moment(query.ends_at).utc().isBefore(moment().utc())
      ) {
        throw new AppError('Polling already finished');
      }

      let pollOptions;
      try {
        pollOptions = JSON.parse(query.options);
      } catch (err) {
        throw new AppError('Failed to parse poll options');
      }

      const selectedOption = pollOptions.find((o: string) => o === option);
      if (!selectedOption) {
        throw new AppError('Invalid response option');
      }

      try {
        // check token balance threshold if needed
        const { isValid } = await validateTopicGroupsMembership(
          this.models,
          // @ts-expect-error StrictNullChecks
          thread.topic_id,
          poll.community_id,
          address,
          PermissionEnum.UPDATE_POLL,
        );
        if (!isValid) {
          throw new AppError(Errors.InsufficientTokenBalance);
        }
      } catch (e) {
        throw new ServerError(Errors.BalanceCheckFailed, e);
      }

      const poll = await models.sequelize.transaction(async (transaction) => {
        await models.Thread.update(
          { has_poll: true },
          { where: { id: thread_id }, transaction },
        );

        console.log(moment().add(custom_duration, 'days').toDate());

        return await models.Poll.create(
          {
            thread_id,
            community_id: query.community_id,
            prompt,
            options: JSON.stringify(options),
            ends_at:
              custom_duration !== undefined
                ? moment().add(custom_duration, 'days').toDate()
                : undefined,
          },
          { transaction },
        );
      });

      return poll.toJSON() as any;
    },
  };
}
