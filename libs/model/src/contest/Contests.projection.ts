import { Projection, schemas } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

const log = logger(__filename);
export class MissingContestManager extends Error {
  constructor(
    message: string,
    public readonly namespace: string,
    public readonly contest_address: string,
  ) {
    super(message);
    this.name = 'Missing Contest Manager';
  }
}

const inputs = {
  ContestManagerMetadataCreated: schemas.events.ContestManagerMetadataCreated,
  ContestManagerMetadataUpdated: schemas.events.ContestManagerMetadataUpdated,
  RecurringContestManagerDeployed:
    schemas.events.RecurringContestManagerDeployed,
  OneOffContestManagerDeployed: schemas.events.OneOffContestManagerDeployed,
  ContestStarted: schemas.events.ContestStarted,
  ContestContentAdded: schemas.events.ContestContentAdded,
  ContestContentUpvoted: schemas.events.ContestContentUpvoted,
  ContestWinnersRecorded: schemas.events.ContestWinnersRecorded,
};

/**
 * Makes sure contest manager (off-chain metadata) record exists
 * - Alerts when not found and inserts default record to patch distributed transaction
 */
async function updateOrCreateWithAlert(
  namespace: string,
  contest_address: string,
  interval: number,
) {
  const [updated] = await models.ContestManager.update(
    {
      interval,
    },
    { where: { contest_address }, returning: true },
  );
  if (!updated) {
    // when contest manager metadata is not found, it means it failed creation or was deleted -> alert admins and create default
    const msg = `Missing contest manager [${contest_address}] on namespace [${namespace}]`;
    log.error(msg, new MissingContestManager(msg, namespace, contest_address));

    const community = await models.Community.findOne({
      where: { namespace },
      raw: true,
    });
    if (mustExist(`Community with namespace: ${namespace}`, community))
      await models.ContestManager.create({
        contest_address,
        community_id: community.id!,
        interval,
        created_at: new Date(),
        name: community.name,
        image_url: 'http://default.image', // TODO: can we have a default image for this?
        payout_structure: [], // empty payout structure until fixed
      });
  }
}

export const Contests: Projection<typeof inputs> = () => ({
  inputs,
  body: {
    ContestManagerMetadataCreated: async ({ payload }) => {
      // off-chain genesis event
      const community = await models.Community.findOne({
        where: { id: payload.community_id },
        raw: true,
      });
      if (mustExist(`Community: ${payload.community_id}`, community))
        await models.ContestManager.create({
          ...payload,
          interval: 0, // TODO: @masvelio should we pass interval?
        });
    },

    ContestManagerMetadataUpdated: async ({ payload }) => {
      await models.ContestManager.update(
        {
          name: payload.name,
          image_url: payload.image_url,
        },
        {
          where: {
            contest_address: payload.contest_address,
          },
        },
      );
      // TODO: add/remove topics
    },

    RecurringContestManagerDeployed: async ({ payload }) => {
      // on-chain genesis event
      await updateOrCreateWithAlert(
        payload.namespace,
        payload.contest_address,
        payload.interval,
      );
    },

    OneOffContestManagerDeployed: async ({ payload }) => {
      // on-chain genesis event
      await updateOrCreateWithAlert(
        payload.namespace,
        payload.contest_address,
        0,
      );
    },

    ContestStarted: async ({ payload }) => {
      await models.Contest.create({
        ...payload,
        contest_id: payload.contest_id || 0,
      });
    },

    ContestContentAdded: async ({ payload }) => {
      // TODO: link thread
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
      // TODO: link thread
      await models.ContestAction.create({
        ...payload,
        contest_id: payload.contest_id || 0,
        actor_address: payload.voter_address,
        action: 'upvoted',
      });
    },

    ContestWinnersRecorded: async ({ payload }) => {
      // TODO: set prizes
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
