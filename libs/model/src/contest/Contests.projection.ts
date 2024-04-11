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
        await models.ContestManager.upsert({
          ...payload,
          communityId: community.id!,
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
        await models.ContestManager.upsert({
          ...payload,
          communityId: community.id!,
          interval: 0,
        });
    },

    ContestStarted: async ({ payload }) => {
      await models.Contest.upsert({
        ...payload,
        contestId: payload.contestId || 0,
      });
    },

    ContestContentAdded: async ({ payload }) => {
      await models.ContestAction.upsert({
        ...payload,
        contestId: payload.contestId || 0,
        address: payload.creator,
        action: 'added',
        contentUrl: payload.url,
        weight: 0,
      });
    },

    ContestContentUpvoted: async ({ payload }) => {
      await models.ContestAction.upsert({
        ...payload,
        contestId: payload.contestId || 0,
        action: 'upvoted',
        contentUrl: '',
      });
    },

    ContestWinnersRecorded: async ({ payload }) => {
      await models.Contest.update(
        {
          winners: payload.winners,
        },
        {
          where: {
            contest: payload.contest,
            contestId: payload.contestId || 0,
          },
        },
      );
    },
  },
});
