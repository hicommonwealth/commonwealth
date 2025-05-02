import { InvalidState, Projection, logger } from '@hicommonwealth/core';
import {
  ChildContractNames,
  EvmEventSignatures,
  commonProtocol as cp,
  getContestScore,
  getContestStatus,
  getTokenAttributes,
  getTransaction,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import { events } from '@hicommonwealth/schemas';
import {
  LP_CONTEST_MANAGER_ADDRESS_ANVIL,
  LP_CONTEST_MANAGER_ADDRESS_BASE_MAINNET,
  LP_CONTEST_MANAGER_ADDRESS_BASE_SEPOLIA,
  buildContestLeaderboardUrl,
  buildFarcasterContestFrameUrl,
  getBaseUrl,
  getDefaultContestImage,
} from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { privateKeyToAccount } from 'viem/accounts';
import { z } from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import { EvmEventSourceAttributes } from '../../models';
import { DEFAULT_CONTEST_BOT_PARAMS } from '../../services/openai/parseBotCommand';
import { getWeightedNumTokens } from '../../services/stakeHelper';
import {
  decodeThreadContentUrl,
  getChainNodeUrl,
  publishCast,
} from '../../utils';
import { findActiveContestManager } from '../../utils/findActiveContestManager';

const log = logger(import.meta);

const inputs = {
  RecurringContestManagerDeployed: events.RecurringContestManagerDeployed,
  OneOffContestManagerDeployed: events.OneOffContestManagerDeployed,
  ContestStarted: events.ContestStarted,
  ContestContentAdded: events.ContestContentAdded,
  ContestContentUpvoted: events.ContestContentUpvoted,
};

/**
 * Creates initial contest projection and adds EVM event sources
 */
async function createInitialContest(
  namespace: string,
  contest_address: string,
  interval: number,
  isOneOff: boolean,
  blockNumber: number,
  isTokenGraduation: boolean = false,
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

  const ethChainId = community!.ChainNode!.eth_chain_id!;
  if (!cp.isValidChain(ethChainId)) {
    log.error(
      `Unsupported eth chain id: ${ethChainId} for namespace: ${namespace}`,
    );
    return;
  }

  const { ticker, decimals } = await getTokenAttributes(
    contest_address,
    url,
    true,
    isOneOff,
  );

  const { startTime, endTime, prizeShare, contestToken } =
    await getContestStatus(
      { rpc: url, eth_chain_id: ethChainId },
      contest_address,
      isOneOff,
    );

  await models.sequelize.transaction(async (transaction) => {
    if (isTokenGraduation) {
      // get general topic
      const topic = await models.Topic.findOne({
        where: {
          community_id: community!.id,
          name: 'General',
        },
      });
      if (!topic) {
        log.warn(`General topic not found for community ${community!.id}`);
        return;
      }
      await models.ContestManager.create(
        {
          contest_address,
          interval,
          ticker,
          decimals,
          community_id: community!.id,
          created_at: new Date(),
          name: 'Top Posts of the Week',
          description:
            'Top content of the week gets rewarded by community owned pool',
          image_url: getDefaultContestImage(),
          prize_percentage: prizeShare,
          payout_structure: [50, 35, 15],
          topic_id: topic.id,
          funding_token_address: contestToken,
          is_farcaster_contest: false,
          cancelled: false,
          ended: false,
          environment: config.APP_ENV,
        },
        { transaction },
      );
    }

    const [contestManager] = await models.ContestManager.update(
      {
        interval,
        ticker,
        decimals,
      },
      { where: { contest_address }, returning: true, transaction },
    );
    mustExist('Contest Manager', contestManager);

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

    const childContractName = isOneOff
      ? ChildContractNames.SingleContest
      : ChildContractNames.RecurringContest;

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
          eth_chain_id: ethChainId,
          contract_address: contest_address,
          event_signature: eventSignature,
          contract_name: childContractName,
          parent_contract_address: cp.factoryContracts[ethChainId].factory,
          created_at_block: blockNumber,
        };
      },
    );
    await models.EvmEventSource.bulkCreate(sourcesToCreate, { transaction });
  });
}

