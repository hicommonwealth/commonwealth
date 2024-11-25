import { BigNumber } from '@ethersproject/bignumber';
import { InvalidState, Projection, events, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { ContestScore } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { EvmEventSourceAttributes } from '../models';
import * as protocol from '../services/commonProtocol';
import { decodeThreadContentUrl, getChainNodeUrl } from '../utils';

const log = logger(import.meta);

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

// TODO: remove kind column from EvmEventSources
const signatureToKind = {
  [EvmEventSignatures.Contests.ContentAdded]: 'ContentAdded',
  [EvmEventSignatures.Contests.RecurringContestStarted]: 'ContestStarted',
  [EvmEventSignatures.Contests.RecurringContestVoterVoted]: 'VoterVoted',
  [EvmEventSignatures.Contests.SingleContestStarted]: 'ContestStarted',
  [EvmEventSignatures.Contests.SingleContestVoterVoted]: 'VoterVoted',
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
  const url = community?.ChainNode?.private_url;
  if (!url) {
    log.warn(`Chain node url not found on namespace ${namespace}`);
    return;
  }

  const { ticker, decimals } =
    await protocol.contractHelpers.getTokenAttributes(
      contest_address,
      url,
      true,
    );

  const { startTime, endTime } = await protocol.contestHelper.getContestStatus(
    url,
    contest_address,
    isOneOff,
  );

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
      mustExist(`Community with namespace: ${namespace}`, community);

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
          is_farcaster_contest: false,
        },
        { transaction },
      );
    }

    // create first contest instance
    await models.Contest.create(
      {
        contest_address,
        start_time: new Date(startTime * 1000),
        end_time: new Date(endTime * 1000),
        contest_id: 0,
      },
      { transaction },
    );

    // TODO: move EVM concerns out of projection
    // create EVM event sources so chain listener will listen to events on new contest contract
    const abiNickname = isOneOff ? 'SingleContest' : 'RecurringContest';
    const contestAbi = await models.ContractAbi.findOne({
      where: { nickname: abiNickname },
    });
    mustExist(`Contest ABI with nickname "${abiNickname}"`, contestAbi);

    const sigs = isOneOff
      ? [
          EvmEventSignatures.Contests.ContentAdded,
          EvmEventSignatures.Contests.SingleContestStarted,
          EvmEventSignatures.Contests.SingleContestVoterVoted,
        ]
      : [
          EvmEventSignatures.Contests.ContentAdded,
          EvmEventSignatures.Contests.RecurringContestStarted,
          EvmEventSignatures.Contests.RecurringContestVoterVoted,
        ];
    const sourcesToCreate: EvmEventSourceAttributes[] = sigs.map(
      (eventSignature) => {
        return {
          chain_node_id: community!.ChainNode!.id!,
          contract_address: contest_address,
          event_signature: eventSignature,
          kind: signatureToKind[eventSignature],
          abi_id: contestAbi.id!,
        };
      },
    );
    await models.EvmEventSource.bulkCreate(sourcesToCreate, { transaction });
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
  const [result] = await models.sequelize.query<
    ContestDetails & { private_url: string }
  >(
    `
        select cn.private_url,
               cn.url,
               cm.prize_percentage,
               cm.payout_structure
        from "ContestManagers" cm
                 join "Communities" c on cm.community_id = c.id
                 join "ChainNodes" cn on c.chain_node_id = cn.id
        where cm.contest_address = :contest_address;
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { contest_address },
    },
  );

  return {
    url: getChainNodeUrl(result),
    prize_percentage: result.prize_percentage,
    payout_structure: result.payout_structure,
  };
}

/**
 * Updates contest score (only works if contest_id is currently active!)
 */
export async function updateScore(contest_address: string, contest_id: number) {
  try {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address,
      },
    });
    const oneOff = contestManager!.interval === 0;

    const details = await getContestDetails(contest_address);
    if (!details?.url)
      throw new InvalidState(
        `Chain node url not found on contest ${contest_address}`,
      );

    const { scores, contestBalance } =
      await protocol.contestHelper.getContestScore(
        details.url,
        contest_address,
        undefined,
        oneOff,
      );

    const prizePool = BigNumber.from(contestBalance)
      .mul(oneOff ? 100 : details.prize_percentage)
      .div(100);
    const score: z.infer<typeof ContestScore> = scores.map((s, i) => ({
      content_id: s.winningContent.toString(),
      creator_address: s.winningAddress,
      votes: BigNumber.from(s.voteCount).toString(),
      prize:
        i < Number(details.payout_structure.length)
          ? BigNumber.from(prizePool)
              .mul(details.payout_structure[i])
              .div(100)
              .toString()
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

      // This happens for each recurring contest _after_ the initial contest
      ContestStarted: async ({ payload }) => {
        const contest_id = payload.contest_id!;
        await models.Contest.create({
          ...payload,
          contest_id,
        });
      },

      ContestContentAdded: async ({ payload }) => {
        const { threadId } = decodeThreadContentUrl(payload.content_url);
        await models.ContestAction.create({
          ...payload,
          contest_id: payload.contest_id || 0,
          actor_address: payload.creator_address,
          action: 'added',
          content_url: payload.content_url,
          thread_id: threadId,
          voting_power: '0',
          created_at: new Date(),
        });
      },

      ContestContentUpvoted: async ({ payload }) => {
        const contest_id = payload.contest_id || 0;
        const add_action = await models.ContestAction.findOne({
          where: {
            contest_address: payload.contest_address,
            content_id: payload.content_id,
            action: 'added',
          },
          raw: true,
        });
        await models.ContestAction.upsert({
          ...payload,
          contest_id,
          actor_address: payload.voter_address,
          action: 'upvoted',
          thread_id: add_action!.thread_id,
          content_url: add_action!.content_url,
          created_at: new Date(),
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setImmediate(() => updateScore(payload.contest_address, contest_id));
      },
    },
  };
}
