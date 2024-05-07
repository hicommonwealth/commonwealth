import { CommentCreated, Policy, ThreadCreated, ThreadUpvoted } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas'
import { ContestHelper } from '../services/commonProtocol';

// TODO: clarify the inputs

const inputs = {
  ThreadCreated: ThreadCreated,
  ThreadUpvoted: ThreadUpvoted,
  CommentCreated: CommentCreated,
};

// export const ThreadEvent = z.object({
//   userAddress: z.string(),
//   chainNodeUrl: z
//     .string()
//     .optional()
//     .describe('used for onchain contract calls'),
//   contestAddress: z
//     .string()
//     .optional()
//     .describe('the contest contract address'),
// });
// export const ThreadCreated = ThreadEvent.extend({
//   contentUrl: z.string().describe('the CW content URL'),
// });
// export const ThreadUpvoted = ThreadEvent.extend({
//   contentId: z.string().optional().describe('the onchain content ID'),
// });

export const ContestWorker: Policy<typeof inputs> = ({
  inputs,
  body: {
    ThreadCreated: async ({ payload }) => {
      const { userAddress, contentUrl, chainNodeUrl, contestAddress } = payload;

      const web3Client = await ContestHelper.createWeb3Provider(
        chainNodeUrl!,
        process.env.PRIVATE_KEY!,
      );

      await ContestHelper.addContent(
        web3Client,
        contestAddress!,
        userAddress,
        contentUrl,
      );
    },
    ThreadUpvoted: async ({ payload }) => {
      const { userAddress, chainNodeUrl, contestAddress, contentId } = payload;

      const web3Client = await ContestHelper.createWeb3Provider(
        chainNodeUrl!,
        process.env.PRIVATE_KEY!,
      );

      await ContestHelper.voteContent(
        web3Client,
        contestAddress!,
        userAddress,
        contentId!,
      );
    },
  };
}
