import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import moment from 'moment/moment';
import { models } from '../database';
import { authPoll } from '../middleware';
import { mustBeAuthorizedPoll } from '../middleware/guards';

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
      const { poll, address } = mustBeAuthorizedPoll(actor, context);
      if (
        !poll.ends_at &&
        moment(poll.ends_at).utc().isBefore(moment().utc())
      ) {
        throw new InvalidState(CreateVotePollErrors.PollingClosed);
      }

      // TODO: migrate this to be JSONB array of strings in the DB
      let options = JSON.parse(poll.options);
      if (!options.includes(payload.option)) {
        throw new InvalidState(CreateVotePollErrors.InvalidOption);
      }

      return models.Vote.create({
        poll_id: payload.poll_id,
        address: address.address,
        author_community_id: address.community_id,
        community_id: poll.community_id,
        option: payload.option,
      });
    },
  };
}
