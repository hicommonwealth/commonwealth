import {
  EvmRecurringContestEventSignatures,
  EvmSingleContestEventSignatures,
  InvalidState,
  Projection,
  events,
  logger,
} from '@hicommonwealth/core';
import { ContestScore } from '@hicommonwealth/schemas';
import { Op, QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { models, sequelize } from '../database';
import { mustExist } from '../middleware/guards';
import { EvmEventSourceAttributes } from '../models';
import * as protocol from '../services/commonProtocol';
import { getContestStatus } from '../services/commonProtocol/contestHelper';

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
  isOneOff: boolean,
) {
  const community = await models.Community.findOne({
    where: { namespace_address: namespace },
    include: {
      model: models.ChainNode.scope('withPrivateData'),
      required: false,
    },
  });
  const url = community?.ChainNode?.private_url || community?.ChainNode?.url;
  if (!url)
    throw new InvalidState(
      `Chain node url not found on namespace ${namespace}`,
    );

  const { ticker, decimals } =
    await protocol.contractHelpers.getTokenAttributes(contest_address, url);

  await models.sequelize.transaction(async (transaction) => {
    const [updated] = await models.ContestManager.update(
      {
        interval,
        ticker,
        decimals,
      },
      { where: { contest_address }, returning: true, transaction },
    );
    if (!updated) {
      // when contest manager metadata is not found, it means it failed creation or was deleted
      // here we are alerting admins and creating a default entry
      const msg = `Missing contest manager [${contest_address}] on namespace [${namespace}]`;
      log.error(
        msg,
        new MissingContestManager(msg, namespace, contest_address),
      );

      if (mustExist(`Community with namespace: ${namespace}`, community))
        await models.ContestManager.create(
          {
            contest_address,
            community_id: community.id!,
            interval,
            ticker,
            decimals,
            created_at: new Date(),
            name: community.name,
            image_url: 'http://default.image', // TODO: can we have a default image for this?
            payout_structure: [],
          },
          { transaction },
        );
    }

    // create contest
    const { startTime, endTime } = await getContestStatus(
      url,
      contest_address,
      isOneOff,
    );
    await models.Contest.create(
      {
        contest_address,
        start_time: new Date(startTime * 1000),
        end_time: new Date(endTime * 1000),
        contest_id: 0,
      },
      { transaction },
    );

    // create EVM event sources so chain listener will listen to events on new contest contract
    const abiNickname = isOneOff ? 'SingleContest' : 'RecurringContest';
    const contestAbi = await models.ContractAbi.findOne({
      where: { nickname: abiNickname },
    });
    if (mustExist(`Contest ABI with nickname "${abiNickname}"`, contestAbi)) {
      const sigs = isOneOff
        ? EvmSingleContestEventSignatures
        : EvmRecurringContestEventSignatures;
      const sourcesToCreate: EvmEventSourceAttributes[] = Object.keys(sigs).map(
        (eventName) => {
          const eventSignature = (sigs as Record<string, string>)[eventName];
          return {
            chain_node_id: community!.ChainNode!.id!,
            contract_address: contest_address,
            event_signature: eventSignature,
            kind: eventName,
            abi_id: contestAbi.id,
          };
        },
      );
      await models.EvmEventSource.bulkCreate(sourcesToCreate, { transaction });
    }
  });
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
      throw new InvalidState(
        `Chain node url not found on contest ${contest_address}`,
      );

    const { scores, contestBalance } =
      await protocol.contestHelper.getContestScore(
        details.url,
        contest_address,
        contest_id,
      );
    const prizePool =
      (Number(contestBalance) * Number(details.prize_percentage)) / 100;
    const score: z.infer<typeof ContestScore> = scores.map((s, i) => ({
      content_id: s.winningContent.toString(),
      creator_address: s.winningAddress,
      votes: Number(s.voteCount),
      prize:
        i < Number(details.payout_structure.length)
          ? (
              (BigInt(prizePool) * BigInt(details.payout_structure[i])) /
              100n
            ).toString()
          : '0',
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
          false,
        );
      },

      OneOffContestManagerDeployed: async ({ payload }) => {
        // on-chain genesis event
        await updateOrCreateWithAlert(
          payload.namespace,
          payload.contest_address,
          0,
          true,
        );
      },

      // This event is NOT emitted at the start of the contest, but at each interval
      ContestStarted: async ({ payload }) => {
        const contest_id = payload.contest_id || 0;
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
          created_at: new Date(),
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
          created_at: new Date(),
        });
        // update score if vote is less than 1hr old
        setImmediate(() => updateScore(payload.contest_address, contest_id));
      },
    },
  };
}
