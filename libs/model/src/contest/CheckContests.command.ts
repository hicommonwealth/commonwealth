import { Actor, logger, query, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import moment from 'moment';
import Web3 from 'web3';
import { config } from '../config';
import { createOnchainContestVote } from '../policies/contest-utils';
import { GetActiveContestManagers } from './GetActiveContestManagers.query';

const log = logger(import.meta);

const getPrivateWalletAddress = () => {
  const web3 = new Web3();
  const privateKey = config.WEB3.PRIVATE_KEY;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const publicAddress = account.address;
  return publicAddress;
};

export function CheckContests(): Command<typeof schemas.CheckContests> {
  return {
    ...schemas.CheckContests,
    auth: [],
    body: async () => {
      const activeContestManagers = await query(GetActiveContestManagers(), {
        actor: {} as Actor,
        payload: {},
      });
      // find active contests that have content with no upvotes and will end in one hour
      const contestsWithoutVote = activeContestManagers!.filter(
        (contestManager) =>
          contestManager.actions.some((action) => action.action === 'added') &&
          !contestManager.actions.some(
            (action) => action.action === 'upvoted',
          ) &&
          moment(contestManager.end_time).diff(moment(), 'minutes') < 60,
      );

      const promises = contestsWithoutVote.map(async (contestManager) => {
        // add onchain vote to the first content
        const firstContent = contestManager.actions.find(
          (action) => action.action === 'added',
        );

        await createOnchainContestVote({
          contestManagers: [
            {
              url: contestManager.url,
              contest_address: contestManager.contest_address,
              content_id: firstContent!.content_id,
            },
          ],
          content_url: firstContent!.content_url!,
          author_address: getPrivateWalletAddress(),
        });
      });

      const promiseResults = await Promise.allSettled(promises);

      const errors = promiseResults
        .filter(({ status }) => status === 'rejected')
        .map(
          (result) =>
            (result as PromiseRejectedResult).reason || '<unknown reason>',
        );

      if (errors.length > 0) {
        log.warn(`CheckContests: failed with errors: ${errors.join(', ')}"`);
      }
    },
  };
}
