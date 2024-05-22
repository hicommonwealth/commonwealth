import { AppError, Projection, events, logger } from '@hicommonwealth/core';
import { ContestScore } from '@hicommonwealth/schemas';
import { Op, QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { config } from '../config';
import { models, sequelize } from '../database';
import { mustExist } from '../middleware/guards';
import * as protocol from '../services/commonProtocol';

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
  RecurringContestManagerDeployed: events.RecurringContestManagerDeployed,
  OneOffContestManagerDeployed: events.OneOffContestManagerDeployed,
  ContestStarted: events.ContestStarted,
  ContestContentAdded: events.ContestContentAdded,
  ContestContentUpvoted: events.ContestContentUpvoted,
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
    include: models.ChainNode.scope('withPrivateData'),
  });
  const url = community?.ChainNode?.private_url || community?.ChainNode?.url;
  if (!url)
    throw new AppError(`Chain node url not found on namespace ${namespace}`);

  const { ticker, decimals } =
    config.NODE_ENV === 'test'
      ? { ticker: 'ETH', decimals: 18 }
      : await protocol.contractHelpers.getTokenAttributes(url, contest_address);

  const [updated] = await models.ContestManager.update(
    {
      interval,
      ticker,
      decimals,
    },
    { where: { contest_address }, returning: true },
  );
  if (!updated) {
    // when contest manager metadata is not found, it means it failed creation or was deleted
    // here we are alerting admins and creating a default entry
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
        payout_structure: [],
      });
  }
}

type ContestDetails = {
  url: string;
  prize_percentage: number;
  payout_structure: number[];
};
/**
 * Gets chain node url from contest address
 */
async function getContestDetails(
  contest_address: string,
): Promise<ContestDetails | undefined> {
  const [result] = await models.sequelize.query<ContestDetails>(
    `
  select
    coalesce(cn.private_url, cn.url) as url,
    cm.prize_percentage,
    cm.payout_structure
  from
    "ContestManagers" cm 
    join "Communities" c on cm.community_id = c.id
    join "ChainNodes" cn on c.chain_node_id = cn.id
  where
    cm.contest_address = :contest_address;
  `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { contest_address },
    },
  );
  return result;
}

/**
 * Updates contest score (eventually winners)
 */
async function updateScore(contest_address: string, contest_id: number) {
  try {
    const details = await getContestDetails(contest_address);
    if (!details?.url)
      throw new AppError(
        `Chain node url not found on contest ${contest_address}`,
      );

    const { scores, contestBalance } =
      await protocol.contestHelper.getContestScore(
        details.url,
        contest_address,
        contest_id,
      );
    const prizePool = (contestBalance * details.prize_percentage) / 100;
    const score: z.infer<typeof ContestScore> = scores.map((s, i) => ({
      content_id: +s.winningContent,
      creator_address: s.winningAddress,
      votes: +s.voteCount,
      prize:
        i < details.payout_structure.length
          ? Math.floor((prizePool * details.payout_structure[i]) / 100)
          : 0,
    }));
    await models.Contest.update(
      {
        score,
        score_updated_at: new Date(),
      },
      {
        where: {
          contest_address: contest_address,
          contest_id,
        },
      },
    );
  } catch (err) {
    err instanceof Error
      ? log.error(err.message, err)
      : log.error(err as string);
  }
}

/**
 * Makes sure all previous contests have an updated score
 */
async function updateEndedContests(
  contest_address: string,
  contest_id: number,
) {
  try {
    const outdated = await models.Contest.findAll({
      where: {
        contest_address: contest_address,
        contest_id: { [Op.lt]: contest_id },
        score_updated_at: { [Op.lte]: sequelize.col('end_time') },
      },
    });
    for (const contest of outdated) {
      await updateScore(contest_address, contest.contest_id);
    }
  } catch (err) {
    err instanceof Error
      ? log.error(err.message, err)
      : log.error(err as string);
  }
}

export function Contests(): Projection<typeof inputs> {
  return {
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
        const contest_id = payload.contest_id || 0;
        await models.Contest.create({
          ...payload,
          contest_id,
        });
        // update winners on ended contests
        contest_id > 0 &&
          setImmediate(() =>
            updateEndedContests(payload.contest_address, contest_id),
          );
      },

      ContestContentAdded: async ({ payload }) => {
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
          created_at: new Date(), // TODO: use protocol util to get creation date
        });
      },

      ContestContentUpvoted: async ({ payload }) => {
        const contest_id = payload.contest_id || 0;
        const add_action = await models.ContestAction.findOne({
          where: {
            contest_address: payload.contest_address,
            contest_id,
            content_id: payload.content_id,
            action: 'added',
          },
          attributes: ['thread_id'],
          raw: true,
        });
        await models.ContestAction.create({
          ...payload,
          contest_id,
          actor_address: payload.voter_address,
          action: 'upvoted',
          thread_id: add_action?.thread_id,
          created_at: new Date(), // TODO: use protocol util to get creation date
        });
        // update score if vote is less than 1hr old
        Date.now() - payload.created_at.getTime() < 1 * 60 * 60 * 1000 &&
          setImmediate(() => updateScore(payload.contest_address, contest_id));
      },
    },
  };
}
