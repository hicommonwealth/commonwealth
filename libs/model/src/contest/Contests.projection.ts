import { AppError, Projection, schemas } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { contractHelpers } from '../services/commonProtocol';

const __filename = fileURLToPath(import.meta.url);
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
  const community = await models.Community.findOne({
    where: { namespace },
    raw: true,
  });
  if (!community?.ChainNode?.url) {
    throw new AppError('Chain Node not found');
  }
  const { ticker, decimals } = await contractHelpers.getTokenAttributes(
    contest_address,
    new Web3(community?.ChainNode?.url),
  );
  // TODO: evaluate errors from contract helpers and how to drive the event queue

  const [updated] = await models.ContestManager.update(
    {
      interval,
      ticker,
      decimals,
    },
    { where: { contest_address }, returning: true },
  );
  if (!updated) {
    // when contest manager metadata is not found, it means it failed creation or was deleted -> alert admins and create default
    const msg = `Missing contest manager [${contest_address}] on namespace [${namespace}]`;
    log.error(msg, new MissingContestManager(msg, namespace, contest_address));

    if (mustExist(`Community with namespace: ${namespace}`, community))
      await models.ContestManager.create({
        contest_address,
        community_id: community.id!,
        interval,
        ticker,
        decimals,
        created_at: new Date(),
        name: community.name,
        image_url: 'http://default.image', // TODO: can we have a default image for this?
        payout_structure: [], // empty payout structure by default
      });
  }
}

export const Contests: Projection<typeof inputs> = () => ({
  inputs,
  body: {
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
      // TODO: can we make this just one sql statement using subqueries?
      const thread = await models.Thread.findOne({
        where: { url: payload.content_url },
        attributes: ['id'],
        raw: true,
      });
      await models.ContestAction.create({
        ...payload,
        contest_id: payload.contest_id || 0,
        actor_address: payload.creator_address,
        action: 'added',
        content_url: payload.content_url,
        thread_id: thread?.id,
        voting_power: 0,
      });
    },

    ContestContentUpvoted: async ({ payload }) => {
      // TODO: can we make this just one sql statement using subqueries?
      const add_action = await models.ContestAction.findOne({
        where: {
          contest_address: payload.contest_address,
          contest_id: payload.contest_id || 0,
          content_id: payload.content_id,
          action: 'added',
        },
        attributes: ['thread_id'],
        raw: true,
      });
      await models.ContestAction.create({
        ...payload,
        contest_id: payload.contest_id || 0,
        actor_address: payload.voter_address,
        action: 'upvoted',
        thread_id: add_action?.thread_id,
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
