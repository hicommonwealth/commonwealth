import { Projection, schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

const inputs = {
  RecurringContestManagerDeployed:
    schemas.events.RecurringContestManagerDeployed,
  OneOffContestManagerDeployed: schemas.events.OneOffContestManagerDeployed,
  ContestStarted: schemas.events.ContestStarted,
  ContestContentAdded: schemas.events.ContestContentAdded,
  ContestContentUpvoted: schemas.events.ContestContentUpvoted,
  ContestWinnersRecorded: schemas.events.ContestWinnersRecorded,
};

export const Contests: Projection<typeof inputs> = () => ({
  inputs,
  body: {
    RecurringContestManagerDeployed: async ({ payload }) => {
      const community = await models.Community.findOne({
        where: { namespace: payload.namespace },
        raw: true,
      });
      if (
        mustExist(`Community with namespace: ${payload.namespace}`, community)
      )
        await models.ContestManager.create({
          ...payload,
          community_id: community.id!,
        });
    },

    OneOffContestManagerDeployed: async ({ payload }) => {
      const community = await models.Community.findOne({
        where: { namespace: payload.namespace },
        raw: true,
      });
      if (
        mustExist(`Community with namespace: ${payload.namespace}`, community)
      )
        await models.ContestManager.create({
          ...payload,
          community_id: community.id!,
          interval: 0,
        });
    },

    ContestStarted: async ({ payload }) => {
      await models.Contest.create({
        ...payload,
        contest_id: payload.contest_id || 0,
      });
    },

    ContestContentAdded: async ({ payload }) => {
      await models.ContestAction.create({
        ...payload,
        contest_id: payload.contest_id || 0,
        actor_address: payload.creator_address,
        action: 'added',
        content_url: payload.content_url,
        voting_power: 0,
      });
    },

    ContestContentUpvoted: async ({ payload }) => {
      await models.ContestAction.create({
        ...payload,
        contest_id: payload.contest_id || 0,
        actor_address: payload.voter_address,
        action: 'upvoted',
      });
    },

    ContestWinnersRecorded: async ({ payload }) => {
      await models.Contest.update(
        {
          winners: payload.winners,
        },
        {
          where: {
            contest_address: payload.contest_address,
            contest_id: payload.contest_id || 0,
          },
        },
      );
    },
  },
});
