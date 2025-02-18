import { Command } from '@hicommonwealth/core';
import { createPrivateEvmClient } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../config';
import { models } from '../database';
import { createOnchainContestVote } from '../policies/utils/contest-utils';
import { emitEvent } from '../utils/utils';

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

      // add onchain vote to the first content when no upvotes found in the last hour
      if (!actions.some((action) => action.action === 'upvoted')) {
        const firstContent = actions.find(
          (action) => action.action === 'added',
        );
        await createOnchainContestVote({
          contestManagers: [
            {
              url: chain_url,
              contest_address,
              content_id: firstContent!.content_id,
            },
          ],
          content_url: firstContent!.content_url!,
          author_address: getPrivateWalletAddress(),
        });
      }

      await models.sequelize.transaction(async (transaction) => {
        await models.ContestManager.update(
          { ending: true },
          { where: { contest_address }, transaction },
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
