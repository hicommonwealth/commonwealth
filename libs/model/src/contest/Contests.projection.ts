import { Projection, schemas } from '@hicommonwealth/core';
import { models } from '../database';

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
      if (!community) throw Error('Community with namespace not found');

      await models.ContestManager.create({
        ...payload,
        communityId: community.id!,
      });
    },

    OneOffContestManagerDeployed: async ({ payload }) => {
      const community = await models.Community.findOne({
        where: { namespace: payload.namespace },
        raw: true,
      });
      if (!community) throw Error('Community with namespace not found');

      await models.ContestManager.create({
        ...payload,
        communityId: community.id!,
        interval: 0,
      });
    },

    ContestStarted: async ({ payload }) => {
      await models.Contest.create({
        ...payload,
        contestId: payload.contestId || 0,
      });
    },

    ContestContentAdded: async ({ payload }) => {
      await models.ContestAction.create({
        ...payload,
        contestId: payload.contestId || 0,
        address: payload.creator,
        action: 'added',
        contentUrl: payload.url,
        weight: 0, // TODO: find creator weight
      });
    },

    ContestContentUpvoted: async ({ payload }) => {
      await models.ContestAction.create({
        ...payload,
        contestId: payload.contestId || 0,
        action: 'upvoted',
        contentUrl: '', // TODO: find url in add action,
        weight: 0, // TODO: find actor weight
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
