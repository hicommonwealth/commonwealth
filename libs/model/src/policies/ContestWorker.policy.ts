import { schemas, type Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/model';

const inputs = {
  ThreadCreated: schemas.events.ThreadCreated,
  ThreadUpvoted: schemas.events.ThreadUpvoted,
  CommentCreated: schemas.events.CommentCreated,
};

export const ContestWorker: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    ThreadCreated: async ({ payload }) => {
      const { userAddress, contentUrl, chainNodeUrl, contestAddress } = payload;

      const web3Client = await commonProtocol.contestHelper.createWeb3Provider(
        chainNodeUrl!,
        process.env.PRIVATE_KEY!,
      );

      await commonProtocol.contestHelper.addContent(
        web3Client,
        contestAddress!,
        userAddress,
        contentUrl,
      );
    },
    ThreadUpvoted: async ({ payload }) => {
      const { userAddress, chainNodeUrl, contestAddress, contentId } = payload;

      const web3Client = await commonProtocol.contestHelper.createWeb3Provider(
        chainNodeUrl!,
        process.env.PRIVATE_KEY!,
      );

      await commonProtocol.contestHelper.voteContent(
        web3Client,
        contestAddress!,
        userAddress,
        contentId!,
      );
    },
    CommentCreated: async ({ name, payload }) => {
      console.log(name, payload.comment);
    },
  },
});
