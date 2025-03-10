import { Command, logger } from '@hicommonwealth/core';
import {
  createPrivateEvmClient,
  getContestScore,
  mustBeProtocolChainId,
} from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { createOnchainContestVote } from '../policies/utils/contest-utils';
import { emitEvent, getChainNodeUrl } from '../utils/utils';

const log = logger(import.meta);

const getPrivateWalletAddress = (): string => {
  const web3 = createPrivateEvmClient({ privateKey: config.WEB3.PRIVATE_KEY });
  return web3.eth.defaultAccount!;
};

export function SetContestEnding(): Command<typeof schemas.SetContestEnding> {
  return {
    ...schemas.SetContestEnding,
    auth: [],
    body: async ({ payload }) => {
      const { contest_address, contest_id, actions, chain_url, is_one_off } =
        payload;

      const contestManager = await models.ContestManager.findByPk(
        contest_address,
        {
          include: [
            {
              model: models.Community,
              required: true,
              include: [
                {
                  model: models.ChainNode.scope('withPrivateData'),
                  required: true,
                },
              ],
            },
          ],
        },
      );
      mustExist('Contest Manager', contestManager);

      const eth_chain_id = contestManager.Community!.ChainNode!.eth_chain_id;
      mustBeProtocolChainId(eth_chain_id);

      // add onchain vote to the first content when no upvotes found in the last hour

      // NOTE: on dev environments where contests last 1 hour, this may cause issues
      // during testing, so use DISABLE_CONTEST_ENDING_VOTE locally
      if (!actions.some((action) => action.action === 'upvoted')) {
        if (config.CONTESTS.DISABLE_CONTEST_ENDING_VOTE) {
          log.warn(
            'Skipped contest ending upvote, DISABLE_CONTEST_ENDING_VOTE is enabled',
          );
        } else {
          const firstContent = actions.find(
            (action) => action.action === 'added',
          );
          await createOnchainContestVote({
            contestManagers: [
              {
                url: chain_url,
                eth_chain_id,
                contest_address,
                content_id: firstContent!.content_id,
              },
            ],
            content_url: firstContent!.content_url!,
            author_address: getPrivateWalletAddress(),
          });
        }
      }

      const rpc = getChainNodeUrl({
        url: chain_url,
        private_url:
          contestManager.Community!.ChainNode?.private_url ||
          contestManager.Community!.ChainNode?.url,
      });
      const { contestBalance, scores } = await getContestScore(
        { rpc, eth_chain_id },
        contestManager.contest_address,
        contestManager.prize_percentage || 0,
        contestManager.payout_structure,
        contest_id,
        is_one_off,
      );

      await models.sequelize.transaction(async (transaction) => {
        await models.ContestManager.update(
          { ending: true },
          { where: { contest_address }, transaction },
        );
        await models.Contest.update(
          { contest_balance: contestBalance, score: scores },
          { where: { contest_address, contest_id }, transaction },
        );
        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'ContestEnding',
              event_payload: {
                contest_address,
                contest_id,
                is_one_off,
              },
            },
          ],
          transaction,
        );
      });

      return {};
    },
  };
}