type ContestDetails = {
  eth_chain_id: number;
  url: string;
  prize_percentage: number;
  payout_structure: number[];
  interval: number;
};

/**
 * Gets chain node url from contest address
 */
async function getContestDetails(
  contest_address: string,
): Promise<ContestDetails | undefined> {
  const [result] = await models.sequelize.query<ContestDetails>(
    `
        select CN.eth_chain_id,
               cn.private_url,
               cn.url,
               cm.prize_percentage,
               cm.payout_structure,
               cm.interval
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
    ...result,
    url: getChainNodeUrl(result),
  };
}

/**
 * Updates contest score (only works if contest_id is currently active!)
 */
export async function updateScore(contest_address: string, contest_id: number) {
  try {
    const details = await getContestDetails(contest_address);
    if (!details?.url)
      throw new InvalidState(
        `Chain node url not found on contest ${contest_address}`,
      );

    cp.mustBeProtocolChainId(details.eth_chain_id);

    const { scores, contestBalance } = await getContestScore(
      { eth_chain_id: details.eth_chain_id, rpc: details.url },
      contest_address,
      details.prize_percentage,
      details.payout_structure,
      contest_id,
      details.interval === 0,
      true,
    );

    await models.Contest.update(
      {
        score: scores,
        score_updated_at: new Date(),
        contest_balance: contestBalance,
      },
      { where: { contest_address: contest_address, contest_id } },
    );
  } catch (err) {
    err instanceof Error
      ? log.error(err.message, err)
      : log.error(err as string);
  }
}

async function isGraduatedContest(
  payload: z.infer<typeof inputs.RecurringContestManagerDeployed>,
): Promise<boolean> {
  const chain = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      eth_chain_id: payload.eth_chain_id,
    },
  });
  if (!chain) {
    log.warn(
      `ChainNode (${payload.eth_chain_id}) not found for contest ${payload.contest_address}`,
    );
    return false;
  }
  const rpc = chain.private_url || chain.url;
  if (!rpc) {
    log.warn(`Chain node url not found on contest ${payload.contest_address}`);
    return false;
  }

  mustExist('env LAUNCHPAD_PRIVATE_KEY', !!config.WEB3.LAUNCHPAD_PRIVATE_KEY);

  const {
    tx: { from: deployerAddress },
  } = await getTransaction({
    rpc,
    txHash: payload.transaction_hash,
  });

  const account = privateKeyToAccount(
    config.WEB3.LAUNCHPAD_PRIVATE_KEY! as `0x${string}`,
  );

  const lpContestManagerAddresses =
    config.APP_ENV === 'production'
      ? [LP_CONTEST_MANAGER_ADDRESS_BASE_MAINNET]
      : [
          LP_CONTEST_MANAGER_ADDRESS_BASE_SEPOLIA,
          LP_CONTEST_MANAGER_ADDRESS_ANVIL,
        ];
  // compare all addresses as lowercase
  const validDeployers = [...lpContestManagerAddresses, account.address].map(
    (address) => address.toLowerCase(),
  );
  return validDeployers.includes(deployerAddress.toLowerCase());
}

export function Contests(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      RecurringContestManagerDeployed: async ({ payload }) => {
        const contestManager = await findActiveContestManager(
          payload.contest_address,
        );
        if (!contestManager) {
          const isGraduated = await isGraduatedContest(payload);
          if (isGraduated) {
            // onchain contest was created via token graduation
            await createInitialContest(
              payload.namespace,
              payload.contest_address,
              payload.interval,
              false,
              payload.block_number,
              true,
            );
            return;
          }

          // Contest manager should have been created by user, but was not found in this DB.
          // This is usually happens if the contest was created in another environment, e.g. QA/prod.
          log.warn(
            `ContestManager not found for contest ${payload.contest_address}`,
          );
          return;
        }

        // on-chain genesis event
        await createInitialContest(
          payload.namespace,
          payload.contest_address,
          payload.interval,
          false,
          payload.block_number,
        );
      },

      OneOffContestManagerDeployed: async ({ payload }) => {
        const contestManager = await findActiveContestManager(
          payload.contest_address,
        );
        if (!contestManager) {
          log.warn(
            `ContestManager not found for contest ${payload.contest_address}`,
          );
          return;
        }

        // on-chain genesis event
        await createInitialContest(
          payload.namespace,
          payload.contest_address,
          0,
          true,
          payload.block_number,
        );

        // if bot-created farcaster contest, notify author

        if (contestManager?.farcaster_author_cast_hash) {
          await publishCast(
            contestManager.farcaster_author_cast_hash,
            ({ username }) => {
              const {
                payoutStructure: [winner1, winner2, winner3],
                voterShare,
              } = DEFAULT_CONTEST_BOT_PARAMS;
              // eslint-disable-next-line max-len
              return `Hey @${username}, your contest has been created. The prize distribution is ${winner1}% to winner, ${winner2}% to second place, ${winner3}% to third , and ${voterShare}% going to voters. The contest will run for 7 days. Anyone who replies to a cast containing the frame enters the contest.`;
            },
            {
              // eslint-disable-next-line max-len
              embed: `${getBaseUrl(config.APP_ENV, config.CONTESTS.FARCASTER_NGROK_DOMAIN!)}${buildFarcasterContestFrameUrl(payload.contest_address)}`,
            },
          );
        }
      },

      ContestStarted: async ({ payload }) => {
        // ignore ContestStarted events from OneOff/Single contests
        if (payload.contest_id !== 0) {
          await models.Contest.create(payload);
        }
      },

      ContestContentAdded: async ({ payload }) => {
        const contestManager = await findActiveContestManager(
          payload.contest_address,
        );
        if (!contestManager) {
          log.warn(
            `ContestManager not found for contest ${payload.contest_address}`,
          );
          return;
        }

        const { threadId, farcasterInfo } = decodeThreadContentUrl(
          payload.content_url,
        );

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

        // post confirmation via FC bot
        if (farcasterInfo) {
          const leaderboardUrl = buildContestLeaderboardUrl(
            getBaseUrl(config.APP_ENV),
            contestManager!.community_id,
            contestManager!.contest_address,
          );
          await publishCast(
            farcasterInfo.replyCastHash,
            ({ username }) =>
              `Hey @${username}, your entry has been submitted to the contest: ${leaderboardUrl}`,
          );
        }
      },

      ContestContentUpvoted: async ({ payload }) => {
        const contest_id = payload.contest_id || 0;
        const add_action = await models.ContestAction.findOne({
          where: {
            contest_address: payload.contest_address,
            content_id: payload.content_id,
            action: 'added',
          },
          include: [
            {
              model: models.ContestManager,
              include: [
                {
                  model: models.Community,
                  include: [
                    {
                      model: models.ChainNode.scope('withPrivateData'),
                    },
                  ],
                },
              ],
            },
          ],
        });
        if (!add_action) {
          log.warn(
            `ContestAction not found for contest ${payload.contest_address}`,
          );
          return;
        }

        let calculated_voting_weight: string | undefined;

        if (
          BigInt(payload.voting_power || 0) > BigInt(0) &&
          add_action?.ContestManager?.vote_weight_multiplier
        ) {
          const { eth_chain_id } =
            add_action!.ContestManager!.Community!.ChainNode!;
          const { funding_token_address, vote_weight_multiplier } =
            add_action!.ContestManager!;
          const numTokens = await getWeightedNumTokens(
            payload.voter_address,
            funding_token_address!,
            eth_chain_id!,
            vote_weight_multiplier!,
          );
          calculated_voting_weight = numTokens.toString();
        }

        await models.ContestAction.upsert({
          ...payload,
          contest_id,
          actor_address: payload.voter_address,
          action: 'upvoted',
          thread_id: add_action!.thread_id,
          content_url: add_action!.content_url,
          created_at: new Date(),
          calculated_voting_weight,
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setImmediate(() => updateScore(payload.contest_address, contest_id));
      },
    },
  };
}
