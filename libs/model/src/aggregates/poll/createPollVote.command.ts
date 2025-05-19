import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { models } from '../../database';
import { authPoll } from '../../middleware';
import { mustBeAuthorizedPoll } from '../../middleware/guards';
import { getVotingWeight } from '../../services/stakeHelper';

dayjs.extend(utc);

export const CreateVotePollErrors = {
  InvalidOption: 'Invalid response option',
  PollingClosed: 'Polling already finished',
};

export function CreatePollVote(): Command<typeof schemas.CreatePollVote> {
  return {
    ...schemas.CreatePollVote,
    auth: [
      authPoll({
        action: 'UPDATE_POLL',
      }),
    ],
    body: async ({ actor, payload, context }) => {
      const { poll, address, thread } = mustBeAuthorizedPoll(actor, context);
      if (!poll.ends_at && dayjs(poll.ends_at).utc().isBefore(dayjs().utc())) {
        throw new InvalidState(CreateVotePollErrors.PollingClosed);
      }

      // TODO: migrate this to be JSONB array of strings in the DB
      const options = JSON.parse(poll.options);
      if (!options.includes(payload.option)) {
        throw new InvalidState(CreateVotePollErrors.InvalidOption);
      }

      const calculated_voting_weight = await getVotingWeight(
        thread.topic_id,
        address.address,
      );

      // findOrCreate doesn't work because `poll_id` and `option` not
      // optional in the Vote schema
      let vote = await models.Vote.findOne({
        where: {
          poll_id: payload.poll_id,
          user_id: actor.user.id!,
        },
      });
      if (!vote) {
        vote = await models.Vote.create({
          poll_id: payload.poll_id,
          address: address.address,
          user_id: actor.user.id!,
          author_community_id: address.community_id,
          community_id: poll.community_id,
          calculated_voting_weight: calculated_voting_weight?.toString(),
          option: payload.option,
        });
      }

      return vote.toJSON();
    },
  };
}
